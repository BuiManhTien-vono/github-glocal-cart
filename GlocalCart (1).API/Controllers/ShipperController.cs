using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.DTOs.Shipper;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    /// <summary>
    /// API dành cho nhân viên giao hàng (Shipper).
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Shipper,Admin")]
    public class ShipperController : ControllerBase
    {
        private readonly IShipperService _shipperService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public ShipperController(IShipperService shipperService) => _shipperService = shipperService;

        /// <summary>
        /// Danh sách vận đơn chờ shipper nhận (đã có vận đơn, chưa gán shipper).
        /// </summary>
        [HttpGet("shipments/available")]
        public async Task<IActionResult> GetAvailable([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _shipperService.GetAvailableShipmentsAsync(page, pageSize)));

        /// <summary>
        /// Vận đơn shipper đang giao.
        /// </summary>
        [HttpGet("shipments/mine")]
        public async Task<IActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _shipperService.GetMyShipmentsAsync(UserId, page, pageSize)));

        /// <summary>
        /// Chi tiết vận đơn.
        /// </summary>
        [HttpGet("shipments/{id}")]
        public async Task<IActionResult> GetDetail(int id) =>
            Ok(ApiResponse.Ok(await _shipperService.GetShipmentDetailAsync(UserId, id)));

        /// <summary>
        /// Shipper nhận đơn giao hàng.
        /// </summary>
        [HttpPost("shipments/{id}/accept")]
        public async Task<IActionResult> Accept(int id, [FromBody] ShipperActionDto? dto) =>
            Ok(ApiResponse.Ok(
                await _shipperService.AcceptShipmentAsync(UserId, id, dto?.Note),
                "Đã nhận đơn giao hàng."));

        /// <summary>
        /// Shipper xác nhận đã giao thành công.
        /// </summary>
        [HttpPost("shipments/{id}/deliver")]
        public async Task<IActionResult> Deliver(int id, [FromBody] ShipperActionDto? dto) =>
            Ok(ApiResponse.Ok(
                await _shipperService.ConfirmDeliveredAsync(UserId, id, dto?.Note),
                "Đã xác nhận giao hàng thành công."));
    }
}
