using EMS.Domain.Entities;

namespace EMS.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    (Guid userId, string email)? ValidateAccessToken(string token);
    DateTime GetRefreshTokenExpiry();
}
