using EMS.Application;
using EMS.Infrastructure;
using EMS.Infrastructure.Data;
using EMS.API.Middleware;
using EMS.API.Services;
using EMS.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/ems-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Current user service
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Controllers with JSON enum string support
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// CORS - Allow production and development origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        var allowedOrigins = new List<string> 
        { 
            "http://localhost:3000", 
            "http://localhost:3001", 
            "http://localhost:5173",
            "https://enterprise-employee-management-syst.vercel.app",
            "https://enterprise-employee-management-syst-eta.vercel.app"
        };
        
        // Add any CORS origins from environment variable
        var envOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS");
        if (!string.IsNullOrEmpty(envOrigins))
        {
            allowedOrigins.AddRange(envOrigins.Split(','));
        }
        
        policy.WithOrigins(allowedOrigins.ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EMS API",
        Version = "v1",
        Description = "Enterprise Employee Management System API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Create database and seed data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    // Ensure database is created
    var created = db.Database.EnsureCreated();
    Log.Information("Database EnsureCreated returned: {Created}", created);
    
    // Seed data if no users exist
    if (!db.Users.IgnoreQueryFilters().Any())
    {
        Log.Information("No users found, seeding initial data...");
        await SeedInitialData(db);
        Log.Information("Initial data seeded successfully");
    }
}

// Seed data method
static async Task SeedInitialData(ApplicationDbContext db)
{
    var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    var managerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    var employeeId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    var itDeptId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    var hrDeptId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    var financeDeptId = Guid.Parse("66666666-6666-6666-6666-666666666666");

    // Add departments
    db.Departments.AddRange(
        new EMS.Domain.Entities.Department
        {
            Id = itDeptId,
            Name = "Information Technology",
            Code = "IT",
            Description = "Technology and software development department",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new EMS.Domain.Entities.Department
        {
            Id = hrDeptId,
            Name = "Human Resources",
            Code = "HR",
            Description = "Human resources and people management",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new EMS.Domain.Entities.Department
        {
            Id = financeDeptId,
            Name = "Finance",
            Code = "FIN",
            Description = "Financial operations and accounting",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        }
    );
    await db.SaveChangesAsync();

    // Add users (password: Admin@123 for all)
    db.Users.AddRange(
        new EMS.Domain.Entities.User
        {
            Id = adminId,
            Email = "admin@ems.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            FirstName = "System",
            LastName = "Administrator",
            Role = EMS.Domain.Enums.UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new EMS.Domain.Entities.User
        {
            Id = managerId,
            Email = "manager@ems.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
            FirstName = "John",
            LastName = "Manager",
            Role = EMS.Domain.Enums.UserRole.Manager,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        },
        new EMS.Domain.Entities.User
        {
            Id = employeeId,
            Email = "employee@ems.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@123"),
            FirstName = "Jane",
            LastName = "Employee",
            Role = EMS.Domain.Enums.UserRole.Employee,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        }
    );
    await db.SaveChangesAsync();

    // Add employees
    db.Employees.AddRange(
        new EMS.Domain.Entities.Employee
        {
            Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            EmployeeCode = "EMP001",
            UserId = adminId,
            DepartmentId = itDeptId,
            Position = "CTO",
            Phone = "+1-555-0101",
            Address = "123 Admin Street, Tech City",
            DateOfBirth = DateTime.SpecifyKind(new DateTime(1980, 1, 15), DateTimeKind.Utc),
            HireDate = DateTime.SpecifyKind(new DateTime(2020, 1, 1), DateTimeKind.Utc),
            Salary = 150000,
            Status = EMS.Domain.Enums.EmploymentStatus.Active,
            Skills = "Leadership, Strategy, Technology Management",
            CreatedAt = DateTime.UtcNow
        },
        new EMS.Domain.Entities.Employee
        {
            Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
            EmployeeCode = "EMP002",
            UserId = managerId,
            DepartmentId = itDeptId,
            Position = "Engineering Manager",
            Phone = "+1-555-0102",
            Address = "456 Manager Ave, Tech City",
            DateOfBirth = DateTime.SpecifyKind(new DateTime(1985, 5, 20), DateTimeKind.Utc),
            HireDate = DateTime.SpecifyKind(new DateTime(2021, 3, 15), DateTimeKind.Utc),
            Salary = 120000,
            Status = EMS.Domain.Enums.EmploymentStatus.Active,
            Skills = "Team Management, Agile, Software Development",
            ReportsToId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            CreatedAt = DateTime.UtcNow
        },
        new EMS.Domain.Entities.Employee
        {
            Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            EmployeeCode = "EMP003",
            UserId = employeeId,
            DepartmentId = itDeptId,
            Position = "Software Developer",
            Phone = "+1-555-0103",
            Address = "789 Employee Blvd, Tech City",
            DateOfBirth = DateTime.SpecifyKind(new DateTime(1992, 8, 10), DateTimeKind.Utc),
            HireDate = DateTime.SpecifyKind(new DateTime(2022, 6, 1), DateTimeKind.Utc),
            Salary = 85000,
            Status = EMS.Domain.Enums.EmploymentStatus.Active,
            Skills = "C#, .NET, React, SQL Server, Azure",
            ReportsToId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
            CreatedAt = DateTime.UtcNow
        }
    );
    await db.SaveChangesAsync();
}

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EMS API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseMiddleware<ExceptionMiddleware>();

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

Log.Information("EMS API Starting...");

app.Run();
