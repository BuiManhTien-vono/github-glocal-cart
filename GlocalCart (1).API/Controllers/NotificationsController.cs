using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notifService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public NotificationsController(INotificationService notifService) { _notifService = notifService; }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _notifService.GetNotificationsAsync(UserId, page, pageSize)));

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            await _notifService.MarkAsReadAsync(UserId, id);
            return Ok(ApiResponse.Ok("Đã đánh dấu đã đọc."));
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount() =>
            Ok(ApiResponse.Ok(new { count = await _notifService.GetUnreadCountAsync(UserId) }));
    }
}
