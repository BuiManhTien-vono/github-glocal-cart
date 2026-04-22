using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Reviews;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class ReviewService : IReviewService
    {
        private readonly AppDbContext _db;

        public ReviewService(AppDbContext db) { _db = db; }

        public async Task<PagedResult<ReviewResponseDto>> GetProductReviewsAsync(int productId, int page, int pageSize)
        {
            return await _db.ProductReviews
                .Include(r => r.User)
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewResponseDto
                {
                    Id = r.Id, UserId = r.UserId, UserName = r.User.FullName,
                    Rating = r.Rating, Review = r.Review, CreatedAt = r.CreatedAt
                })
                .ToPagedResultAsync(page, pageSize);
        }

        public async Task<ReviewResponseDto> CreateReviewAsync(int userId, int productId, CreateReviewDto dto)
        {
            // Kiểm tra sản phẩm tồn tại
            var product = await _db.Products.FindAsync(productId)
                ?? throw new KeyNotFoundException("Sản phẩm không tồn tại.");

            // Kiểm tra đơn hàng đã Complete
            var order = await _db.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.BuyerId == userId && o.Status == OrderStatus.Complete)
                ?? throw new InvalidOperationException("Bạn chỉ có thể đánh giá sau khi đơn hàng hoàn thành.");

            // Kiểm tra sản phẩm có trong đơn hàng
            if (!order.OrderItems.Any(oi => oi.ProductId == productId))
                throw new InvalidOperationException("Sản phẩm này không có trong đơn hàng.");

            // Kiểm tra chưa đánh giá
            if (await _db.ProductReviews.AnyAsync(r => r.UserId == userId && r.ProductId == productId && r.OrderId == dto.OrderId))
                throw new InvalidOperationException("Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi.");

            var review = new ProductReview
            {
                ProductId = productId, UserId = userId, OrderId = dto.OrderId,
                Rating = dto.Rating, Review = dto.Review
            };

            _db.ProductReviews.Add(review);
            await _db.SaveChangesAsync();

            var user = await _db.Users.FindAsync(userId);
            return new ReviewResponseDto
            {
                Id = review.Id, UserId = userId, UserName = user!.FullName,
                Rating = review.Rating, Review = review.Review, CreatedAt = review.CreatedAt
            };
        }
    }
}
