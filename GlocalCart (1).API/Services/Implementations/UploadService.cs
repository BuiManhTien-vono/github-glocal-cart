using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using System;
using System.IO;
using System.Threading.Tasks;

namespace GlocalCart.API.Services.Implementations
{
    public class UploadService : IUploadService
    {
        private readonly string _webRootPath;

        public UploadService(Microsoft.AspNetCore.Hosting.IWebHostEnvironment env)
        {
            _webRootPath = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        public async Task<string> UploadAndCompressImageAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File is empty or null.");
            }

            var uploadsFolder = Path.Combine(_webRootPath, "images", folderName);
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}.webp";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using var image = await Image.LoadAsync(file.OpenReadStream());
            
            // Tùy chọn: Resize ảnh nếu quá lớn (ví dụ max width 1200px) để tiết kiệm băng thông
            if (image.Width > 1200)
            {
                var newHeight = (int)((double)1200 / image.Width * image.Height);
                image.Mutate(x => x.Resize(1200, newHeight));
            }

            // Nén sang định dạng WebP với chất lượng cao
            var encoder = new WebpEncoder
            {
                Quality = 80 // Điều chỉnh mức độ nén 0-100
            };

            await image.SaveAsWebpAsync(filePath, encoder);

            // Trả về URL tương đối
            return $"/images/{folderName}/{fileName}";
        }
    }
}
