using System.Security.Claims;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ShopsController : ControllerBase
    {
        private readonly IShopService _shopService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public ShopsController(IShopService shopService)
        {
            _shopService = shopService;
        }

        [HttpGet("followed")]
        public async Task<IActionResult> GetFollowedShops()
        {
            var shops = await _shopService.GetFollowedShopsAsync(UserId);
            return Ok(ApiResponse.Ok(shops));
        }

        [HttpGet("sellers")]
        public async Task<IActionResult> GetSellers()
        {
            var sellers = await _shopService.GetSellersAsync();
            return Ok(ApiResponse.Ok(sellers));
        }

        [HttpPost("{shopId:int}/follow")]
        public async Task<IActionResult> FollowShop(int shopId)
        {
            await _shopService.FollowShopAsync(UserId, shopId);
            return Ok(ApiResponse.Ok("Da theo doi shop."));
        }

        [HttpDelete("{shopId:int}/follow")]
        public async Task<IActionResult> UnfollowShop(int shopId)
        {
            await _shopService.UnfollowShopAsync(UserId, shopId);
            return Ok(ApiResponse.Ok("Da huy theo doi shop."));
        }

        [HttpPost("{shopId:int}/unfollow")]
        public async Task<IActionResult> UnfollowShopPost(int shopId)
        {
            await _shopService.UnfollowShopAsync(UserId, shopId);
            return Ok(ApiResponse.Ok("Da huy theo doi shop."));
        }
    }
}
