namespace GlocalCart.API.Models
{
    public class ShopFollow
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public int ShopId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public User Shop { get; set; } = null!;
    }
}
