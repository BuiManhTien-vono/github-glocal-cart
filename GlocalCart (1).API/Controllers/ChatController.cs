using System.Security.Claims;
using GlocalCart.API.DTOs.Chat;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GlocalCart.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var conversations = await _chatService.GetConversationsAsync(UserId);
            return Ok(ApiResponse.Ok(conversations));
        }

        [HttpPost("conversations")]
        public async Task<IActionResult> StartConversation([FromBody] StartConversationDto dto)
        {
            var conversation = await _chatService.StartConversationAsync(UserId, dto);
            return Ok(ApiResponse.Ok(conversation));
        }

        [HttpPost("support")]
        public async Task<IActionResult> StartSupportConversation()
        {
            var conversation = await _chatService.StartSupportConversationAsync(UserId);
            return Ok(ApiResponse.Ok(conversation));
        }

        [HttpGet("conversations/{conversationId:int}/messages")]
        public async Task<IActionResult> GetMessages(
            int conversationId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var messages = await _chatService.GetMessagesAsync(UserId, conversationId, page, pageSize);
            return Ok(ApiResponse.Ok(messages));
        }

        [HttpPost("conversations/{conversationId:int}/messages")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SendMessage(int conversationId, [FromForm] SendChatMessageDto dto)
        {
            var message = await _chatService.SendMessageAsync(UserId, conversationId, dto);
            return Ok(ApiResponse.Ok(message, "Da gui tin nhan."));
        }

        [HttpPatch("conversations/{conversationId:int}/read")]
        public async Task<IActionResult> MarkAsRead(int conversationId)
        {
            await _chatService.MarkAsReadAsync(UserId, conversationId);
            return Ok(ApiResponse.Ok("Da doc tin nhan."));
        }
    }
}
