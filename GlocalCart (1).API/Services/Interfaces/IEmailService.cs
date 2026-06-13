namespace GlocalCart.API.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetOtpAsync(string email, string fullName, string otp);
    }
}
