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

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("{orderId}/initiate")]
        [Authorize]
        public async Task<IActionResult> InitiatePayment(int orderId)
        {
            var result = await _paymentService.InitiatePaymentAsync(UserId, orderId);
            return Ok(ApiResponse.Ok(result, "Khoi tao thanh toan thanh cong."));
        }

        [HttpPost("{orderId}/confirm-transfer")]
        [Authorize]
        public async Task<IActionResult> ConfirmTransfer(int orderId)
        {
            var result = await _paymentService.ConfirmTransferAsync(UserId, orderId);
            return Ok(ApiResponse.Ok(result, "Da ghi nhan. Dang cho gateway xac nhan."));
        }

        [HttpGet("{orderId}/status")]
        [Authorize]
        public async Task<IActionResult> GetStatus(int orderId)
        {
            return Ok(ApiResponse.Ok(await _paymentService.GetPaymentStatusAsync(UserId, orderId)));
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook([FromBody] WebhookRequestDto dto)
        {
            if (!Request.Headers.TryGetValue("X-Signature", out var signature))
            {
                return StatusCode(401, ApiResponse.Unauthorized("Thieu X-Signature header."));
            }

            var success = await _paymentService.ProcessCallbackAsync(dto, signature.ToString());

            if (!success)
            {
                return StatusCode(401, ApiResponse.Unauthorized("Chu ky khong hop le hoac du lieu sai."));
            }

            return Ok(ApiResponse.Ok("Da cap nhat trang thai thanh toan."));
        }
    }
}
