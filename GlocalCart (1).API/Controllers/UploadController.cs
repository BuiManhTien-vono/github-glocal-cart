using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace GlocalCart.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IUploadService _uploadService;

        public UploadController(IUploadService uploadService)
        {
            _uploadService = uploadService;
        }

        [HttpPost]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage(IFormFile file, [FromForm] string folderName = "general")
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Không tìm thấy file hợp lệ." });
                }

                // Kiểm tra định dạng (Optional, tuỳ nhu cầu)
                var allowedMimeTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/webp" };
                if (Array.IndexOf(allowedMimeTypes, file.ContentType.ToLower()) < 0)
                {
                    return BadRequest(new { success = false, message = "Chỉ chấp nhận các định dạng ảnh: JPG, PNG, WEBP." });
                }

                var imageUrl = await _uploadService.UploadAndCompressImageAsync(file, folderName);

                // Build full URL if needed (Optional)
                var request = HttpContext.Request;
                var baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
                var fullUrl = $"{baseUrl}{imageUrl}";

                return Ok(new
                {
                    success = true,
                    message = "Upload thành công",
                    data = new { url = fullUrl, relativeUrl = imageUrl }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ", error = ex.Message });
            }
        }
    }
}
