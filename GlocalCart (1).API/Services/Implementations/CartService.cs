using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Cart;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class CartService : ICartService
    {
        private readonly AppDbContext _db;

        public CartService(AppDbContext db) { _db = db; }

        public async Task<CartResponseDto> GetCartAsync(int userId)
        {
            var items = await _db.CartItems
                .Include(ci => ci.Product).ThenInclude(p => p.Images)
                .Where(ci => ci.UserId == userId)
                .Select(ci => new CartItemResponseDto
                {
                    Id = ci.Id, ProductId = ci.ProductId,
                    ProductName = ci.Product.Name,
                    ProductImage = ci.Product.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault() ?? ci.Product.MediaUrl,
                    PriceSnapshot = ci.PriceSnapshot, CurrentPrice = ci.Product.Price,
                    Quantity = ci.Quantity, AvailableStock = ci.Product.AvailableItemCount
                }).ToListAsync();

            return new CartResponseDto { Items = items };
        }

        public async Task<CartItemResponseDto> AddToCartAsync(int userId, AddToCartDto dto)
        {
            var product = await _db.Products.FindAsync(dto.ProductId)
                ?? throw new KeyNotFoundException("Sản phẩm không tồn tại.");

            if (!product.IsActive || product.IsLocked)
                throw new InvalidOperationException("Sản phẩm không khả dụng.");

            if (dto.Quantity > product.AvailableItemCount)
                throw new InvalidOperationException("Số lượng vượt quá tồn kho.");

            // Kiểm tra đã có trong giỏ chưa
            var existing = await _db.CartItems
                .FirstOrDefaultAsync(ci => ci.UserId == userId && ci.ProductId == dto.ProductId);

            if (existing != null)
            {
                existing.Quantity += dto.Quantity;
                existing.PriceSnapshot = product.Price;
            }
            else
            {
                existing = new CartItem
                {
                    UserId = userId, ProductId = dto.ProductId,
                    Quantity = dto.Quantity, PriceSnapshot = product.Price
                };
                _db.CartItems.Add(existing);
            }

            await _db.SaveChangesAsync();

            return new CartItemResponseDto
            {
                Id = existing.Id, ProductId = product.Id, ProductName = product.Name,
                PriceSnapshot = existing.PriceSnapshot, CurrentPrice = product.Price,
                Quantity = existing.Quantity, AvailableStock = product.AvailableItemCount
            };
        }

        public async Task<CartItemResponseDto> UpdateCartItemAsync(int userId, int itemId, UpdateCartItemDto dto)
        {
            var item = await _db.CartItems.Include(ci => ci.Product)
                .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng.");

            if (dto.Quantity > item.Product.AvailableItemCount)
                throw new InvalidOperationException("Số lượng vượt quá tồn kho.");

            item.Quantity = dto.Quantity;
            await _db.SaveChangesAsync();

            return new CartItemResponseDto
            {
                Id = item.Id, ProductId = item.ProductId, ProductName = item.Product.Name,
                PriceSnapshot = item.PriceSnapshot, CurrentPrice = item.Product.Price,
                Quantity = item.Quantity, AvailableStock = item.Product.AvailableItemCount
            };
        }

        public async Task<bool> RemoveCartItemAsync(int userId, int itemId)
        {
            var item = await _db.CartItems.FirstOrDefaultAsync(ci => ci.Id == itemId && ci.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng.");
            _db.CartItems.Remove(item);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ClearCartAsync(int userId)
        {
            var items = await _db.CartItems.Where(ci => ci.UserId == userId).ToListAsync();
            _db.CartItems.RemoveRange(items);
            await _db.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Đồng bộ giỏ hàng từ Guest (AsyncStorage) sang Member (Database)
        /// </summary>
        public async Task<CartResponseDto> SyncCartAsync(int userId, SyncCartDto dto)
        {
            foreach (var syncItem in dto.Items)
            {
                var product = await _db.Products.FindAsync(syncItem.ProductId);
                if (product == null || !product.IsActive || product.IsLocked) continue;

                var existing = await _db.CartItems
                    .FirstOrDefaultAsync(ci => ci.UserId == userId && ci.ProductId == syncItem.ProductId);

                if (existing != null)
                {
                    existing.Quantity = Math.Max(existing.Quantity, syncItem.Quantity);
                    existing.PriceSnapshot = product.Price;
                }
                else
                {
                    _db.CartItems.Add(new CartItem
                    {
                        UserId = userId, ProductId = syncItem.ProductId,
                        Quantity = Math.Min(syncItem.Quantity, product.AvailableItemCount),
                        PriceSnapshot = product.Price
                    });
                }
            }

            await _db.SaveChangesAsync();
            return await GetCartAsync(userId);
        }
    }
}
