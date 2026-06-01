using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Favorites;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GlocalCart.API.Services.Implementations
{
    public class FavoriteService : IFavoriteService
    {
        private readonly AppDbContext _db;

        public FavoriteService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<FavoriteProductDto>> GetFavoritesAsync(int userId)
        {
            return await _db.ProductFavorites
                .AsNoTracking()
                .Where(f => f.UserId == userId)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new FavoriteProductDto
                {
                    Id = f.ProductId,
                    Name = f.Product.Name,
                    Price = f.Product.Price,
                    MediaUrl = f.Product.Images
                        .Where(i => i.IsMain)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault() ?? f.Product.MediaUrl,
                    ImageUrls = f.Product.Images
                        .OrderByDescending(i => i.IsMain)
                        .ThenBy(i => i.Id)
                        .Select(i => i.ImageUrl)
                        .ToList(),
                    SellerName = f.Product.Seller.FullName,
                    AverageRating = f.Product.Reviews.Any()
                        ? f.Product.Reviews.Average(r => r.Rating)
                        : 0,
                    Stock = f.Product.AvailableItemCount,
                    FavoritedAt = f.CreatedAt
                })
                .ToListAsync();
        }

        public async Task AddFavoriteAsync(int userId, int productId)
        {
            var productExists = await _db.Products.AnyAsync(p =>
                p.Id == productId && p.IsActive && !p.IsLocked);
            if (!productExists)
            {
                throw new KeyNotFoundException("Khong tim thay san pham.");
            }

            var exists = await _db.ProductFavorites
                .AnyAsync(f => f.UserId == userId && f.ProductId == productId);
            if (exists)
            {
                return;
            }

            _db.ProductFavorites.Add(new ProductFavorite
            {
                UserId = userId,
                ProductId = productId
            });
            await _db.SaveChangesAsync();
        }

        public async Task RemoveFavoriteAsync(int userId, int productId)
        {
            var favorite = await _db.ProductFavorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId);
            if (favorite == null)
            {
                return;
            }

            _db.ProductFavorites.Remove(favorite);
            await _db.SaveChangesAsync();
        }
    }
}
