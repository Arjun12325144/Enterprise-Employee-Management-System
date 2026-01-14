using System.Text;
using EMS.Application.Interfaces;
using EMS.Infrastructure.Data;
using EMS.Infrastructure.Repositories;
using EMS.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace EMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database - Support PostgreSQL (Render/Railway), SQLite (dev), or SQL Server
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        var aspnetEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            // Production: Use PostgreSQL
            if (aspnetEnv == "Production")
            {
                if (!string.IsNullOrEmpty(databaseUrl))
                {
                    // Parse DATABASE_URL (postgres://user:pass@host:port/database or postgres://user:pass@host/database)
                    var uri = new Uri(databaseUrl);
                    var userInfo = uri.UserInfo.Split(':');
                    var host = uri.Host;
                    var port = uri.Port > 0 ? uri.Port : 5432; // Default PostgreSQL port
                    var database = uri.AbsolutePath.TrimStart('/');
                    var username = userInfo[0];
                    var password = userInfo.Length > 1 ? userInfo[1] : "";
                    
                    var npgsqlConnectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
                    options.UseNpgsql(npgsqlConnectionString);
                }
                else if (!string.IsNullOrEmpty(connectionString) && connectionString.Contains("Host="))
                {
                    // Direct PostgreSQL connection string
                    options.UseNpgsql(connectionString);
                }
                else
                {
                    // Fallback to SQLite even in production (for testing)
                    options.UseSqlite("Data Source=EMS.db");
                }
            }
            else
            {
                // Development: Use SQLite
                options.UseSqlite(connectionString ?? "Data Source=EMS.db");
            }
        });

        // Repositories
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<INotificationService, NotificationService>();
        
        // AI Service with HttpClient
        services.AddHttpClient<IAIService, AIService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        // JWT Authentication
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key not configured");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
            options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole("Admin", "Manager"));
            options.AddPolicy("AllRoles", policy => policy.RequireRole("Admin", "Manager", "Employee"));
        });

        return services;
    }
}
