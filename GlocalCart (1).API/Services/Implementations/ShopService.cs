using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Shops;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GlocalCart.API.Services.Implementations
{
    public class ShopService : IShopService
    {
        private readonly AppDbContext _db;

        public ShopService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<FollowedShopDto>> GetFollowedShopsAsync(int userId)
        {
            return await _db.ShopFollows
                .AsNoTracking()
                .Where(f => f.UserId == userId)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new FollowedShopDto
                {
                    Id = f.ShopId,
                    Name = f.Shop.FullName,
                    LogoUrl = null,
                    ProductCount = _db.Products.Count(p => p.SellerId == f.ShopId && p.IsActive && !p.IsLocked),
                    FollowedAt = f.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<IReadOnlyList<SellerSummaryDto>> GetSellersAsync()
        {
            return await _db.Users
                .AsNoTracking()
                .Where(u => u.IsSeller)
                .OrderBy(u => u.FullName)
                .Select(u => new SellerSummaryDto
                {
                    Id = u.Id,
                    Name = string.IsNullOrWhiteSpace(u.FullName)
                        ? (u.UserName ?? $"Seller #{u.Id}")
                        : u.FullName,
                    AvatarUrl = null,
                    ProductCount = _db.Products.Count(p => p.SellerId == u.Id && p.IsActive && !p.IsLocked)
                })
                .ToListAsync();
        }

        public async Task FollowShopAsync(int userId, int shopId)
        {
            if (shopId == userId)
            {
                throw new ArgumentException("Khong the theo doi shop cua chinh ban.");
            }

            var shopExists = await _db.Users.AnyAsync(u => u.Id == shopId && u.IsSeller)
                || await _db.Products.AnyAsync(p => p.SellerId == shopId);
            if (!shopExists)
            {
                throw new KeyNotFoundException("Khong tim thay shop.");
            }

            var exists = await _db.ShopFollows.AnyAsync(f => f.UserId == userId && f.ShopId == shopId);
            if (exists)
            {
                return;
            }

            _db.ShopFollows.Add(new ShopFollow
            {
                UserId = userId,
                ShopId = shopId
            });
            await _db.SaveChangesAsync();
        }

        public async Task UnfollowShopAsync(int userId, int shopId)
        {
            var follow = await _db.ShopFollows
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ShopId == shopId);
            if (follow == null)
            {
                return;
            }

            _db.ShopFollows.Remove(follow);
            await _db.SaveChangesAsync();
        }
    }
}
