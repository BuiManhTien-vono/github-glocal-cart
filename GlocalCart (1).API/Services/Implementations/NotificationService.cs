using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Notifications;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _db;

        public NotificationService(AppDbContext db) { _db = db; }

        public async Task<PagedResult<NotificationDto>> GetNotificationsAsync(int userId, int page, int pageSize)
        {
            return await _db.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Type = n.Type.ToString(),
                    Action = n.Action.ToString(),
                    RelatedOrderId = n.RelatedOrderId,
                    Content = n.Content,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToPagedResultAsync(page, pageSize);
        }

        public async Task<bool> MarkAsReadAsync(int userId, int notificationId)
        {
            var notif = await _db.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId)
                ?? throw new KeyNotFoundException("Thông báo không tồn tại.");

            notif.IsRead = true;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public Task CreateNotificationAsync(int userId, string content, NotificationType type = NotificationType.Email) =>
            CreateNotificationAsync(userId, content, NotificationAction.General, null, type);

        public async Task CreateNotificationAsync(int userId, string content, NotificationAction action, int? relatedOrderId, NotificationType type = NotificationType.Email)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = userId,
                Content = content,
                Type = type,
                Action = action,
                RelatedOrderId = relatedOrderId
            });
            await _db.SaveChangesAsync();
        }
    }
}
