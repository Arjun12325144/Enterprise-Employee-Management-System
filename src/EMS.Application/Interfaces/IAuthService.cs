using EMS.Application.Common;
using EMS.Application.DTOs.Auth;

namespace EMS.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<LoginResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse> RevokeTokenAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
