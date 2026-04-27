using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.DTOs.Reviews;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/products/{productId}/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService) { _reviewService = reviewService; }

        /// <summary>
        /// Xem đánh giá sản phẩm (Public)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetReviews(int productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _reviewService.GetProductReviewsAsync(productId, page, pageSize)));

        /// <summary>
        /// Viết đánh giá (chỉ sau khi đơn hàng Complete)
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview(int productId, [FromBody] CreateReviewDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(ApiResponse.Created(await _reviewService.CreateReviewAsync(userId, productId, dto), "Đánh giá thành công."));
        }
    }
}
