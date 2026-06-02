using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Chat;
using GlocalCart.API.Hubs;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GlocalCart.API.Services.Implementations
{
    public class ChatService : IChatService
    {
        private static readonly string[] AllowedImageMimeTypes =
        {
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp"
        };

        private readonly AppDbContext _db;
        private readonly IUploadService _uploadService;
        private readonly IHubContext<ChatHub> _chatHub;

        public ChatService(AppDbContext db, IUploadService uploadService, IHubContext<ChatHub> chatHub)
        {
            _db = db;
            _uploadService = uploadService;
            _chatHub = chatHub;
        }

        public async Task<IReadOnlyList<ChatConversationDto>> GetConversationsAsync(int userId)
        {
            return await _db.ChatConversations
                .AsNoTracking()
                .Include(c => c.Buyer)
                .Include(c => c.Seller)
                .Where(c => c.BuyerId == userId || c.SellerId == userId)
                .Where(c => c.Messages.Any())
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new ChatConversationDto
                {
                    Id = c.Id,
                    BuyerId = c.BuyerId,
                    SellerId = c.SellerId,
                    OtherUserId = c.BuyerId == userId ? c.SellerId : c.BuyerId,
                    OtherUserName = c.BuyerId == userId ? c.Seller.FullName : c.Buyer.FullName,
                    ShopName = c.BuyerId == userId ? c.Seller.FullName : c.Buyer.FullName,
                    LastMessage = c.LastMessage ?? string.Empty,
                    UnreadCount = c.Messages.Count(m => m.SenderId != userId && !m.IsRead),
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();
        }

        public async Task<ChatConversationDto> StartConversationAsync(int userId, StartConversationDto dto)
        {
            if (dto.SellerId <= 0)
            {
                throw new ArgumentException("Seller khong hop le.");
            }

            if (dto.SellerId == userId)
            {
                throw new ArgumentException("Khong the chat voi chinh minh.");
            }

            var sellerExists = await _db.Users.AnyAsync(u => u.Id == dto.SellerId && u.IsSeller);
            if (!sellerExists)
            {
                sellerExists = await _db.Products.AnyAsync(p => p.SellerId == dto.SellerId);
            }

            if (!sellerExists)
            {
                throw new KeyNotFoundException("Khong tim thay nguoi ban.");
            }

            if (dto.ProductId.HasValue)
            {
                var productBelongsToSeller = await _db.Products
                    .AnyAsync(p => p.Id == dto.ProductId.Value && p.SellerId == dto.SellerId);
                if (!productBelongsToSeller)
                {
                    throw new ArgumentException("San pham khong thuoc nguoi ban nay.");
                }
            }

            var conversation = await _db.ChatConversations
                .FirstOrDefaultAsync(c => c.BuyerId == userId && c.SellerId == dto.SellerId);

            if (conversation == null)
            {
                var now = DateTime.UtcNow;
                conversation = new ChatConversation
                {
                    BuyerId = userId,
                    SellerId = dto.SellerId,
                    ProductId = dto.ProductId,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _db.ChatConversations.Add(conversation);
                await _db.SaveChangesAsync();
            }
            else if (conversation.ProductId == null && dto.ProductId.HasValue)
            {
                conversation.ProductId = dto.ProductId;
                await _db.SaveChangesAsync();
            }

            return await BuildConversationDtoForUser(conversation.Id, userId)
                ?? throw new KeyNotFoundException("Khong tim thay hoi thoai.");
        }

        public async Task<ChatConversationDto> StartSupportConversationAsync(int userId)
        {
            var adminId = await (
                from user in _db.Users
                join userRole in _db.UserRoles on user.Id equals userRole.UserId
                join role in _db.Roles on userRole.RoleId equals role.Id
                where role.NormalizedName == "ADMIN" && user.Id != userId
                orderby user.Id
                select user.Id
            ).FirstOrDefaultAsync();

            if (adminId <= 0)
            {
                throw new KeyNotFoundException("Khong tim thay tai khoan admin ho tro.");
            }

            var conversation = await _db.ChatConversations
                .FirstOrDefaultAsync(c => c.BuyerId == userId && c.SellerId == adminId);

            if (conversation == null)
            {
                var now = DateTime.UtcNow;
                conversation = new ChatConversation
                {
                    BuyerId = userId,
                    SellerId = adminId,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _db.ChatConversations.Add(conversation);
                await _db.SaveChangesAsync();
            }

            return await BuildConversationDtoForUser(conversation.Id, userId)
                ?? throw new KeyNotFoundException("Khong tim thay hoi thoai ho tro.");
        }

        public async Task<IReadOnlyList<ChatMessageDto>> GetMessagesAsync(
            int userId,
            int conversationId,
            int page,
            int pageSize)
        {
            var conversation = await GetAccessibleConversationAsync(userId, conversationId);
            if (conversation == null)
            {
                throw new KeyNotFoundException("Khong tim thay hoi thoai.");
            }

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var messageEntities = await _db.ChatMessages
                .AsNoTracking()
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            return messageEntities.Select(m => ToMessageDto(m, userId)).ToList();
        }

        public async Task<ChatMessageDto> SendMessageAsync(int userId, int conversationId, SendChatMessageDto dto)
        {
            var conversation = await GetAccessibleConversationAsync(userId, conversationId);
            if (conversation == null)
            {
                throw new KeyNotFoundException("Khong tim thay hoi thoai.");
            }

            var text = dto.Text?.Trim();
            if (string.IsNullOrWhiteSpace(text) && (dto.Image == null || dto.Image.Length == 0))
            {
                throw new ArgumentException("Vui long nhap tin nhan hoac chon anh.");
            }

            string? imageUrl = null;
            if (dto.Image != null && dto.Image.Length > 0)
            {
                if (!AllowedImageMimeTypes.Contains(dto.Image.ContentType.ToLowerInvariant()))
                {
                    throw new ArgumentException("Chi chap nhan anh JPG, PNG hoac WEBP.");
                }

                imageUrl = await _uploadService.UploadAndCompressImageAsync(dto.Image, "chat");
            }

            var now = DateTime.UtcNow;
            var message = new ChatMessage
            {
                ConversationId = conversationId,
                SenderId = userId,
                Text = text,
                ImageUrl = imageUrl,
                IsRead = false,
                CreatedAt = now
            };

            conversation.LastMessage = !string.IsNullOrWhiteSpace(text) ? text : "[Anh]";
            conversation.LastMessageSenderId = userId;
            conversation.UpdatedAt = now;

            _db.ChatMessages.Add(message);
            await _db.SaveChangesAsync();

            await PublishMessageAsync(conversation, message, userId);

            return ToMessageDto(message, userId);
        }

        public async Task MarkAsReadAsync(int userId, int conversationId)
        {
            var conversation = await GetAccessibleConversationAsync(userId, conversationId);
            if (conversation == null)
            {
                throw new KeyNotFoundException("Khong tim thay hoi thoai.");
            }

            await _db.ChatMessages
                .Where(m => m.ConversationId == conversationId && m.SenderId != userId && !m.IsRead)
                .ExecuteUpdateAsync(setters => setters.SetProperty(m => m.IsRead, true));
        }

        private async Task PublishMessageAsync(ChatConversation conversation, ChatMessage message, int senderId)
        {
            var receiverId = conversation.BuyerId == senderId ? conversation.SellerId : conversation.BuyerId;

            await _chatHub.Clients.Group(ChatHub.UserGroup(senderId))
                .SendAsync("ReceiveMessage", ToMessageDto(message, senderId));
            await _chatHub.Clients.Group(ChatHub.UserGroup(receiverId))
                .SendAsync("ReceiveMessage", ToMessageDto(message, receiverId));

            var senderConversation = await BuildConversationDtoForUser(conversation.Id, senderId);
            var receiverConversation = await BuildConversationDtoForUser(conversation.Id, receiverId);

            if (senderConversation != null)
            {
                await _chatHub.Clients.Group(ChatHub.UserGroup(senderId))
                    .SendAsync("ConversationUpdated", senderConversation);
            }

            if (receiverConversation != null)
            {
                await _chatHub.Clients.Group(ChatHub.UserGroup(receiverId))
                    .SendAsync("ConversationUpdated", receiverConversation);
            }
        }

        private async Task<ChatConversation?> GetAccessibleConversationAsync(int userId, int conversationId)
        {
            return await _db.ChatConversations
                .FirstOrDefaultAsync(c => c.Id == conversationId && (c.BuyerId == userId || c.SellerId == userId));
        }

        private async Task<ChatConversationDto?> BuildConversationDtoForUser(int conversationId, int userId)
        {
            return await _db.ChatConversations
                .AsNoTracking()
                .Include(c => c.Buyer)
                .Include(c => c.Seller)
                .Where(c => c.Id == conversationId && (c.BuyerId == userId || c.SellerId == userId))
                .Select(c => new ChatConversationDto
                {
                    Id = c.Id,
                    BuyerId = c.BuyerId,
                    SellerId = c.SellerId,
                    OtherUserId = c.BuyerId == userId ? c.SellerId : c.BuyerId,
                    OtherUserName = c.BuyerId == userId ? c.Seller.FullName : c.Buyer.FullName,
                    ShopName = c.BuyerId == userId ? c.Seller.FullName : c.Buyer.FullName,
                    LastMessage = c.LastMessage ?? string.Empty,
                    UnreadCount = c.Messages.Count(m => m.SenderId != userId && !m.IsRead),
                    UpdatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();
        }

        private static ChatMessageDto ToMessageDto(ChatMessage message, int userId)
        {
            return new ChatMessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                IsMine = message.SenderId == userId,
                Text = message.Text,
                ImageUrl = message.ImageUrl,
                IsRead = message.IsRead,
                CreatedAt = message.CreatedAt
            };
        }
    }
}
