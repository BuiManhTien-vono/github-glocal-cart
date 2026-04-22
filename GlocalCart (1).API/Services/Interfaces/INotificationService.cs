using GlocalCart.API.DTOs.Notifications;
using GlocalCart.API.Helpers;

namespace GlocalCart.API.Services.Interfaces
{
    public interface INotificationService
    {
        Task<PagedResult<NotificationDto>> GetNotificationsAsync(int userId, int page, int pageSize);
        Task<bool> MarkAsReadAsync(int userId, int notificationId);
        Task<int> GetUnreadCountAsync(int userId);
        Task CreateNotificationAsync(int userId, string content, Enums.NotificationType type = Enums.NotificationType.Email);
    }
}
