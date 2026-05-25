using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Models;
using GlocalCart.API.Enums;
using System.IO;

namespace GlocalCart.API.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(
            AppDbContext context,
            UserManager<User> userManager,
            RoleManager<IdentityRole<int>> roleManager)
        {
            await EnsureShipperRoleAndUserAsync(context, userManager, roleManager);
            var storeSeller = await EnsureStoreSellerUserAsync(context, userManager, roleManager);

            var productImageFileMap = new Dictionary<string, string>
            {
                { "Điện thoại iPhone 15 Pro", "iphone15pro.png" },
                { "Tai nghe AirPods Pro 2", "airpods_pro2.png" },
                { "Laptop MacBook Air M2", "macbook_air_m2.png" },
                { "Ốp lưng Silicone", "op_lung_silicone.png" },
                { "Áo sơ mi nam công sở", "ao_so_mi_nam.png" },
                { "Quần Jean nam phong cách", "quan_jean_nam.png" },
                { "Giày thể thao Sneaker", "giay_sneaker.png" },
                { "Tai nghe Sony WF", "tai_nghe_sony.png" },
                { "Nồi chiên không dầu", "noi_chien_khong_dau.png" },
                { "Bếp từ đôi hồng ngoại", "bep_tu_doi.png" },
                { "Bàn phím cơ không dây", "ban_phim_co.png" },
                { "Chuột không dây Logitech", "chuot_logitech.png" },
                { "Tủ quần áo gỗ sồi", "tu_quan_ao_go.png" },
                { "Ghế làm việc Ergonomic", "ghe_ergonomic.png" },
                { "Tinh chất Dưỡng Da", "tinh_chat_duong_da.png" },
                { "Sữa rửa mặt Cetaphil", "sua_rua_mat_cetaphil.png" }
            };

            var imageDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "products");
            var productsWithImages = await context.Products
                .Include(p => p.Images)
                .Where(p => p.Images.Any())
                .ToListAsync();

            var imageUpdated = false;
            foreach (var product in productsWithImages)
            {
                if (!productImageFileMap.TryGetValue(product.Name, out var imgFile))
                {
                    continue;
                }

                var imgPath = Path.Combine(imageDir, imgFile);
                if (!File.Exists(imgPath))
                {
                    continue;
                }

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

            if (imageUpdated)
            {
                await context.SaveChangesAsync();
            }

            if (await context.Products.AnyAsync())
            {
                return;
            }

            string[] roleNames = { "Member", "Seller", "Admin", "Shipper" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole<int> { Name = roleName });
                }
            }

            var adminUser = await userManager.FindByNameAsync("admin");
            if (adminUser == null)
            {
                adminUser = new User
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
            }

            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }

            var users = new List<User>();
            var rand = new Random();

            for (int i = 1; i <= 10; i++)
            {
                var user = await userManager.FindByNameAsync($"user{i}");
                if (user == null)
                {
                    user = new User
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

                    await userManager.CreateAsync(user, "Password@123");
                }

                if (!await userManager.IsInRoleAsync(user, "Member"))
                {
                    await userManager.AddToRoleAsync(user, "Member");
                }

                users.Add(user);
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
                    NameOnCard = randomUser.FullName.ToUpperInvariant(),
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

            var productNames = new[]
            {
                "Điện thoại iPhone 15 Pro",
                "Tai nghe AirPods Pro 2",
                "Laptop MacBook Air M2",
                "Ốp lưng Silicone",
                "Áo sơ mi nam công sở",
                "Quần Jean nam phong cách",
                "Giày thể thao Sneaker",
                "Tai nghe Sony WF",
                "Nồi chiên không dầu",
                "Bếp từ đôi hồng ngoại",
                "Bàn phím cơ không dây",
                "Chuột không dây Logitech",
                "Tủ quần áo gỗ sồi",
                "Ghế làm việc Ergonomic",
                "Tinh chất Dưỡng Da",
                "Sữa rửa mặt Cetaphil"
            };

            var products = new List<Product>();
            foreach (var productName in productNames)
            {
                var categoryId = 6;
                if (productName.Contains("Laptop")) categoryId = 7;
                else if (productName.Contains("Tai nghe") || productName.Contains("Ốp") || productName.Contains("Bàn phím") || productName.Contains("Chuột")) categoryId = 8;
                else if (productName.Contains("Áo")) categoryId = 9;
                else if (productName.Contains("Quần")) categoryId = 10;
                else if (productName.Contains("Giày")) categoryId = 11;
                else if (productName.Contains("Nồi") || productName.Contains("Bếp")) categoryId = 12;
                else if (productName.Contains("Tủ") || productName.Contains("Ghế")) categoryId = 13;
                else if (productName.Contains("Da") || productName.Contains("Cetaphil")) categoryId = 5;

                products.Add(new Product
                {
                    SellerId = storeSeller.Id,
                    CategoryId = categoryId,
                    Name = productName,
                    Description = $"Mô tả chuẩn SEO cho {productName} với chất lượng tốt.",
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

            var images = new List<ProductImage>();
            var catalogProducts = new List<CatalogProduct>();
            foreach (var product in products)
            {
                byte[]? imageData = null;
                var contentType = "image/png";

                if (productImageFileMap.TryGetValue(product.Name, out var imageFileName))
                {
                    var imagePath = Path.Combine(imageDir, imageFileName);
                    if (File.Exists(imagePath))
                    {
                        imageData = await File.ReadAllBytesAsync(imagePath);
                    }
                }

                images.Add(new ProductImage
                {
                    ProductId = product.Id,
                    ImageData = imageData,
                    ContentType = contentType,
                    ImageUrl = "",
                    IsMain = true
                });

                catalogProducts.Add(new CatalogProduct
                {
                    ProductId = product.Id,
                    CatalogId = rand.Next(1, 4)
                });
            }

            await context.ProductImages.AddRangeAsync(images);
            await context.SaveChangesAsync();

            foreach (var img in images)
            {
                img.ImageUrl = $"/api/products/images/{img.Id}/data";
                var product = products.FirstOrDefault(p => p.Id == img.ProductId);
                if (product != null)
                {
                    product.MediaUrl = img.ImageUrl;
                }
            }

            await context.CatalogProducts.AddRangeAsync(catalogProducts);

            var cartItems = new List<CartItem>();
            for (int i = 0; i < 15; i++)
            {
                var user = buyers[i % buyers.Count];
                var product = products[rand.Next(0, products.Count)];
                if (cartItems.Any(c => c.UserId == user.Id && c.ProductId == product.Id))
                {
                    continue;
                }

                cartItems.Add(new CartItem
                {
                    UserId = user.Id,
                    ProductId = product.Id,
                    Quantity = rand.Next(1, 3),
                    PriceSnapshot = product.Price,
                    AddedAt = DateTime.UtcNow
                });
            }

            await context.CartItems.AddRangeAsync(cartItems);

            var shipperUser = await userManager.FindByNameAsync("shipper");
            if (shipperUser != null && !await context.BankAccounts.AnyAsync(b => b.UserId == shipperUser.Id))
            {
                context.BankAccounts.Add(new BankAccount
                {
                    UserId = shipperUser.Id,
                    BankName = "Vietcombank (Shipper)",
                    RoutingNumber = "01123456",
                    AccountNumberMasked = "****1111",
                    Balance = 0,
                    CreatedAt = DateTime.UtcNow
                });
            }

            var orders = new List<Order>();
            var seededStatuses = new[]
            {
                OrderStatus.Pending,
                OrderStatus.Unshipped,
                OrderStatus.Shipped,
                OrderStatus.Complete,
                OrderStatus.Canceled
            };

            for (int i = 1; i <= 20; i++)
            {
                var buyer = buyers[i % buyers.Count];
                var address = addresses.FirstOrDefault(a => a.UserId == buyer.Id) ?? addresses.First();

                orders.Add(new Order
                {
                    OrderNumber = $"ORD2026{1000 + i}",
                    BuyerId = buyer.Id,
                    ShippingAddressId = address.Id,
                    TotalAmount = 0,
                    ShippingFee = 30000m,
                    Status = seededStatuses[i % seededStatuses.Length],
                    OrderDate = DateTime.UtcNow.AddDays(-i),
                    Note = "Giao cho tôi"
                });
            }

            await context.Orders.AddRangeAsync(orders);
            await context.SaveChangesAsync();

            var orderItems = new List<OrderItem>();
            var orderLogs = new List<OrderLog>();
            var payments = new List<Payment>();
            var shipments = new List<Shipment>();
            var productReviews = new List<ProductReview>();
            var shipperId = shipperUser?.Id;

            foreach (var order in orders)
            {
                var numItems = rand.Next(1, 4);
                decimal itemTotal = 0;

                for (int j = 0; j < numItems; j++)
                {
                    var product = products[rand.Next(0, products.Count)];
                    if (orderItems.Any(oi => oi.OrderId == order.Id && oi.ProductId == product.Id))
                    {
                        continue;
                    }

                    var quantity = rand.Next(1, 3);
                    itemTotal += product.Price * quantity;
                    orderItems.Add(new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = product.Id,
                        SellerId = product.SellerId,
                        Quantity = quantity,
                        UnitPrice = product.Price
                    });
                }

                order.TotalAmount = itemTotal + order.ShippingFee;
                orderLogs.Add(new OrderLog
                {
                    OrderId = order.Id,
                    Status = order.Status,
                    Note = "Trạng thái đơn hàng mẫu",
                    CreatedAt = order.OrderDate
                });

                var isBankTransfer = order.Id % 2 == 0;
                var isCompleted = order.Status == OrderStatus.Complete;
                payments.Add(new Payment
                {
                    OrderId = order.Id,
                    Method = isBankTransfer ? PaymentMethod.ElectronicBankTransfer : PaymentMethod.CreditCard,
                    Status = isCompleted ? PaymentStatus.Completed : (isBankTransfer ? PaymentStatus.Pending : PaymentStatus.Unpaid),
                    Amount = order.TotalAmount,
                    TransactionRef = isCompleted ? $"PAY{order.Id:0000}" : null,
                    CreatedAt = order.OrderDate,
                    UpdatedAt = DateTime.UtcNow
                });

                if (order.Status is OrderStatus.Unshipped or OrderStatus.Shipped or OrderStatus.Complete)
                {
                    var shipmentStatus = order.Status switch
                    {
                        OrderStatus.Complete => ShipmentStatus.Delivered,
                        OrderStatus.Shipped => ShipmentStatus.Shipped,
                        _ => ShipmentStatus.Pending
                    };

                    shipments.Add(new Shipment
                    {
                        OrderId = order.Id,
                        Status = shipmentStatus,
                        ShipperId = shipmentStatus == ShipmentStatus.Pending ? null : shipperId,
                        AssignedAt = shipmentStatus == ShipmentStatus.Pending ? null : order.OrderDate.AddHours(5),
                        AcceptedAt = shipmentStatus == ShipmentStatus.Pending ? null : order.OrderDate.AddHours(6),
                        PickedUpAt = shipmentStatus == ShipmentStatus.Pending ? null : order.OrderDate.AddHours(10),
                        DeliveredAt = shipmentStatus == ShipmentStatus.Delivered ? order.OrderDate.AddDays(2) : null,
                        TrackingNumber = $"VNPOST{123123 + order.Id}",
                        ShipmentMethod = "Giao Hàng Nhanh",
                        EstimatedArrival = order.OrderDate.AddDays(3),
                        ShipmentDate = order.OrderDate.AddHours(10),
                        CreatedAt = order.OrderDate
                    });
                }

                if (isCompleted)
                {
                    var firstOrderItem = orderItems.FirstOrDefault(oi => oi.OrderId == order.Id);
                    if (firstOrderItem != null)
                    {
                        productReviews.Add(new ProductReview
                        {
                            ProductId = firstOrderItem.ProductId,
                            UserId = order.BuyerId,
                            OrderId = order.Id,
                            Rating = rand.Next(4, 6),
                            Review = "Sản phẩm tốt, giao hàng đúng hẹn.",
                            CreatedAt = order.OrderDate.AddDays(3)
                        });
                    }
                }
            }

            await context.OrderItems.AddRangeAsync(orderItems);
            await context.OrderLogs.AddRangeAsync(orderLogs);
            await context.Payments.AddRangeAsync(payments);
            await context.Shipments.AddRangeAsync(shipments);
            await context.SaveChangesAsync();

            var shipmentLogs = shipments.Select(shipment => new ShipmentLog
            {
                ShipmentId = shipment.Id,
                Status = shipment.Status,
                Note = "Trạng thái vận chuyển mẫu",
                CreatedAt = shipment.CreatedAt
            }).ToList();

            await context.ShipmentLogs.AddRangeAsync(shipmentLogs);
            await context.ProductReviews.AddRangeAsync(productReviews);

            var notifications = new List<Notification>();
            for (int i = 1; i <= 20; i++)
            {
                var user = users[i % users.Count];
                var order = orders[(i - 1) % orders.Count];
                notifications.Add(new Notification
                {
                    UserId = user.Id,
                    Type = NotificationType.Email,
                    Action = NotificationAction.General,
                    RelatedOrderId = order.Id,
                    Content = $"Đơn hàng {order.OrderNumber} đang được cập nhật trạng thái.",
                    IsRead = i % 3 == 0,
                    CreatedAt = DateTime.UtcNow.AddHours(-i)
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
            {
                await roleManager.CreateAsync(new IdentityRole<int> { Name = "Shipper" });
            }

            var shipper = await userManager.FindByNameAsync("shipper");
            if (shipper == null)
            {
                shipper = new User
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

                await userManager.CreateAsync(shipper, "Shipper@123");
            }

            if (!await userManager.IsInRoleAsync(shipper, "Shipper"))
            {
                await userManager.AddToRoleAsync(shipper, "Shipper");
            }
        }

        private static async Task<User> EnsureStoreSellerUserAsync(
            AppDbContext context,
            UserManager<User> userManager,
            RoleManager<IdentityRole<int>> roleManager)
        {
            if (!await roleManager.RoleExistsAsync("Seller"))
            {
                await roleManager.CreateAsync(new IdentityRole<int> { Name = "Seller" });
            }

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
                {
                    throw new InvalidOperationException("Không thể tạo tài khoản cửa hàng mẫu.");
                }
            }

            if (!await userManager.IsInRoleAsync(storeSeller, "Seller"))
            {
                await userManager.AddToRoleAsync(storeSeller, "Seller");
            }

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
