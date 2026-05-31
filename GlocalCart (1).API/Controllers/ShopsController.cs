using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ShopsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public ShopsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("followed")]
        public async Task<IActionResult> GetFollowedShops()
        {
            var shops = await _db.ShopFollows
                .Where(f => f.UserId == UserId)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new
                {
                    id = f.ShopId,
                    name = f.Shop.FullName,
                    logoUrl = (string?)null,
                    productCount = _db.Products.Count(p => p.SellerId == f.ShopId && p.IsActive && !p.IsLocked),
                    followedAt = f.CreatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse.Ok(shops));
        }

        [HttpGet("sellers")]
        public async Task<IActionResult> GetSellers()
        {
            var sellers = await _db.Users
                .Where(u => u.IsSeller)
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    id = u.Id,
                    name = string.IsNullOrWhiteSpace(u.FullName) ? (u.UserName ?? $"Seller #{u.Id}") : u.FullName,
                    avatarUrl = (string?)null,
                    productCount = _db.Products.Count(p => p.SellerId == u.Id && p.IsActive && !p.IsLocked)
                })
                .ToListAsync();

            return Ok(ApiResponse.Ok(sellers));
        }

        [HttpPost("{shopId:int}/follow")]
        public async Task<IActionResult> FollowShop(int shopId)
        {
            if (shopId == UserId)
                return BadRequest(ApiResponse.Fail("Khong the theo doi shop cua chinh ban."));

            var shopExists = await _db.Users.AnyAsync(u => u.Id == shopId && u.IsSeller)
                || await _db.Products.AnyAsync(p => p.SellerId == shopId);
            if (!shopExists)
                return NotFound(ApiResponse.NotFound("Khong tim thay shop."));

            var exists = await _db.ShopFollows.AnyAsync(f => f.UserId == UserId && f.ShopId == shopId);
            if (!exists)
            {
                _db.ShopFollows.Add(new ShopFollow
                {
                    UserId = UserId,
                    ShopId = shopId
                });
                await _db.SaveChangesAsync();
            }

            return Ok(ApiResponse.Ok("Da theo doi shop."));
        }

        [HttpDelete("{shopId:int}/follow")]
        public async Task<IActionResult> UnfollowShop(int shopId)
        {
            await RemoveFollowAsync(shopId);
            return Ok(ApiResponse.Ok("Da huy theo doi shop."));
        }

        [HttpPost("{shopId:int}/unfollow")]
        public async Task<IActionResult> UnfollowShopPost(int shopId)
        {
            await RemoveFollowAsync(shopId);
            return Ok(ApiResponse.Ok("Da huy theo doi shop."));
        }

        private async Task RemoveFollowAsync(int shopId)
        {
            var follow = await _db.ShopFollows
                .FirstOrDefaultAsync(f => f.UserId == UserId && f.ShopId == shopId);

            if (follow != null)
            {
                _db.ShopFollows.Remove(follow);
                await _db.SaveChangesAsync();
            }
        }
    }
}
