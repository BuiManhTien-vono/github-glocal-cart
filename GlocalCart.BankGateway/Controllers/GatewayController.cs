using GlocalCart.BankGateway.Models;
using GlocalCart.BankGateway.Services;
using Microsoft.AspNetCore.Mvc;

namespace GlocalCart.BankGateway.Controllers
{
    /// <summary>
    /// Controller chính của Bank Payment Gateway Simulator.
    /// Đóng vai trò là cổng thanh toán ngân hàng bên thứ 3.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class GatewayController : ControllerBase
    {
        private readonly GatewayService _gatewayService;

        public GatewayController(GatewayService gatewayService) => _gatewayService = gatewayService;

        /// <summary>
        /// Nhận yêu cầu xác minh chuyển khoản từ GlocalCart API.
        /// Mô phỏng: Merchant gửi thông tin giao dịch → Ngân hàng nhận và xử lý.
        /// Trả 202 Accepted ngay, kết quả sẽ gửi qua webhook sau.
        /// </summary>
        [HttpPost("process-transfer")]
        public IActionResult ProcessTransfer([FromBody] TransferRequest request)
        {
            try
            {
                var result = _gatewayService.ProcessTransfer(request);
                return Accepted(new
                {
                    success = true,
                    data = result,
                    message = "Giao dịch đã được tiếp nhận. Kết quả sẽ được gửi qua webhook."
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Xem tất cả giao dịch đã xử lý (tiện cho debug / demo).
        /// </summary>
        [HttpGet("transactions")]
        public IActionResult GetAllTransactions()
        {
            var transactions = _gatewayService.GetAllTransactions();
            return Ok(new
            {
                success = true,
                data = transactions,
                message = $"Tổng cộng {transactions.Count()} giao dịch."
            });
        }

        /// <summary>
        /// Xem chi tiết một giao dịch theo TransactionId.
        /// </summary>
        [HttpGet("transactions/{transactionId}")]
        public IActionResult GetTransaction(string transactionId)
        {
            var tx = _gatewayService.GetTransaction(transactionId);
            if (tx == null)
                return NotFound(new { success = false, message = "Không tìm thấy giao dịch." });

            return Ok(new { success = true, data = tx });
        }

        /// <summary>
        /// Admin chủ động resolve giao dịch (dùng khi AutoApprove = false).
        /// Cho phép quyết định PAID hoặc FAILED cho một giao dịch đang PROCESSING.
        /// </summary>
        [HttpPost("resolve")]
        public async Task<IActionResult> ManualResolve([FromBody] ManualResolveRequest request)
        {
            if (request.Status is not ("PAID" or "FAILED"))
                return BadRequest(new { success = false, message = "Status phải là PAID hoặc FAILED." });

            try
            {
                var record = await _gatewayService.ManualResolveAsync(request.TransactionId, request.Status);
                if (record == null)
                    return NotFound(new { success = false, message = "Không tìm thấy giao dịch." });

                return Ok(new
                {
                    success = true,
                    data = record,
                    message = $"Đã xử lý giao dịch: {request.Status}"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Health check — kiểm tra Bank Gateway đang hoạt động.
        /// </summary>
        [HttpGet("health")]
        public IActionResult Health()
        {
            var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var gatewayName = config.GetSection("GatewaySettings")["GatewayName"] ?? "Bank Gateway";
            var autoApprove = config.GetSection("GatewaySettings")["AutoApprove"] ?? "true";

            return Ok(new
            {
                success = true,
                gateway = gatewayName,
                status = "Running",
                mode = bool.Parse(autoApprove) ? "Auto-Approve" : "Manual",
                timestamp = DateTime.UtcNow
            });
        }
    }
}
