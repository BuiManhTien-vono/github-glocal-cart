using GlocalCart.API.DTOs.Auth;
using GlocalCart.API.Helpers;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto);
        Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto);
        Task<ApiResponse<object?>> ForgotPasswordAsync(ForgotPasswordRequestDto dto);
        Task<ApiResponse<object?>> VerifyResetOtpAsync(VerifyResetOtpDto dto);
        Task<ApiResponse<object?>> ResetPasswordAsync(ResetPasswordDto dto);
    }
}
