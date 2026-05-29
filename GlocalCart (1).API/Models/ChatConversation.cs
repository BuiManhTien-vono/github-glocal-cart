using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    public class ChatConversation
    {
        public int Id { get; set; }

        public int BuyerId { get; set; }
        public int SellerId { get; set; }
        public int? ProductId { get; set; }

        [MaxLength(1000)]
        public string? LastMessage { get; set; }

        public int? LastMessageSenderId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User Buyer { get; set; } = null!;
        public User Seller { get; set; } = null!;
        public Product? Product { get; set; }
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
