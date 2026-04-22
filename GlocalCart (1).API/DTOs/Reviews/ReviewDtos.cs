using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.DTOs.Reviews
{
    public class CreateReviewDto
    {
        [Required]
        public int OrderId { get; set; }

        [Required, Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(2000)]
        public string? Review { get; set; }
    }

    public class ReviewResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Review { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
