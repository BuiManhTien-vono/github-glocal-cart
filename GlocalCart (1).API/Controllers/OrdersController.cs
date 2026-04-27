using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.DTOs.Orders;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public OrdersController(IOrderService orderService) { _orderService = orderService; }

        // === BUYER ===
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto) =>
            Ok(ApiResponse.Created(await _orderService.CreateOrderAsync(UserId, dto), "Đặt hàng thành công."));

        [HttpGet]
        public async Task<IActionResult> GetMyOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _orderService.GetBuyerOrdersAsync(UserId, page, pageSize)));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id) =>
            Ok(ApiResponse.Ok(await _orderService.GetOrderByIdAsync(UserId, id)));

        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            await _orderService.CancelOrderAsync(UserId, id);
            return Ok(ApiResponse.Ok("Đã hủy đơn hàng."));
        }

        [HttpGet("{id}/logs")]
        public async Task<IActionResult> GetOrderLogs(int id) =>
            Ok(ApiResponse.Ok(await _orderService.GetOrderLogsAsync(UserId, id)));

        // === SELLER ===
        [HttpGet("seller")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> GetSellerOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _orderService.GetSellerOrdersAsync(UserId, page, pageSize)));

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            await _orderService.UpdateOrderStatusAsync(UserId, id, dto);
            return Ok(ApiResponse.Ok("Cập nhật trạng thái thành công."));
        }

        [HttpPatch("{id}/reject")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> RejectOrder(int id, [FromBody] RejectOrderDto dto)
        {
            await _orderService.RejectOrderAsync(UserId, id, dto);
            return Ok(ApiResponse.Ok("Đã từ chối đơn hàng."));
        }

        // === SHIPMENT ===
        [HttpPost("{id}/shipment")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> CreateShipment(int id, [FromBody] CreateShipmentDto dto) =>
            Ok(ApiResponse.Created(await _orderService.CreateShipmentAsync(UserId, id, dto), "Tạo vận đơn thành công."));

        [HttpGet("{id}/shipment")]
        public async Task<IActionResult> GetShipment(int id) =>
            Ok(ApiResponse.Ok(await _orderService.GetShipmentAsync(UserId, id)));
    }
}
