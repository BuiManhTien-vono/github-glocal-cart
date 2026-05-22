using System.Security.Claims;
using System.Text;
using System.Text.Json;
using GlocalCart.API.DTOs.Payments;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Implementations;
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
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public PaymentsController(
            IPaymentService paymentService,
            IHttpClientFactory httpClientFactory,
            IConfiguration config)
        {
            _paymentService = paymentService;
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

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
        /// Người mua xác nhận đã chuyển khoản — gửi yêu cầu xác minh tới Bank Gateway bên thứ 3.
        /// </summary>
        [HttpPost("{orderId}/confirm-transfer")]
        [Authorize]
        public async Task<IActionResult> ConfirmTransfer(int orderId)
        {
            var result = await _paymentService.ConfirmTransferAsync(UserId, orderId);

            // Gửi yêu cầu xác minh tới Bank Gateway (bên thứ 3)
            _ = Task.Run(async () =>
            {
                try
                {
                    var paymentSettings = _config.GetSection("PaymentSettings");
                    var merchantId = paymentSettings["MerchantId"] ?? "MERCHANT_001";
                    var secretKey = paymentSettings["SecretKey"] ?? "default_secret";
                    var bankGatewayUrl = paymentSettings["BankGatewayUrl"] ?? "http://localhost:5100";

                    var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                    var rawData = $"{merchantId}|{result.OrderNumber}|{(int)result.Amount}|{timestamp}";
                    var signature = PaymentService.GenerateHmacForTest(rawData, secretKey);

                    var payload = new
                    {
                        MerchantId = merchantId,
                        OrderId = result.OrderNumber,
                        Amount = result.Amount,
                        Timestamp = timestamp,
                        Signature = signature
                    };

                    var client = _httpClientFactory.CreateClient();
                    var json = JsonSerializer.Serialize(payload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await client.PostAsync(
                        $"{bankGatewayUrl}/api/gateway/process-transfer", content);

                    Console.WriteLine(
                        $"[BankGateway] Gửi xác minh đơn #{result.OrderNumber} → HTTP {(int)response.StatusCode}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[BankGateway Error] Không thể gửi tới Bank Gateway: {ex.Message}");
                }
            });

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
        /// Webhook từ ngân hàng / Bank Gateway (HMAC X-Signature).
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

