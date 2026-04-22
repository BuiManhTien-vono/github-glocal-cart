using GlocalCart.API.DTOs.Reviews;
using GlocalCart.API.Helpers;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IReviewService
    {
        Task<PagedResult<ReviewResponseDto>> GetProductReviewsAsync(int productId, int page, int pageSize);
        Task<ReviewResponseDto> CreateReviewAsync(int userId, int productId, CreateReviewDto dto);
    }
}
