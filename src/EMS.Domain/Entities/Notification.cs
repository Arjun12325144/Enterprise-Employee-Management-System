using EMS.Domain.Enums;

namespace EMS.Domain.Entities;

public class Notification : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public Guid CreatedByUserId { get; set; }
    public Guid? TargetUserId { get; set; } // null means broadcast to all
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    // Navigation
    public User Creator { get; set; } = null!;
    public User? TargetUser { get; set; }
}
