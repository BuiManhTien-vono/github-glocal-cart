using System.Security.Claims;
using GlocalCart.API.DTOs.Payments;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public PaymentsController(IPaymentService paymentService) => _paymentService = paymentService;

        /// <summary>
        /// Khởi tạo thanh toán VietQR cho đơn chuyển khoản (chỉ người mua).
        /// </summary>
        [HttpPost("{orderId}/initiate")]
        [Authorize]
        public async Task<IActionResult> InitiatePayment(int orderId)
        {
            var result = await _paymentService.InitiatePaymentAsync(UserId, orderId);
            return Ok(ApiResponse.Ok(result, "Khởi tạo thanh toán thành công."));
        }

        /// <summary>
        /// Người mua xác nhận đã chuyển khoản — chờ ngân hàng đối soát.
        /// </summary>
        [HttpPost("{orderId}/confirm-transfer")]
        [Authorize]
        public async Task<IActionResult> ConfirmTransfer(int orderId)
        {
            var result = await _paymentService.ConfirmTransferAsync(UserId, orderId);
            return Ok(ApiResponse.Ok(result, "Đã ghi nhận. Đang chờ ngân hàng xác nhận."));
        }

        /// <summary>
        /// Tra cứu trạng thái thanh toán đơn hàng.
        /// </summary>
        [HttpGet("{orderId}/status")]
        [Authorize]
        public async Task<IActionResult> GetStatus(int orderId) =>
            Ok(ApiResponse.Ok(await _paymentService.GetPaymentStatusAsync(UserId, orderId)));

        /// <summary>
        /// Webhook từ ngân hàng / payment gateway (HMAC X-Signature).
        /// </summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook([FromBody] WebhookRequestDto dto)
        {
            if (!Request.Headers.TryGetValue("X-Signature", out var signature))
                return StatusCode(401, ApiResponse.Unauthorized("Thiếu X-Signature header."));

            var success = await _paymentService.ProcessCallbackAsync(dto, signature.ToString());

            if (!success)
                return StatusCode(401, ApiResponse.Unauthorized("Chữ ký không hợp lệ hoặc dữ liệu sai."));

            return Ok(ApiResponse.Ok("Đã cập nhật trạng thái thanh toán."));
        }
    }
}
