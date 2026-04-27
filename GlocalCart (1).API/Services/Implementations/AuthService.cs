using Microsoft.AspNetCore.Identity;
using GlocalCart.API.DTOs.Auth;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly JwtHelper _jwt;

        public AuthService(UserManager<User> userManager, JwtHelper jwt)
        {
            _userManager = userManager;
            _jwt = jwt;
        }

        public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto)
        {
            // Kiểm tra email đã tồn tại
            if (await _userManager.FindByEmailAsync(dto.Email) != null)
                return ApiResponse.Fail<AuthResponseDto>("Email đã được sử dụng.", 400);

            if (await _userManager.FindByNameAsync(dto.UserName) != null)
                return ApiResponse.Fail<AuthResponseDto>("Tên đăng nhập đã tồn tại.", 400);

            var user = new User
            {
                UserName = dto.UserName,
                Email = dto.Email,
                FullName = dto.FullName,
                PhoneNumber = dto.Phone,
                Role = Enums.UserRole.Member,
                AccountStatus = Enums.AccountStatus.Active
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return ApiResponse.Fail<AuthResponseDto>($"Đăng ký thất bại: {errors}", 400);
            }

            // Gán role Member qua Identity
            await _userManager.AddToRoleAsync(user, "Member");

            var roles = await _userManager.GetRolesAsync(user);
            var token = _jwt.GenerateToken(user, roles);

            return ApiResponse.Ok(new AuthResponseDto
            {
                Token = token,
                User = MapToUserInfo(user, roles)
            }, "Đăng ký thành công.");
        }

        public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email)
                ?? await _userManager.FindByNameAsync(dto.Email);

            if (user == null)
                return ApiResponse.Fail<AuthResponseDto>("Email hoặc mật khẩu không đúng.", 401);

            if (!await _userManager.CheckPasswordAsync(user, dto.Password))
                return ApiResponse.Fail<AuthResponseDto>("Email hoặc mật khẩu không đúng.", 401);

            if (user.AccountStatus != Enums.AccountStatus.Active)
                return ApiResponse.Fail<AuthResponseDto>($"Tài khoản đang ở trạng thái: {user.AccountStatus}", 403);

            var roles = await _userManager.GetRolesAsync(user);
            var token = _jwt.GenerateToken(user, roles);

            return ApiResponse.Ok(new AuthResponseDto
            {
                Token = token,
                User = MapToUserInfo(user, roles)
            }, "Đăng nhập thành công.");
        }

        private static UserInfoDto MapToUserInfo(User user, IList<string> roles) => new()
        {
            Id = user.Id,
            UserName = user.UserName!,
            Email = user.Email!,
            FullName = user.FullName,
            Phone = user.PhoneNumber,
            Role = roles.FirstOrDefault() ?? user.Role.ToString(),
            IsSeller = user.IsSeller,
            AccountStatus = user.AccountStatus.ToString()
        };
    }
}
