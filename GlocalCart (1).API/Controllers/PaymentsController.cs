using GlocalCart.API.DTOs.Payments;
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

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        /// <summary>
        /// Khởi tạo thanh toán cho đơn hàng. Trả về URL VietQR.
        /// </summary>
        [HttpPost("{orderId}/initiate")]
        [Authorize]
        public async Task<IActionResult> InitiatePayment(int orderId)
        {
            try
            {
                var result = await _paymentService.InitiatePaymentAsync(orderId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Webhook nhận thông báo từ Gateway khi thanh toán thành công
        /// </summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook([FromBody] WebhookRequestDto dto)
        {
            // Lấy signature từ Header
            if (!Request.Headers.TryGetValue("X-Signature", out var signature))
            {
                return Unauthorized(new { message = "Thiếu X-Signature header." });
            }

            var success = await _paymentService.ProcessCallbackAsync(dto, signature.ToString());
            
            if (!success)
            {
                return Unauthorized(new { message = "Chữ ký không hợp lệ hoặc dữ liệu sai." });
            }

            return Ok(new { success = true, message = "Đã cập nhật trạng thái đơn hàng." });
        }
    }
}
