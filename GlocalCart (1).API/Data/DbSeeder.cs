using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Models;
using GlocalCart.API.Enums;
using System.IO;

namespace GlocalCart.API.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context, UserManager<User> userManager, RoleManager<IdentityRole<int>> roleManager)
        {
            await EnsureShipperRoleAndUserAsync(context, userManager, roleManager);
            var storeSeller = await EnsureStoreSellerUserAsync(context, userManager, roleManager);

            // === FORCE CẬP NHẬT ẢNH ĐÚNG THEO TÊN SẢN PHẨM ===
            // Chạy mỗi lần khởi động để đảm bảo ảnh luôn đúng với sản phẩm
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
            var productsWithImages = await context.Products
                .Include(p => p.Images)
                .Where(p => p.Images.Any())
                .ToListAsync();

            bool imageUpdated = false;
            foreach (var product in productsWithImages)
            {
                if (!productImageFileMap.TryGetValue(product.Name, out var imgFile)) continue;
                var imgPath = Path.Combine(imageDir, imgFile);
                if (!File.Exists(imgPath)) continue;

                var imgData = await File.ReadAllBytesAsync(imgPath);
                foreach (var img in product.Images)
                {
                    img.ImageData = imgData;
                    img.ContentType = "image/png";
                    img.ImageUrl = $"/api/products/images/{img.Id}/data";
                    imageUpdated = true;
                }
                product.MediaUrl = $"/api/products/images/{product.Images.First().Id}/data";
            }
            if (imageUpdated) await context.SaveChangesAsync();

            if (await context.Products.AnyAsync()) return;

            // Đảm bảo roles tồn tại
            string[] roleNames = { "Member", "Seller", "Admin", "Shipper" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole<int> { Name = roleName });
                }
            }

            // Tạo Admin user qua Identity
            var adminUser = new User
            {
                UserName = "admin",
                Email = "admin@glocalcart.com",
                FullName = "System Admin",
                PhoneNumber = "0900000000",
                Role = UserRole.Admin,
                IsSeller = false,
                AccountStatus = AccountStatus.Active,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            };
            await userManager.CreateAsync(adminUser, "Admin@123");
            await userManager.AddToRoleAsync(adminUser, "Admin");

            // Tạo 10 user mẫu qua Identity
            var users = new List<User>();
            var rand = new Random();

            for (int i = 1; i <= 10; i++)
            {
                var user = new User
                {
                    UserName = $"user{i}",
                    Email = $"user{i}@example.com",
                    FullName = $"Người dùng {i}",
                    PhoneNumber = $"090000000{i % 10}",
                    Role = UserRole.Member,
                    IsSeller = false,
                    AccountStatus = AccountStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(user, "Password@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Member");
                    users.Add(user);
                }
            }

            var buyers = users;

            var addresses = new List<UserAddress>();
            var creditCards = new List<CreditCard>();
            var bankAccounts = new List<BankAccount>();
            
            for (int i = 1; i <= 15; i++)
            {
                var randomUser = users[i % users.Count];
                addresses.Add(new UserAddress
                {
                    UserId = randomUser.Id,
                    StreetAddress = $"{i} Đường Lê Lợi",
                    City = "TP. Hồ Chí Minh",
                    State = "Q.1",
                    Zipcode = "700000",
                    Country = "Vietnam",
                    IsDefault = i <= users.Count
                });

                creditCards.Add(new CreditCard
                {
                    UserId = randomUser.Id,
                    NameOnCard = randomUser.FullName.ToUpper(),
                    CardNumberMasked = $"****412{i % 10}",
                    CodeEncrypted = "ENC",
                    BillingStreet = "Lê Lợi",
                    BillingCity = "HCM",
                    BillingCountry = "Vietnam",
                    CreatedAt = DateTime.UtcNow
                });

                bankAccounts.Add(new BankAccount
                {
                    UserId = randomUser.Id,
                    BankName = "Vietcombank",
                    RoutingNumber = "01123456",
                    AccountNumberMasked = $"****678{i % 10}",
                    CreatedAt = DateTime.UtcNow
                });
            }
            await context.UserAddresses.AddRangeAsync(addresses);
            await context.CreditCards.AddRangeAsync(creditCards);
            await context.BankAccounts.AddRangeAsync(bankAccounts);
            await context.SaveChangesAsync();

            var products = new List<Product>();
            string[] productNames = { 
                "Điện thoại iPhone 15 Pro", "Tai nghe AirPods Pro 2", "Laptop MacBook Air M2", "Ốp lưng Silicone",
                "Áo sơ mi nam công sở", "Quần Jean nam phong cách", "Giày thể thao Sneaker", "Tai nghe Sony WF",
                "Nồi chiên không dầu", "Bếp từ đôi hồng ngoại", "Bàn phím cơ không dây", "Chuột không dây Logitech",
                "Tủ quần áo gỗ sồi", "Ghế làm việc Ergonomic", "Tinh chất Dưỡng Da", "Sữa rửa mặt Cetaphil" 
            };

            for (int i = 0; i < productNames.Length; i++)
            {
                int categoryId = 6; 
                if (productNames[i].Contains("Áo") || productNames[i].Contains("Quần") || productNames[i].Contains("Giày")) categoryId = 9;
                else if (productNames[i].Contains("Nồi") || productNames[i].Contains("Bếp")) categoryId = 12;
                else if (productNames[i].Contains("Tủ") || productNames[i].Contains("Ghế")) categoryId = 13;

                products.Add(new Product
                {
                    SellerId = storeSeller.Id,
                    CategoryId = categoryId,
                    Name = productNames[i],
                    Description = $"Mô tả chuẩn SEO cho {productNames[i]} với chất lượng tuyệt đỉnh.",
                    Price = rand.Next(1, 20) * 500000m,
                    AvailableItemCount = rand.Next(50, 500),
                    IsActive = true,
                    IsLocked = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();

            // Tạo ProductImage cho từng sản phẩm mới seed (dùng lại productImageFileMap và imageDir đã khai báo ở trên)
            var images = new List<ProductImage>();
            var catalogProducts = new List<CatalogProduct>();
            foreach (var p in products)
            {
                byte[]? imageData = null;
                string contentType = "image/png";

                if (productImageFileMap.TryGetValue(p.Name, out var imageFileName))
                {
                    var imagePath = Path.Combine(imageDir, imageFileName);
                    if (File.Exists(imagePath))
                    {
                        imageData = await File.ReadAllBytesAsync(imagePath);
                    }
                }

                images.Add(new ProductImage
                {
                    ProductId = p.Id,
                    ImageData = imageData,
                    ContentType = contentType,
                    ImageUrl = "", // Tạm để trống, sẽ cập nhật sau khi có Id
                    IsMain = true
                });
                catalogProducts.Add(new CatalogProduct { ProductId = p.Id, CatalogId = rand.Next(1, 4) });
            }
            await context.ProductImages.AddRangeAsync(images);
            await context.SaveChangesAsync();

            // Sau khi có ID, cập nhật ImageUrl trỏ đến endpoint API + cập nhật MediaUrl của Product
            foreach (var img in images)
            {
                img.ImageUrl = $"/api/products/images/{img.Id}/data";
            }
            foreach (var img in images)
            {
                var product = products.FirstOrDefault(p => p.Id == img.ProductId);
                if (product != null) product.MediaUrl = img.ImageUrl;
            }
            await context.SaveChangesAsync();

            await context.CatalogProducts.AddRangeAsync(catalogProducts);



            var cartItems = new List<CartItem>();
            for (int i = 0; i < 15; i++)
            {
                var user = buyers[i % buyers.Count];
                var product = products[rand.Next(0, products.Count)];
                if (!cartItems.Any(c => c.UserId == user.Id && c.ProductId == product.Id))
                {
                    cartItems.Add(new CartItem { UserId = user.Id, ProductId = product.Id, Quantity = rand.Next(1, 3), AddedAt = DateTime.UtcNow });
                }
            }
            await context.CartItems.AddRangeAsync(cartItems);
            
            var shipperUser = await userManager.FindByNameAsync("shipper");
            if (shipperUser != null)
            {
                var hasBankAccount = await context.BankAccounts.AnyAsync(b => b.UserId == shipperUser.Id);
                if (!hasBankAccount)
                {
<<<<<<< Updated upstream
                    context.BankAccounts.Add(new BankAccount
=======
                    OrderNumber = $"ORD2026{(1000 + i)}",
                    BuyerId = buyer.Id,
                    ShippingAddressId = address.Id,
                    TotalAmount = 0, 
                    Status = isPaid ? OrderStatus.Shipped : OrderStatus.Pending,
                    OrderDate = DateTime.UtcNow,
                    Note = "Giao cho tôi"
                });
            }
            await context.Orders.AddRangeAsync(orders);
            await context.SaveChangesAsync();

            var orderItems = new List<OrderItem>();
            var orderLogs = new List<OrderLog>();
            var payments = new List<Payment>();
            var shipments = new List<Shipment>();
            var shipmentLogs = new List<ShipmentLog>();
            var productReviews = new List<ProductReview>();

            var shipperUser = context.Users.FirstOrDefault(u => u.UserName == "shipper");
            var shipperId = shipperUser?.Id;

            foreach (var order in orders)
            {
                var numItems = rand.Next(1, 4);
                decimal orderTotal = 0;
                for (int j = 0; j < numItems; j++)
                {
                    var product = products[rand.Next(0, products.Count)];
                    if (!orderItems.Any(oi => oi.OrderId == order.Id && oi.ProductId == product.Id))
>>>>>>> Stashed changes
                    {
                        UserId = shipperUser.Id,
                        BankName = "Vietcombank (Shipper)",
                        RoutingNumber = "01123456",
                        AccountNumberMasked = "****1111",
                        Balance = 0,
                        CreatedAt = DateTime.UtcNow
                    });
<<<<<<< Updated upstream
                    await context.SaveChangesAsync();
=======
                    
                    var shipment = new Shipment
                    {
                        OrderId = order.Id,
                        Status = ShipmentStatus.Shipped,
                        ShipperId = shipperId,
                        AssignedAt = DateTime.UtcNow,
                        TrackingNumber = $"VNPOST{123123 + order.Id}",
                        ShipmentMethod = "Giao Hàng Nhanh",
                        EstimatedArrival = DateTime.UtcNow.AddDays(3),
                        ShipmentDate = DateTime.UtcNow
                    };
                    shipments.Add(shipment);
>>>>>>> Stashed changes
                }
            }

            var notifications = new List<Notification>();
            for (int i = 1; i <= 20; i++)
            {
                var user = users[i % users.Count];
                notifications.Add(new Notification
                {
                    UserId = user.Id, Type = (NotificationType)1, Content = $"Đơn hàng ORD{(1000 + i)} đang được giao.",
                    IsRead = i % 3 == 0, CreatedAt = DateTime.UtcNow
                });
            }
            await context.Notifications.AddRangeAsync(notifications);

            await context.SaveChangesAsync();
        }

        private static async Task EnsureShipperRoleAndUserAsync(
            AppDbContext context,
            UserManager<User> userManager,
            RoleManager<IdentityRole<int>> roleManager)
        {
            if (!await roleManager.RoleExistsAsync("Shipper"))
                await roleManager.CreateAsync(new IdentityRole<int> { Name = "Shipper" });

            if (await userManager.FindByNameAsync("shipper") != null)
                return;

            var shipper = new User
            {
                UserName = "shipper",
                Email = "shipper@glocalcart.com",
                FullName = "Nguyễn Văn Giao",
                PhoneNumber = "0911222333",
                Role = UserRole.Shipper,
                IsSeller = false,
                AccountStatus = AccountStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(shipper, "Shipper@123");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(shipper, "Shipper");
        }

        private static async Task<User> EnsureStoreSellerUserAsync(
            AppDbContext context,
            UserManager<User> userManager,
            RoleManager<IdentityRole<int>> roleManager)
        {
            if (!await roleManager.RoleExistsAsync("Seller"))
                await roleManager.CreateAsync(new IdentityRole<int> { Name = "Seller" });

            var storeSeller = await userManager.FindByNameAsync("store");
            if (storeSeller == null)
            {
                storeSeller = new User
                {
                    UserName = "store",
                    Email = "store@glocalcart.com",
                    FullName = "GlocalCart Store",
                    PhoneNumber = "0900111222",
                    Role = UserRole.Seller,
                    IsSeller = true,
                    AccountStatus = AccountStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(storeSeller, "Store@123");
                if (!result.Succeeded)
                    throw new InvalidOperationException("Không thể tạo tài khoản cửa hàng mẫu.");

                await userManager.AddToRoleAsync(storeSeller, "Seller");
            }

            if (!await userManager.IsInRoleAsync(storeSeller, "Seller"))
                await userManager.AddToRoleAsync(storeSeller, "Seller");

            storeSeller.Role = UserRole.Seller;
            storeSeller.IsSeller = true;
            await userManager.UpdateAsync(storeSeller);

            if (!await context.BankAccounts.AnyAsync(b => b.UserId == storeSeller.Id))
            {
                context.BankAccounts.Add(new BankAccount
                {
                    UserId = storeSeller.Id,
                    BankName = "Vietcombank (Store)",
                    RoutingNumber = "01123456",
                    AccountNumberMasked = "****2222",
                    Balance = 0,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            return storeSeller;
        }
    }
}
