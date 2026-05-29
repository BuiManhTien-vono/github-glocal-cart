using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }

        public int ConversationId { get; set; }
        public int SenderId { get; set; }

        [MaxLength(2000)]
        public string? Text { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ChatConversation Conversation { get; set; } = null!;
        public User Sender { get; set; } = null!;
    }
}
