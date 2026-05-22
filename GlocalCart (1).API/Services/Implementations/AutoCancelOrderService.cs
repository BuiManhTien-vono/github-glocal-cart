using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.Enums;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class AutoCancelOrderService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AutoCancelOrderService> _logger;

        public AutoCancelOrderService(IServiceScopeFactory scopeFactory, ILogger<AutoCancelOrderService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AutoCancelOrderService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessCancellationsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while executing AutoCancelOrderService.");
                }

                // Check every 5 minutes
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }

            _logger.LogInformation("AutoCancelOrderService is stopping.");
        }

        private async Task ProcessCancellationsAsync(CancellationToken stoppingToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notif = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var thresholdDate = DateTime.UtcNow.AddHours(-24);

            var overdueOrders = await db.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Include(o => o.Payment)
                .Where(o => o.Status == OrderStatus.Pending
                         && o.Payment != null
                         && o.Payment.Method == PaymentMethod.ElectronicBankTransfer
                         && o.Payment.Status == PaymentStatus.Unpaid
                         && o.OrderDate <= thresholdDate)
                .ToListAsync(stoppingToken);

            if (!overdueOrders.Any())
                return;

            _logger.LogInformation($"Found {overdueOrders.Count} overdue orders to cancel.");

            foreach (var order in overdueOrders)
            {
                order.Status = OrderStatus.Canceled;
                if (order.Payment != null)
                {
                    order.Payment.Status = PaymentStatus.Failed;
                    order.Payment.UpdatedAt = DateTime.UtcNow;
                }

                db.OrderLogs.Add(new OrderLog
                {
                    OrderId = order.Id,
                    Status = OrderStatus.Canceled,
                    Note = "Hệ thống tự động hủy đơn vì quá 24h chưa thanh toán chuyển khoản."
                });

                // Hoàn tồn kho
                foreach (var item in order.OrderItems)
                {
                    item.Product.AvailableItemCount += item.Quantity;
                }

                // Thông báo cho Buyer
                await notif.CreateNotificationAsync(
                    order.BuyerId,
                    $"Đơn hàng #{order.OrderNumber} đã bị hệ thống hủy tự động vì quá hạn thanh toán."
                );

                // Thông báo cho Seller
                var sellerIds = order.OrderItems.Select(oi => oi.SellerId).Distinct();
                foreach (var sid in sellerIds)
                {
                    await notif.CreateNotificationAsync(
                        sid,
                        $"Đơn hàng #{order.OrderNumber} đã bị hủy do khách hàng không thanh toán."
                    );
                }
            }

            await db.SaveChangesAsync(stoppingToken);
        }
    }
}
