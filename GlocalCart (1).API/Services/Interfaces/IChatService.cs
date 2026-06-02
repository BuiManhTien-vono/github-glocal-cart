using GlocalCart.API.DTOs.Chat;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IChatService
    {
        Task<IReadOnlyList<ChatConversationDto>> GetConversationsAsync(int userId);
        Task<ChatConversationDto> StartConversationAsync(int userId, StartConversationDto dto);
        Task<ChatConversationDto> StartSupportConversationAsync(int userId);
        Task<IReadOnlyList<ChatMessageDto>> GetMessagesAsync(int userId, int conversationId, int page, int pageSize);
        Task<ChatMessageDto> SendMessageAsync(int userId, int conversationId, SendChatMessageDto dto);
        Task MarkAsReadAsync(int userId, int conversationId);
    }
}
