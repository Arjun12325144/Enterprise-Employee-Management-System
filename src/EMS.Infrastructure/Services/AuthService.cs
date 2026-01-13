using EMS.Application.Common;
using EMS.Application.DTOs.Auth;
using EMS.Application.Interfaces;
using EMS.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace EMS.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        IPasswordHasher passwordHasher,
        ILogger<AuthService> logger)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _unitOfWork.Users.FirstOrDefaultAsync(
                u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

            if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                _logger.LogWarning("Failed login attempt for email: {Email}", request.Email);
                return ApiResponse<LoginResponseDto>.FailureResponse("Invalid email or password");
            }

            if (!user.IsActive)
            {
                return ApiResponse<LoginResponseDto>.FailureResponse("Account is deactivated");
            }

            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = _tokenService.GetRefreshTokenExpiry();
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var response = new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                User = MapToUserDto(user)
            };

            _logger.LogInformation("User logged in successfully: {Email}", user.Email);
            return ApiResponse<LoginResponseDto>.SuccessResponse(response, "Login successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
            return ApiResponse<LoginResponseDto>.FailureResponse("An error occurred during login");
        }
    }

    public async Task<ApiResponse<LoginResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var tokenData = _tokenService.ValidateAccessToken(request.AccessToken);
            if (tokenData == null)
            {
                return ApiResponse<LoginResponseDto>.FailureResponse("Invalid access token");
            }

            var user = await _unitOfWork.Users.GetByIdAsync(tokenData.Value.userId, cancellationToken);
            if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiry < DateTime.UtcNow)
            {
                return ApiResponse<LoginResponseDto>.FailureResponse("Invalid or expired refresh token");
            }

            var newAccessToken = _tokenService.GenerateAccessToken(user);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = _tokenService.GetRefreshTokenExpiry();
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var response = new LoginResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                User = MapToUserDto(user)
            };

            return ApiResponse<LoginResponseDto>.SuccessResponse(response, "Token refreshed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return ApiResponse<LoginResponseDto>.FailureResponse("An error occurred during token refresh");
        }
    }

    public async Task<ApiResponse<UserDto>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var existingUser = await _unitOfWork.Users.AnyAsync(
                u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

            if (existingUser)
            {
                return ApiResponse<UserDto>.FailureResponse("Email is already registered");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = request.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Users.AddAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("New user registered: {Email}", user.Email);
            return ApiResponse<UserDto>.SuccessResponse(MapToUserDto(user), "Registration successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for email: {Email}", request.Email);
            return ApiResponse<UserDto>.FailureResponse("An error occurred during registration");
        }
    }

    public async Task<ApiResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user == null)
            {
                return ApiResponse.FailureResponse("User not found");
            }

            if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                return ApiResponse.FailureResponse("Current password is incorrect");
            }

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Password changed for user: {Email}", user.Email);
            return ApiResponse.SuccessResponse("Password changed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password change for userId: {UserId}", userId);
            return ApiResponse.FailureResponse("An error occurred during password change");
        }
    }

    public async Task<ApiResponse> RevokeTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user == null)
            {
                return ApiResponse.FailureResponse("User not found");
            }

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Token revoked for user: {Email}", user.Email);
            return ApiResponse.SuccessResponse("Token revoked successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token revocation for userId: {UserId}", userId);
            return ApiResponse.FailureResponse("An error occurred during token revocation");
        }
    }

    public async Task<ApiResponse<UserDto>> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user == null)
            {
                return ApiResponse<UserDto>.FailureResponse("User not found");
            }

            return ApiResponse<UserDto>.SuccessResponse(MapToUserDto(user));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user for userId: {UserId}", userId);
            return ApiResponse<UserDto>.FailureResponse("An error occurred while fetching user details");
        }
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            IsActive = user.IsActive
        };
    }
}
