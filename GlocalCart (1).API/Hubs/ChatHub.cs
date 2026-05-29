using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GlocalCart.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
            }

            await base.OnConnectedAsync();
        }

        public static string UserGroup(int userId) => UserGroup(userId.ToString());

        public static string UserGroup(string userId) => $"chat-user-{userId}";
    }
}
