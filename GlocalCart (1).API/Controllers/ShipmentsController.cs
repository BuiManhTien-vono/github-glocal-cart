using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.DTOs.Orders;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ShipmentsController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public ShipmentsController(IOrderService orderService) { _orderService = orderService; }

        /// <summary>
        /// Seller cập nhật trạng thái vận chuyển
        /// </summary>
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> UpdateShipmentStatus(int id, [FromBody] UpdateShipmentStatusDto dto)
        {
            await _orderService.UpdateShipmentStatusAsync(UserId, id, dto);
            return Ok(new { success = true, message = "Cập nhật trạng thái vận chuyển thành công." });
        }

        /// <summary>
        /// Xem lịch sử vận chuyển
        /// </summary>
        [HttpGet("{id}/logs")]
        public async Task<IActionResult> GetShipmentLogs(int id) =>
            Ok(await _orderService.GetShipmentLogsAsync(UserId, id));
    }
}
