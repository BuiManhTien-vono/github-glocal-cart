using GlocalCart.API.DTOs.Payments;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<PaymentInitiateResponseDto> InitiatePaymentAsync(int buyerId, int orderId);
        Task<PaymentStatusDto> ConfirmTransferAsync(int buyerId, int orderId);
        Task<PaymentStatusDto> GetPaymentStatusAsync(int userId, int orderId);
        Task<bool> ProcessCallbackAsync(WebhookRequestDto callback, string signature);
        Task<bool> SimulateBankCallbackAsync(string orderNumber, string status);
    }
}
