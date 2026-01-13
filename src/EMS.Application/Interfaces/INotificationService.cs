using EMS.Application.Common;
using EMS.Application.DTOs.Notification;

namespace EMS.Application.Interfaces;

public interface INotificationService
{
    Task<ApiResponse<NotificationDto>> CreateAsync(CreateNotificationDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<NotificationDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<PagedResult<NotificationDto>>> GetUserNotificationsAsync(Guid userId, PaginationParams pagination, CancellationToken cancellationToken = default);
    Task<ApiResponse<NotificationSummaryDto>> GetUserNotificationSummaryAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<NotificationDto>>> GetAllNotificationsAsync(CancellationToken cancellationToken = default);
}
