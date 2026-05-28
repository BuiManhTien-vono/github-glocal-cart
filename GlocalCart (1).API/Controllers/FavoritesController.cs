using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Favorites;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FavoritesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public FavoritesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetFavorites()
        {
            var favorites = await _db.ProductFavorites
                .Where(f => f.UserId == UserId)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new
                {
                    id = f.ProductId,
                    name = f.Product.Name,
                    price = f.Product.Price,
                    mediaUrl = f.Product.Images
                        .Where(i => i.IsMain)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault() ?? f.Product.MediaUrl,
                    imageUrls = f.Product.Images
                        .OrderByDescending(i => i.IsMain)
                        .ThenBy(i => i.Id)
                        .Select(i => i.ImageUrl)
                        .ToList(),
                    sellerName = f.Product.Seller.FullName,
                    averageRating = f.Product.Reviews.Any()
                        ? f.Product.Reviews.Average(r => r.Rating)
                        : 0,
                    stock = f.Product.AvailableItemCount,
                    favoritedAt = f.CreatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse.Ok(favorites));
        }

        [HttpPost]
        public async Task<IActionResult> AddFavorite([FromBody] AddFavoriteDto dto)
        {
            var productExists = await _db.Products.AnyAsync(p =>
                p.Id == dto.ProductId && p.IsActive && !p.IsLocked);
            if (!productExists)
                return NotFound(ApiResponse.NotFound("Khong tim thay san pham."));

            var exists = await _db.ProductFavorites
                .AnyAsync(f => f.UserId == UserId && f.ProductId == dto.ProductId);
            if (!exists)
            {
                _db.ProductFavorites.Add(new ProductFavorite
                {
                    UserId = UserId,
                    ProductId = dto.ProductId
                });
                await _db.SaveChangesAsync();
            }

            return Ok(ApiResponse.Ok("Da them san pham vao yeu thich."));
        }

        [HttpDelete("{productId:int}")]
        public async Task<IActionResult> RemoveFavorite(int productId)
        {
            var favorite = await _db.ProductFavorites
                .FirstOrDefaultAsync(f => f.UserId == UserId && f.ProductId == productId);
            if (favorite != null)
            {
                _db.ProductFavorites.Remove(favorite);
                await _db.SaveChangesAsync();
            }

            return Ok(ApiResponse.Ok("Da xoa san pham khoi yeu thich."));
        }
    }
}
