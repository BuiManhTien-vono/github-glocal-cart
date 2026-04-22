using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Auth;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly JwtHelper _jwt;

        public AuthService(AppDbContext db, JwtHelper jwt)
        {
            _db = db;
            _jwt = jwt;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            // Kiểm tra email đã tồn tại
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
                return new AuthResponseDto { Success = false, Message = "Email đã được sử dụng." };

            if (await _db.Users.AnyAsync(u => u.UserName == dto.UserName))
                return new AuthResponseDto { Success = false, Message = "Tên đăng nhập đã tồn tại." };

            var user = new User
            {
                UserName = dto.UserName,
                Email = dto.Email,
                PasswordHash = PasswordHelper.HashPassword(dto.Password),
                FullName = dto.FullName,
                Phone = dto.Phone,
                Role = Enums.UserRole.Member,
                AccountStatus = Enums.AccountStatus.Active
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var token = _jwt.GenerateToken(user);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Đăng ký thành công.",
                Token = token,
                User = MapToUserInfo(user)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email || u.UserName == dto.Email);

            if (user == null)
                return new AuthResponseDto { Success = false, Message = "Email hoặc mật khẩu không đúng." };

            if (!PasswordHelper.VerifyPassword(dto.Password, user.PasswordHash))
                return new AuthResponseDto { Success = false, Message = "Email hoặc mật khẩu không đúng." };

            if (user.AccountStatus != Enums.AccountStatus.Active)
                return new AuthResponseDto { Success = false, Message = $"Tài khoản đang ở trạng thái: {user.AccountStatus}" };

            var token = _jwt.GenerateToken(user);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Đăng nhập thành công.",
                Token = token,
                User = MapToUserInfo(user)
            };
        }

        private static UserInfoDto MapToUserInfo(User user) => new()
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Role = user.Role.ToString(),
            IsSeller = user.IsSeller,
            AccountStatus = user.AccountStatus.ToString()
        };
    }
}
