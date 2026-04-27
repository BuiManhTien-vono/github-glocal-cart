using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;

namespace GlocalCart.API.Middleware
{
    /// <summary>
    /// Authorization Filter kiểm tra AccountStatus của user.
    /// Nếu tài khoản bị Blocked/Banned/Compromised/Archived → trả về 403 Forbidden.
    /// Được đăng ký globally trong Program.cs.
    /// </summary>
    public class AccountStatusFilter : IAsyncAuthorizationFilter
    {
        private readonly UserManager<User> _userManager;

        public AccountStatusFilter(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            // Chỉ kiểm tra khi user đã authenticated
            if (context.HttpContext.User.Identity?.IsAuthenticated != true)
                return;

            var userIdClaim = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim))
                return;

            var user = await _userManager.FindByIdAsync(userIdClaim);
            if (user == null)
            {
                context.Result = new ObjectResult(ApiResponse.Unauthorized("Tài khoản không tồn tại."))
                {
                    StatusCode = 401
                };
                return;
            }

            if (user.AccountStatus != AccountStatus.Active)
            {
                context.Result = new ObjectResult(ApiResponse.Forbidden($"Tài khoản của bạn đang bị {user.AccountStatus}. Vui lòng liên hệ hỗ trợ."))
                {
                    StatusCode = 403
                };
            }
        }
    }
}
