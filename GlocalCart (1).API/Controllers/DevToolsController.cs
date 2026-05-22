using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Payments;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Implementations;


namespace GlocalCart.API.Controllers
{
    /// <summary>
    /// Controller tiện ích dành cho quá trình phát triển.
    /// KHÔNG dùng trong môi trường Production.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DevToolsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        public DevToolsController(AppDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
        }

        /// <summary>
        /// Force cập nhật ảnh đúng theo tên sản phẩm từ thư mục wwwroot.
        /// Gọi endpoint này sau khi đã đặt file ảnh vào wwwroot/images/products/
        /// </summary>
        [HttpPost("refresh-product-images")]
        public async Task<IActionResult> RefreshProductImages()
        {
            var productImageFileMap = new Dictionary<string, string>
            {
                { "Điện thoại iPhone 15 Pro",  "iphone15pro.png" },
                { "Tai nghe AirPods Pro 2",    "airpods_pro2.png" },
                { "Laptop MacBook Air M2",      "macbook_air_m2.png" },
                { "Ốp lưng Silicone",          "op_lung_silicone.png" },
                { "Áo sơ mi nam công sở",      "ao_so_mi_nam.png" },
                { "Quần Jean nam phong cách",   "quan_jean_nam.png" },
                { "Giày thể thao Sneaker",     "giay_sneaker.png" },
                { "Tai nghe Sony WF",          "tai_nghe_sony.png" },
                { "Nồi chiên không dầu",       "noi_chien_khong_dau.png" },
                { "Bếp từ đôi hồng ngoại",    "bep_tu_doi.png" },
                { "Bàn phím cơ không dây",     "ban_phim_co.png" },
                { "Chuột không dây Logitech",  "chuot_logitech.png" },
                { "Tủ quần áo gỗ sồi",        "tu_quan_ao_go.png" },
                { "Ghế làm việc Ergonomic",    "ghe_ergonomic.png" },
                { "Tinh chất Dưỡng Da",        "tinh_chat_duong_da.png" },
                { "Sữa rửa mặt Cetaphil",     "sua_rua_mat_cetaphil.png" },
            };

            var imageDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "products");
            var results = new List<object>();

            var products = await _db.Products
                .Include(p => p.Images)
                .ToListAsync();

            int updatedCount = 0;
            foreach (var product in products)
            {
                if (!productImageFileMap.TryGetValue(product.Name, out var imgFile))
                {
                    results.Add(new { product.Name, status = "Không có mapping" });
                    continue;
                }

                var imgPath = Path.Combine(imageDir, imgFile);
                if (!System.IO.File.Exists(imgPath))
                {
                    results.Add(new { product.Name, status = $"File không tồn tại: {imgFile}" });
                    continue;
                }

                var imgData = await System.IO.File.ReadAllBytesAsync(imgPath);

                // Xóa ảnh cũ, tạo ảnh mới nếu chưa có
                if (!product.Images.Any())
                {
                    _db.ProductImages.Add(new Models.ProductImage
                    {
                        ProductId = product.Id,
                        ImageData = imgData,
                        ContentType = "image/png",
                        ImageUrl = "",
                        IsMain = true,
                        DisplayOrder = 0
                    });
                    await _db.SaveChangesAsync();

                    // Lấy ảnh vừa tạo để có Id
                    var newImg = await _db.ProductImages
                        .Where(pi => pi.ProductId == product.Id && pi.IsMain)
                        .OrderByDescending(pi => pi.Id)
                        .FirstAsync();
                    newImg.ImageUrl = $"/api/products/images/{newImg.Id}/data";
                    product.MediaUrl = newImg.ImageUrl;
                }
                else
                {
                    foreach (var img in product.Images)
                    {
                        img.ImageData = imgData;
                        img.ContentType = "image/png";
                        img.ImageUrl = $"/api/products/images/{img.Id}/data";
                    }
                    product.MediaUrl = $"/api/products/images/{product.Images.First().Id}/data";
                }

                await _db.SaveChangesAsync();
                updatedCount++;
                results.Add(new { product.Name, status = $"✅ Cập nhật thành công ({imgData.Length / 1024} KB)" });
            }

            return Ok(ApiResponse.Ok(new
            {
                updatedCount,
                results
            }, $"Đã cập nhật {updatedCount}/{products.Count} sản phẩm."));
        }

        /// <summary>

        /// Tạo payload + chữ ký HMAC để test POST /api/payments/webhook (chỉ Development).
        /// </summary>
        [HttpPost("bank/build-webhook")]
        public async Task<IActionResult> BuildWebhookPayload([FromBody] BankSimulateDto dto)
        {
            if (!_env.IsDevelopment())
                return NotFound();

            var settings = HttpContext.RequestServices
                .GetRequiredService<IConfiguration>()
                .GetSection("PaymentSettings");

            var merchantId = settings["MerchantId"] ?? "MERCHANT_001";
            var secretKey = settings["SecretKey"] ?? "default_secret";
            var status = string.IsNullOrWhiteSpace(dto.Status) ? "PAID" : dto.Status.ToUpperInvariant();
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            var order = await _db.Orders.AsNoTracking()
                .FirstOrDefaultAsync(o => o.OrderNumber == dto.OrderNumber);

            if (order == null)
                return NotFound(ApiResponse.Fail("Không tìm thấy đơn hàng."));

            var payload = new WebhookRequestDto
            {
                MerchantId = merchantId,
                OrderId = order.OrderNumber,
                Amount = order.TotalAmount,
                TransactionId = "TEST-" + Guid.NewGuid().ToString("N")[..10].ToUpper(),
                Timestamp = timestamp,
                Status = status
            };

            var raw = $"{payload.MerchantId}|{payload.OrderId}|{(int)payload.Amount}|{payload.Timestamp}";
            var signature = PaymentService.GenerateHmacForTest(raw, secretKey);

            return Ok(ApiResponse.Ok(new
            {
                payload,
                headers = new { X_Signature = signature },
                curlHint = $"POST /api/payments/webhook với header X-Signature: {signature}"
            }));
        }
    }

    public class BankSimulateDto
    {
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = "PAID";
    }
}
