using EMS.Application.Common;
using EMS.Application.DTOs.Notification;
using EMS.Application.Interfaces;
using EMS.Domain.Entities;
using EMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EMS.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IUnitOfWork unitOfWork, 
        ICurrentUserService currentUserService,
        ILogger<NotificationService> logger)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<ApiResponse<NotificationDto>> CreateAsync(CreateNotificationDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var currentUserId = _currentUserService.UserId;
            if (currentUserId == null)
            {
                return ApiResponse<NotificationDto>.FailureResponse("User not authenticated");
            }

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type,
                Priority = dto.Priority,
                CreatedByUserId = currentUserId.Value,
                TargetUserId = dto.TargetUserId,
                ExpiresAt = dto.ExpiresAt,
                IsRead = false
            };

            await _unitOfWork.Notifications.AddAsync(notification, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var result = await GetByIdAsync(notification.Id, cancellationToken);
            
            _logger.LogInformation("Notification created: {Title} by user {UserId}", dto.Title, currentUserId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification");
            return ApiResponse<NotificationDto>.FailureResponse("An error occurred while creating notification");
        }
    }

    public async Task<ApiResponse<NotificationDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var notification = await _unitOfWork.Notifications.Query()
                .Include(n => n.Creator)
                .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);

            if (notification == null)
            {
                return ApiResponse<NotificationDto>.FailureResponse("Notification not found");
            }

            return ApiResponse<NotificationDto>.SuccessResponse(MapToDto(notification));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification by ID: {Id}", id);
            return ApiResponse<NotificationDto>.FailureResponse("An error occurred while fetching notification");
        }
    }

    public async Task<ApiResponse<PagedResult<NotificationDto>>> GetUserNotificationsAsync(
        Guid userId, 
        PaginationParams pagination, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.Notifications.Query()
                .Include(n => n.Creator)
                .Where(n => n.TargetUserId == null || n.TargetUserId == userId)
                .Where(n => n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(n => n.CreatedAt);

            var totalCount = await query.CountAsync(cancellationToken);
            
            var notifications = await query
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync(cancellationToken);

            var result = new PagedResult<NotificationDto>
            {
                Items = notifications.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                PageNumber = pagination.PageNumber,
                PageSize = pagination.PageSize
            };

            return ApiResponse<PagedResult<NotificationDto>>.SuccessResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for user: {UserId}", userId);
            return ApiResponse<PagedResult<NotificationDto>>.FailureResponse("An error occurred while fetching notifications");
        }
    }

    public async Task<ApiResponse<NotificationSummaryDto>> GetUserNotificationSummaryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.Notifications.Query()
                .Include(n => n.Creator)
                .Where(n => n.TargetUserId == null || n.TargetUserId == userId)
                .Where(n => n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow);

            var totalCount = await query.CountAsync(cancellationToken);
            var unreadCount = await query.CountAsync(n => !n.IsRead, cancellationToken);
            
            var recentNotifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(5)
                .ToListAsync(cancellationToken);

            var summary = new NotificationSummaryDto
            {
                TotalCount = totalCount,
                UnreadCount = unreadCount,
                RecentNotifications = recentNotifications.Select(MapToDto).ToList()
            };

            return ApiResponse<NotificationSummaryDto>.SuccessResponse(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification summary for user: {UserId}", userId);
            return ApiResponse<NotificationSummaryDto>.FailureResponse("An error occurred while fetching notification summary");
        }
    }

    public async Task<ApiResponse<bool>> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var notification = await _unitOfWork.Notifications.Query()
                .FirstOrDefaultAsync(n => n.Id == notificationId && 
                    (n.TargetUserId == null || n.TargetUserId == userId), cancellationToken);

            if (notification == null)
            {
                return ApiResponse<bool>.FailureResponse("Notification not found");
            }

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            _unitOfWork.Notifications.Update(notification);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse<bool>.SuccessResponse(true, "Notification marked as read");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read: {NotificationId}", notificationId);
            return ApiResponse<bool>.FailureResponse("An error occurred while marking notification as read");
        }
    }

    public async Task<ApiResponse<bool>> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var notifications = await _unitOfWork.Notifications.Query()
                .Where(n => (n.TargetUserId == null || n.TargetUserId == userId) && !n.IsRead)
                .ToListAsync(cancellationToken);

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                _unitOfWork.Notifications.Update(notification);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse<bool>.SuccessResponse(true, $"Marked {notifications.Count} notifications as read");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user: {UserId}", userId);
            return ApiResponse<bool>.FailureResponse("An error occurred while marking notifications as read");
        }
    }

    public async Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var notification = await _unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
            if (notification == null)
            {
                return ApiResponse<bool>.FailureResponse("Notification not found");
            }

            notification.IsDeleted = true;
            _unitOfWork.Notifications.Update(notification);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return ApiResponse<bool>.SuccessResponse(true, "Notification deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification: {Id}", id);
            return ApiResponse<bool>.FailureResponse("An error occurred while deleting notification");
        }
    }

    public async Task<ApiResponse<List<NotificationDto>>> GetAllNotificationsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var notifications = await _unitOfWork.Notifications.Query()
                .Include(n => n.Creator)
                .OrderByDescending(n => n.CreatedAt)
                .Take(100)
                .ToListAsync(cancellationToken);

            return ApiResponse<List<NotificationDto>>.SuccessResponse(notifications.Select(MapToDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all notifications");
            return ApiResponse<List<NotificationDto>>.FailureResponse("An error occurred while fetching notifications");
        }
    }

    private static NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type.ToString(),
            Priority = notification.Priority.ToString(),
            CreatedByName = $"{notification.Creator.FirstName} {notification.Creator.LastName}",
            IsRead = notification.IsRead,
            ReadAt = notification.ReadAt,
            CreatedAt = notification.CreatedAt,
            ExpiresAt = notification.ExpiresAt
        };
    }
}
