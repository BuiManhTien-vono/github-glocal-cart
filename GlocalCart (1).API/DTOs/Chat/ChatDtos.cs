using Microsoft.AspNetCore.Http;

namespace GlocalCart.API.DTOs.Chat
{
    public class StartConversationDto
    {
        public int SellerId { get; set; }
        public int? ProductId { get; set; }
    }

    public class SendChatMessageDto
    {
        public string? Text { get; set; }
        public IFormFile? Image { get; set; }
    }

    public class ChatConversationDto
    {
        public int Id { get; set; }
        public int BuyerId { get; set; }
        public int SellerId { get; set; }
        public int OtherUserId { get; set; }
        public string OtherUserName { get; set; } = string.Empty;
        public string ShopName { get; set; } = string.Empty;
        public string LastMessage { get; set; } = string.Empty;
        public int UnreadCount { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ChatMessageDto
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public int SenderId { get; set; }
        public bool IsMine { get; set; }
        public string? Text { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
