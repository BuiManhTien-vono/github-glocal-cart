using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GlocalCart.API.Hubs
{
    [Authorize]
    public class DeliveryHub : Hub
    {
        public const string ShipperAvailableGroup = "shipper-available";

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
            }

            if (Context.User?.IsInRole("Shipper") == true || Context.User?.IsInRole("Admin") == true)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, ShipperAvailableGroup);
            }

            await base.OnConnectedAsync();
        }

        public static string UserGroup(int userId) => UserGroup(userId.ToString());

        public static string UserGroup(string userId) => $"user-{userId}";
    }
}
