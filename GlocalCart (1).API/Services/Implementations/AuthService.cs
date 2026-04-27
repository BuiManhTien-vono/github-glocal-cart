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

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            // Kiểm tra email đã tồn tại
            if (await _userManager.FindByEmailAsync(dto.Email) != null)
                return new AuthResponseDto { Success = false, Message = "Email đã được sử dụng." };

            if (await _userManager.FindByNameAsync(dto.UserName) != null)
                return new AuthResponseDto { Success = false, Message = "Tên đăng nhập đã tồn tại." };

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
                return new AuthResponseDto { Success = false, Message = $"Đăng ký thất bại: {errors}" };
            }

            // Gán role Member qua Identity
            await _userManager.AddToRoleAsync(user, "Member");

            var roles = await _userManager.GetRolesAsync(user);
            var token = _jwt.GenerateToken(user, roles);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Đăng ký thành công.",
                Token = token,
                User = MapToUserInfo(user, roles)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email)
                ?? await _userManager.FindByNameAsync(dto.Email);

            if (user == null)
                return new AuthResponseDto { Success = false, Message = "Email hoặc mật khẩu không đúng." };

            if (!await _userManager.CheckPasswordAsync(user, dto.Password))
                return new AuthResponseDto { Success = false, Message = "Email hoặc mật khẩu không đúng." };

            if (user.AccountStatus != Enums.AccountStatus.Active)
                return new AuthResponseDto { Success = false, Message = $"Tài khoản đang ở trạng thái: {user.AccountStatus}" };

            var roles = await _userManager.GetRolesAsync(user);
            var token = _jwt.GenerateToken(user, roles);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Đăng nhập thành công.",
                Token = token,
                User = MapToUserInfo(user, roles)
            };
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
