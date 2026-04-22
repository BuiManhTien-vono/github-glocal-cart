using GlocalCart.API.DTOs.Payments;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IPaymentService
    {
        /// <summary>
        /// Khởi tạo thanh toán, ký HMAC và tạo VietQR URL
        /// </summary>
        Task<PaymentInitiateResponseDto> InitiatePaymentAsync(int orderId);

        /// <summary>
        /// Xử lý Webhook từ Gateway, kiểm tra chữ ký và cập nhật đơn hàng
        /// </summary>
        Task<bool> ProcessCallbackAsync(WebhookRequestDto callback, string signature);
    }
}
