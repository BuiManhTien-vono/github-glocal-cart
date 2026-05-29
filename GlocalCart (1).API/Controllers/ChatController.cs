using System.Security.Claims;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Chat;
using GlocalCart.API.Helpers;
using GlocalCart.API.Hubs;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GlocalCart.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IUploadService _uploadService;
        private readonly IHubContext<ChatHub> _chatHub;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public ChatController(AppDbContext db, IUploadService uploadService, IHubContext<ChatHub> chatHub)
        {
            _db = db;
            _uploadService = uploadService;
            _chatHub = chatHub;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var conversations = await _db.ChatConversations
                .AsNoTracking()
                .Include(c => c.Buyer)
                .Include(c => c.Seller)
                .Where(c => c.BuyerId == UserId || c.SellerId == UserId)
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new ChatConversationDto
                {
                    Id = c.Id,
                    BuyerId = c.BuyerId,
                    SellerId = c.SellerId,
                    OtherUserId = c.BuyerId == UserId ? c.SellerId : c.BuyerId,
                    OtherUserName = c.BuyerId == UserId ? c.Seller.FullName : c.Buyer.FullName,
                    ShopName = c.BuyerId == UserId ? c.Seller.FullName : c.Buyer.FullName,
                    LastMessage = c.LastMessage ?? string.Empty,
                    UnreadCount = c.Messages.Count(m => m.SenderId != UserId && !m.IsRead),
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse.Ok(conversations));
        }

        [HttpPost("conversations")]
        public async Task<IActionResult> StartConversation([FromBody] StartConversationDto dto)
        {
            if (dto.SellerId <= 0)
            {
                return BadRequest(ApiResponse.Fail("Seller khong hop le."));
            }

            if (dto.SellerId == UserId)
            {
                return BadRequest(ApiResponse.Fail("Khong the chat voi chinh minh."));
            }

            var sellerExists = await _db.Users.AnyAsync(u => u.Id == dto.SellerId && u.IsSeller);
            if (!sellerExists)
            {
                sellerExists = await _db.Products.AnyAsync(p => p.SellerId == dto.SellerId);
            }

            if (!sellerExists)
            {
                return NotFound(ApiResponse.NotFound("Khong tim thay nguoi ban."));
            }

            if (dto.ProductId.HasValue)
            {
                var productBelongsToSeller = await _db.Products
                    .AnyAsync(p => p.Id == dto.ProductId.Value && p.SellerId == dto.SellerId);
                if (!productBelongsToSeller)
                {
                    return BadRequest(ApiResponse.Fail("San pham khong thuoc nguoi ban nay."));
                }
            }

            var conversation = await _db.ChatConversations
                .FirstOrDefaultAsync(c => c.BuyerId == UserId && c.SellerId == dto.SellerId);

            if (conversation == null)
            {
                var now = DateTime.UtcNow;
                conversation = new ChatConversation
                {
                    BuyerId = UserId,
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

            var dtoResult = await BuildConversationDto(conversation.Id);
            return Ok(ApiResponse.Ok(dtoResult));
        }

        [HttpGet("conversations/{conversationId:int}/messages")]
        public async Task<IActionResult> GetMessages(int conversationId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var conversation = await GetAccessibleConversation(conversationId);
            if (conversation == null)
            {
                return NotFound(ApiResponse.NotFound("Khong tim thay hoi thoai."));
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

            var messages = messageEntities.Select(m => ToMessageDto(m, UserId)).ToList();

            return Ok(ApiResponse.Ok(messages));
        }

        [HttpPost("conversations/{conversationId:int}/messages")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SendMessage(int conversationId, [FromForm] SendChatMessageDto dto)
        {
            var conversation = await GetAccessibleConversation(conversationId);
            if (conversation == null)
            {
                return NotFound(ApiResponse.NotFound("Khong tim thay hoi thoai."));
            }

            var text = dto.Text?.Trim();
            if (string.IsNullOrWhiteSpace(text) && (dto.Image == null || dto.Image.Length == 0))
            {
                return BadRequest(ApiResponse.Fail("Vui long nhap tin nhan hoac chon anh."));
            }

            string? imageUrl = null;
            if (dto.Image != null && dto.Image.Length > 0)
            {
                var allowedMimeTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/webp" };
                if (!allowedMimeTypes.Contains(dto.Image.ContentType.ToLower()))
                {
                    return BadRequest(ApiResponse.Fail("Chi chap nhan anh JPG, PNG hoac WEBP."));
                }

                imageUrl = await _uploadService.UploadAndCompressImageAsync(dto.Image, "chat");
            }

            var now = DateTime.UtcNow;
            var message = new ChatMessage
            {
                ConversationId = conversationId,
                SenderId = UserId,
                Text = text,
                ImageUrl = imageUrl,
                IsRead = false,
                CreatedAt = now
            };

            conversation.LastMessage = !string.IsNullOrWhiteSpace(text) ? text : "[Anh]";
            conversation.LastMessageSenderId = UserId;
            conversation.UpdatedAt = now;

            _db.ChatMessages.Add(message);
            await _db.SaveChangesAsync();

            var receiverId = conversation.BuyerId == UserId ? conversation.SellerId : conversation.BuyerId;

            await _chatHub.Clients.Group(ChatHub.UserGroup(UserId))
                .SendAsync("ReceiveMessage", ToMessageDto(message, UserId));
            await _chatHub.Clients.Group(ChatHub.UserGroup(receiverId))
                .SendAsync("ReceiveMessage", ToMessageDto(message, receiverId));

            var senderConversation = await BuildConversationDtoForUser(conversationId, UserId);
            var receiverConversation = await BuildConversationDtoForUser(conversationId, receiverId);

            if (senderConversation != null)
            {
                await _chatHub.Clients.Group(ChatHub.UserGroup(UserId))
                    .SendAsync("ConversationUpdated", senderConversation);
            }

            if (receiverConversation != null)
            {
                await _chatHub.Clients.Group(ChatHub.UserGroup(receiverId))
                    .SendAsync("ConversationUpdated", receiverConversation);
            }

            return Ok(ApiResponse.Ok(ToMessageDto(message, UserId), "Da gui tin nhan."));
        }

        [HttpPatch("conversations/{conversationId:int}/read")]
        public async Task<IActionResult> MarkAsRead(int conversationId)
        {
            var conversation = await GetAccessibleConversation(conversationId);
            if (conversation == null)
            {
                return NotFound(ApiResponse.NotFound("Khong tim thay hoi thoai."));
            }

            await _db.ChatMessages
                .Where(m => m.ConversationId == conversationId && m.SenderId != UserId && !m.IsRead)
                .ExecuteUpdateAsync(setters => setters.SetProperty(m => m.IsRead, true));

            return Ok(ApiResponse.Ok("Da doc tin nhan."));
        }

        private async Task<ChatConversation?> GetAccessibleConversation(int conversationId)
        {
            return await _db.ChatConversations
                .FirstOrDefaultAsync(c => c.Id == conversationId && (c.BuyerId == UserId || c.SellerId == UserId));
        }

        private async Task<ChatConversationDto?> BuildConversationDto(int conversationId)
        {
            return await BuildConversationDtoForUser(conversationId, UserId);
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
