using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.DTOs.Cart;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public CartController(ICartService cartService) { _cartService = cartService; }

        [HttpGet]
        public async Task<IActionResult> GetCart() => Ok(await _cartService.GetCartAsync(UserId));

        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto) =>
            Ok(await _cartService.AddToCartAsync(UserId, dto));

        [HttpPut("{itemId}")]
        public async Task<IActionResult> UpdateCartItem(int itemId, [FromBody] UpdateCartItemDto dto) =>
            Ok(await _cartService.UpdateCartItemAsync(UserId, itemId, dto));

        [HttpDelete("{itemId}")]
        public async Task<IActionResult> RemoveCartItem(int itemId)
        {
            await _cartService.RemoveCartItemAsync(UserId, itemId);
            return Ok(new { success = true, message = "Đã xóa sản phẩm khỏi giỏ." });
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            await _cartService.ClearCartAsync(UserId);
            return Ok(new { success = true, message = "Đã xóa toàn bộ giỏ hàng." });
        }

        /// <summary>
        /// Đồng bộ giỏ hàng từ Guest (AsyncStorage) sang Member
        /// </summary>
        [HttpPost("sync")]
        public async Task<IActionResult> SyncCart([FromBody] SyncCartDto dto) =>
            Ok(await _cartService.SyncCartAsync(UserId, dto));
    }
}
