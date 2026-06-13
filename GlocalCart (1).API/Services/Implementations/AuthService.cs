using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using GlocalCart.API.Data;
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
        private readonly AppDbContext _db;
        private readonly IEmailService _emailService;

        public AuthService(UserManager<User> userManager, JwtHelper jwt, AppDbContext db, IEmailService emailService)
        {
            _userManager = userManager;
            _jwt = jwt;
            _db = db;
            _emailService = emailService;
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

        public async Task<ApiResponse<object?>> ForgotPasswordAsync(ForgotPasswordRequestDto dto)
        {
            var email = dto.Email.Trim();
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return ApiResponse.Fail("Email không tồn tại trong hệ thống.", 404);

            var now = DateTime.UtcNow;
            var activeOtps = await _db.PasswordResetOtps
                .Where(o => o.UserId == user.Id && o.UsedAt == null && o.ExpiresAt > now)
                .ToListAsync();
            foreach (var activeOtp in activeOtps)
            {
                activeOtp.UsedAt = now;
            }

            var otp = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            _db.PasswordResetOtps.Add(new PasswordResetOtp
            {
                UserId = user.Id,
                Email = email,
                CodeHash = HashOtp(email, otp),
                ExpiresAt = now.AddMinutes(5),
                CreatedAt = now
            });

            await _db.SaveChangesAsync();
            try
            {
                await _emailService.SendPasswordResetOtpAsync(email, user.FullName, otp);
            }
            catch
            {
                var createdOtp = await _db.PasswordResetOtps
                    .Where(o => o.UserId == user.Id && o.Email == email && o.CodeHash == HashOtp(email, otp) && o.UsedAt == null)
                    .OrderByDescending(o => o.CreatedAt)
                    .FirstOrDefaultAsync();

                if (createdOtp != null)
                {
                    createdOtp.UsedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                }

                throw;
            }

            return ApiResponse.Ok("Mã OTP đã được gửi đến email của bạn.");
        }

        public async Task<ApiResponse<object?>> VerifyResetOtpAsync(VerifyResetOtpDto dto)
        {
            var otp = await FindValidOtpAsync(dto.Email, dto.Otp);
            if (otp == null)
                return ApiResponse.Fail("OTP không đúng hoặc đã hết hạn.", 400);

            return ApiResponse.Ok("OTP hợp lệ.");
        }

        public async Task<ApiResponse<object?>> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var otp = await FindValidOtpAsync(dto.Email, dto.Otp);
            if (otp == null)
                return ApiResponse.Fail("OTP không đúng hoặc đã hết hạn.", 400);

            var user = await _userManager.FindByIdAsync(otp.UserId.ToString());
            if (user == null)
                return ApiResponse.Fail("Tài khoản không tồn tại.", 404);

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, dto.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return ApiResponse.Fail($"Đặt lại mật khẩu thất bại: {errors}", 400);
            }

            otp.UsedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            await _db.SaveChangesAsync();

            return ApiResponse.Ok("Đặt lại mật khẩu thành công.");
        }

        private async Task<PasswordResetOtp?> FindValidOtpAsync(string email, string otp)
        {
            var normalizedEmail = email.Trim();
            var codeHash = HashOtp(normalizedEmail, otp);
            var now = DateTime.UtcNow;

            return await _db.PasswordResetOtps
                .Where(o => o.Email == normalizedEmail && o.CodeHash == codeHash && o.UsedAt == null && o.ExpiresAt > now)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();
        }

        private static string HashOtp(string email, string otp)
        {
            var raw = $"{email.Trim().ToUpperInvariant()}:{otp}";
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes);
        }

        private static UserInfoDto MapToUserInfo(User user, IList<string> roles) => new()
        {
            Id = user.Id,
            UserName = user.UserName!,
            Email = user.Email!,
            FullName = user.FullName,
            Phone = user.PhoneNumber,
            Gender = user.Gender,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.AvatarUrl,
            Role = roles.FirstOrDefault() ?? user.Role.ToString(),
            IsSeller = user.IsSeller,
            AccountStatus = user.AccountStatus.ToString()
        };
    }
}
