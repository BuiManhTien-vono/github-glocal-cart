using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.DTOs.Shipper;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    /// <summary>
    /// API dành cho nhân viên giao hàng.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Shipper,Admin")]
    public class ShipperController : ControllerBase
    {
        private readonly IShipperService _shipperService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public ShipperController(IShipperService shipperService) => _shipperService = shipperService;

        [HttpGet("shipments/available")]
        public async Task<IActionResult> GetAvailable([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _shipperService.GetAvailableShipmentsAsync(UserId, page, pageSize)));

        [HttpPost("location")]
        public async Task<IActionResult> UpdateLocation([FromBody] ShipperLocationUpdateDto dto) =>
            Ok(ApiResponse.Ok(await _shipperService.UpdateLocationAsync(UserId, dto), "Đã cập nhật vị trí shipper."));

        [HttpGet("shipments/mine")]
        public async Task<IActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _shipperService.GetMyShipmentsAsync(UserId, page, pageSize)));

        [HttpGet("shipments/completed")]
        public async Task<IActionResult> GetCompleted(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? period = null) =>
            Ok(ApiResponse.Ok(await _shipperService.GetCompletedShipmentsAsync(UserId, page, pageSize, period)));

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats() =>
            Ok(ApiResponse.Ok(await _shipperService.GetStatsAsync(UserId)));

        [HttpGet("shipments/{id}")]
        public async Task<IActionResult> GetDetail(int id) =>
            Ok(ApiResponse.Ok(await _shipperService.GetShipmentDetailAsync(UserId, id)));

        [HttpPost("shipments/{id}/accept")]
        public async Task<IActionResult> Accept(int id, [FromBody] ShipperActionDto? dto) =>
            Ok(ApiResponse.Ok(
                await _shipperService.AcceptShipmentAsync(UserId, id, dto?.Note),
                "Đã nhận đơn. Vui lòng xác nhận đã lấy hàng sau khi tới shop."));

        [HttpPost("shipments/{id}/confirm-pickup")]
        public async Task<IActionResult> ConfirmPickup(int id, [FromBody] ShipperActionDto? dto) =>
            Ok(ApiResponse.Ok(
                await _shipperService.ConfirmPickupAsync(UserId, id, dto?.Note),
                "Đã xác nhận lấy hàng."));

        [HttpPost("shipments/{id}/confirm-arrival")]
        public async Task<IActionResult> ConfirmArrival(int id, [FromBody] ShipperActionDto? dto) =>
            Ok(ApiResponse.Ok(
                await _shipperService.ConfirmArrivalAsync(UserId, id, dto?.Note),
                "Đã xác nhận đến nơi."));

        [HttpPost("shipments/{id}/confirm-cash-received")]
        public async Task<IActionResult> ConfirmCashReceived(int id, [FromBody] ShipperActionDto? dto) =>
            Ok(ApiResponse.Ok(
                await _shipperService.ConfirmCashReceivedAsync(UserId, id, dto?.Note),
                "Đã xác nhận nhận tiền mặt."));

        [HttpPost("shipments/{id}/confirm-transfer-received")]
        public async Task<IActionResult> ConfirmTransferReceived(int id, [FromBody] ShipperActionDto? dto) =>
            Ok(ApiResponse.Ok(
                await _shipperService.ConfirmTransferReceivedAsync(UserId, id, dto?.Note),
                "Đã xác nhận nhận chuyển khoản."));

        [HttpPost("shipments/{id}/request-payment")]
        public async Task<IActionResult> RequestPayment(int id) =>
            Ok(ApiResponse.Ok(
                await _shipperService.RequestPaymentAsync(UserId, id),
                "Đã gửi thông báo đến người mua."));

        [HttpPost("shipments/{id}/deliver")]
        public async Task<IActionResult> Deliver(int id, [FromBody] ShipperActionDto? dto) =>
            Ok(ApiResponse.Ok(
                await _shipperService.ConfirmDeliveredAsync(
                    UserId,
                    id,
                    string.IsNullOrWhiteSpace(dto?.ProofNote)
                        ? dto?.Note
                        : $"{dto?.Note} | Bằng chứng: {dto?.ProofNote}"),
                "Đã xác nhận giao hàng thành công."));

        [HttpPost("shipments/{id}/delivery-failed")]
        public async Task<IActionResult> DeliveryFailed(int id, [FromBody] ShipperActionDto? dto) =>
            Ok(ApiResponse.Ok(
                await _shipperService.ReportDeliveryFailedAsync(UserId, id, dto?.FailureReason, dto?.Note),
                "Đã ghi nhận giao hàng thất bại."));
    }
}
