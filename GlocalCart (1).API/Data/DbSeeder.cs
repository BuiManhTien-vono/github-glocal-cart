using GlocalCart.API.Models;
using GlocalCart.API.Enums;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace GlocalCart.API.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (await context.Products.AnyAsync()) return;

            string passwordHash = BCrypt.Net.BCrypt.HashPassword("Password@123");
            var rand = new Random();

            var users = new List<User>();
            for (int i = 1; i <= 10; i++)
            {
                users.Add(new User
                {
                    UserName = $"user{i}",
                    Email = $"user{i}@example.com",
                    PasswordHash = passwordHash,
                    FullName = $"Người dùng {i}",
                    Phone = $"090000000{i % 10}",
                    Role = UserRole.Member,
                    IsSeller = i <= 3,
                    AccountStatus = AccountStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();

            var sellers = users.Where(u => u.IsSeller).ToList();
            var buyers = users.Where(u => !u.IsSeller).ToList();

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
                var seller = sellers[i % sellers.Count];
                int categoryId = 6; 
                if (productNames[i].Contains("Áo") || productNames[i].Contains("Quần") || productNames[i].Contains("Giày")) categoryId = 9;
                else if (productNames[i].Contains("Nồi") || productNames[i].Contains("Bếp")) categoryId = 12;
                else if (productNames[i].Contains("Tủ") || productNames[i].Contains("Ghế")) categoryId = 13;

                products.Add(new Product
                {
                    SellerId = seller.Id,
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

            var images = new List<ProductImage>();
            var catalogProducts = new List<CatalogProduct>();
            foreach (var p in products)
            {
                images.Add(new ProductImage { ProductId = p.Id, ImageUrl = "https://via.placeholder.com/600", IsMain = true });
                catalogProducts.Add(new CatalogProduct { ProductId = p.Id, CatalogId = rand.Next(1, 4) });
            }
            await context.ProductImages.AddRangeAsync(images);
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
            
            var orders = new List<Order>();
            for (int i = 1; i <= 12; i++)
            {
                var buyer = buyers[i % buyers.Count];
                var address = addresses.First(a => a.UserId == buyer.Id);
                var isPaid = i % 2 == 0;

                orders.Add(new Order
                {
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

            foreach (var order in orders)
            {
                var numItems = rand.Next(1, 4);
                decimal orderTotal = 0;
                for (int j = 0; j < numItems; j++)
                {
                    var product = products[rand.Next(0, products.Count)];
                    if (!orderItems.Any(oi => oi.OrderId == order.Id && oi.ProductId == product.Id))
                    {
                        var oi = new OrderItem
                        {
                            OrderId = order.Id, ProductId = product.Id, SellerId = product.SellerId,
                            UnitPrice = product.Price, Quantity = rand.Next(1, 3)
                        };
                        orderTotal += oi.UnitPrice * oi.Quantity;
                        orderItems.Add(oi);

                        if (order.Id % 2 != 0 && !productReviews.Any(r => r.ProductId == product.Id && r.UserId == order.BuyerId && r.OrderId == order.Id))
                        {
                            productReviews.Add(new ProductReview
                            {
                                ProductId = product.Id, UserId = order.BuyerId, OrderId = order.Id,
                                Rating = rand.Next(4, 6), Review = "Sản phẩm tốt.", CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }
                order.TotalAmount = orderTotal + 30000m; 

                orderLogs.Add(new OrderLog { OrderId = order.Id, Status = OrderStatus.Pending, Note = "Đơn hàng đã được tạo.", CreatedAt = DateTime.UtcNow });
                
                if (order.Status == OrderStatus.Shipped)
                {
                    orderLogs.Add(new OrderLog { OrderId = order.Id, Status = OrderStatus.Shipped, Note = "Đang giao hàng", CreatedAt = DateTime.UtcNow.AddMinutes(5) });
                    payments.Add(new Payment
                    {
                        OrderId = order.Id, Amount = order.TotalAmount, Method = (PaymentMethod)1,
                        Status = PaymentStatus.Completed, TransactionRef = $"TXN{10000+order.Id}", CreatedAt = DateTime.UtcNow
                    });
                    
                    var shipment = new Shipment
                    {
                        OrderId = order.Id, TrackingNumber = $"VNPOST{123123+order.Id}",
                        ShipmentMethod = "Standard", EstimatedArrival = DateTime.UtcNow.AddDays(3), ShipmentDate = DateTime.UtcNow
                    };
                    shipments.Add(shipment);
                }
            }
            await context.OrderItems.AddRangeAsync(orderItems);
            await context.OrderLogs.AddRangeAsync(orderLogs);
            await context.Payments.AddRangeAsync(payments);
            await context.Shipments.AddRangeAsync(shipments);
            await context.ProductReviews.AddRangeAsync(productReviews);
            await context.SaveChangesAsync();

            foreach (var shipment in shipments)
            {
                shipmentLogs.Add(new ShipmentLog { ShipmentId = shipment.Id, Status = (ShipmentStatus)1, Note = "Hàng đang di chuyển", CreatedAt = DateTime.UtcNow });
            }
            await context.ShipmentLogs.AddRangeAsync(shipmentLogs);

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
    }
}
