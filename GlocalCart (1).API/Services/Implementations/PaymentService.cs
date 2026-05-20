using System.Security.Cryptography;
using System.Text;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Payments;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GlocalCart.API.Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _db;
        private readonly INotificationService _notif;
        private readonly string _merchantId;
        private readonly string _secretKey;
        private readonly string _bankId;
        private readonly string _bankAccount;
        private readonly string _accountName;

        public PaymentService(AppDbContext db, IConfiguration config, INotificationService notif)
        {
            _db = db;
            _notif = notif;

            var settings = config.GetSection("PaymentSettings");
            _merchantId = settings["MerchantId"] ?? "MERCHANT_001";
            _secretKey = settings["SecretKey"] ?? "default_secret";
            _bankId = settings["BankId"] ?? "vietinbank";
            _bankAccount = settings["BankAccount"] ?? "1133666688888";
            _accountName = settings["AccountName"] ?? "CONG TY DEMO";
        }

        public async Task<PaymentInitiateResponseDto> InitiatePaymentAsync(int buyerId, int orderId)
        {
            var order = await LoadOrderWithPaymentAsync(orderId);

            if (order.BuyerId != buyerId)
                throw new UnauthorizedAccessException("Bạn không có quyền thanh toán đơn hàng này.");

            var payment = order.Payment
                ?? throw new InvalidOperationException("Đơn hàng chưa có thông tin thanh toán.");

            if (!OrderBusinessRules.CanInitiateBankPayment(payment))
                throw new InvalidOperationException(
                    $"Không thể khởi tạo thanh toán ở trạng thái: {payment.Status}");

            long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            string orderNumber = order.OrderNumber;
            decimal amount = order.TotalAmount;

            string rawData = $"{_merchantId}|{orderNumber}|{(int)amount}|{timestamp}";
            string signature = GenerateHmacHash(rawData, _secretKey);

            string description = Uri.EscapeDataString($"Thanh toan {orderNumber}");
            string qrUrl = $"https://img.vietqr.io/image/{_bankId}-{_bankAccount}-compact2.png?amount={(int)amount}&addInfo={description}&accountName={Uri.EscapeDataString(_accountName)}";

            return new PaymentInitiateResponseDto
            {
                MerchantId = _merchantId,
                OrderId = orderNumber,
                Amount = amount,
                Timestamp = timestamp,
                Signature = signature,
                VietQrUrl = qrUrl
            };
        }

        public async Task<PaymentStatusDto> ConfirmTransferAsync(int buyerId, int orderId)
        {
            var order = await LoadOrderWithPaymentAsync(orderId);

            if (order.BuyerId != buyerId)
                throw new UnauthorizedAccessException("Bạn không có quyền xác nhận thanh toán đơn hàng này.");

            var payment = order.Payment
                ?? throw new InvalidOperationException("Đơn hàng chưa có thông tin thanh toán.");

            if (!OrderBusinessRules.CanConfirmTransfer(payment))
                throw new InvalidOperationException(
                    $"Không thể xác nhận chuyển khoản ở trạng thái: {payment.Status}");

            payment.Status = PaymentStatus.Pending;
            payment.UpdatedAt = DateTime.UtcNow;

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = order.Id,
                Status = order.Status,
                Note = "Người mua xác nhận đã chuyển khoản. Đang chờ ngân hàng đối soát."
            });

            await _db.SaveChangesAsync();

            var sellerIds = await _db.OrderItems
                .Where(oi => oi.OrderId == orderId)
                .Select(oi => oi.SellerId)
                .Distinct()
                .ToListAsync();

            foreach (var sellerId in sellerIds)
                await _notif.CreateNotificationAsync(sellerId,
                    $"Đơn #{order.OrderNumber}: người mua đã chuyển khoản, chờ ngân hàng xác nhận.");

            return MapPaymentStatus(order);
        }

        public async Task<PaymentStatusDto> GetPaymentStatusAsync(int userId, int orderId)
        {
            var order = await LoadOrderWithPaymentAsync(orderId);

            var isBuyer = order.BuyerId == userId;
            var isSeller = await _db.OrderItems.AnyAsync(oi => oi.OrderId == orderId && oi.SellerId == userId);
            var isAdmin = await _db.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.Admin);

            if (!isBuyer && !isSeller && !isAdmin)
                throw new UnauthorizedAccessException("Bạn không có quyền xem thanh toán đơn hàng này.");

            return MapPaymentStatus(order);
        }

        public async Task<bool> ProcessCallbackAsync(WebhookRequestDto callback, string signature)
        {
            if (!VerifySignature(callback, signature))
                return false;

            return await ApplyBankResultAsync(callback.OrderId, callback.Amount, callback.TransactionId, callback.Status);
        }

        public async Task<bool> SimulateBankCallbackAsync(string orderNumber, string status)
        {
            var order = await _db.Orders.Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);

            if (order?.Payment == null) return false;

            return await ApplyBankResultAsync(
                orderNumber,
                order.TotalAmount,
                "SIM-" + Guid.NewGuid().ToString("N")[..12].ToUpper(),
                status);
        }

        private async Task<bool> ApplyBankResultAsync(string orderNumber, decimal amount, string transactionId, string status)
        {
            var order = await _db.Orders
                .Include(o => o.Payment)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);

            if (order?.Payment == null) return false;

            if (!OrderBusinessRules.RequiresBankConfirmation(order.Payment))
                return false;

            if (order.Payment.Status == PaymentStatus.Completed && status == "PAID")
                return true;

            if (order.TotalAmount != amount)
                return false;

            if (status == "PAID")
            {
                order.Payment.Status = PaymentStatus.Completed;
                order.Payment.TransactionRef = transactionId;
                order.Payment.UpdatedAt = DateTime.UtcNow;

                _db.OrderLogs.Add(new OrderLog
                {
                    OrderId = order.Id,
                    Status = order.Status,
                    Note = "Thanh toán thành công qua ngân hàng. Đang chờ người bán xác nhận."
                });

                var sellerIds = order.OrderItems.Select(oi => oi.SellerId).Distinct();
                foreach (var sellerId in sellerIds)
                    await _notif.CreateNotificationAsync(sellerId,
                        $"YÊU CẦU XÁC NHẬN: Đơn #{order.OrderNumber} đã thanh toán, vui lòng xác nhận để chuẩn bị hàng.");

                await _notif.CreateNotificationAsync(order.BuyerId,
                    $"Thanh toán đơn #{order.OrderNumber} đã được ngân hàng xác nhận.");
            }
            else if (status == "FAILED")
            {
                await CancelOrderDueToFailedPaymentAsync(order, transactionId);
            }

            await _db.SaveChangesAsync();
            return true;
        }

        private async Task CancelOrderDueToFailedPaymentAsync(Order order, string transactionId)
        {
            if (order.Status is OrderStatus.Canceled or OrderStatus.Complete)
                return;

            var items = await _db.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.OrderId == order.Id)
                .ToListAsync();

            foreach (var item in items)
                item.Product.AvailableItemCount += item.Quantity;

            order.Status = OrderStatus.Canceled;
            order.Payment!.Status = PaymentStatus.Failed;
            order.Payment.TransactionRef = transactionId;
            order.Payment.UpdatedAt = DateTime.UtcNow;

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = order.Id,
                Status = OrderStatus.Canceled,
                Note = $"Thanh toán thất bại từ ngân hàng. GD: {transactionId}"
            });

            await _notif.CreateNotificationAsync(order.BuyerId,
                $"Thanh toán đơn #{order.OrderNumber} thất bại. Đơn hàng đã bị hủy.");
        }

        private async Task<Order> LoadOrderWithPaymentAsync(int orderId) =>
            await _db.Orders
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

        private static PaymentStatusDto MapPaymentStatus(Order order)
        {
            var payment = order.Payment!;
            var isPaid = payment.Status == PaymentStatus.Completed;

            return new PaymentStatusDto
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                Method = payment.Method.ToString(),
                Status = payment.Status.ToString(),
                Amount = payment.Amount,
                TransactionRef = payment.TransactionRef,
                CanInitiatePayment = OrderBusinessRules.CanInitiateBankPayment(payment),
                CanConfirmTransfer = OrderBusinessRules.CanConfirmTransfer(payment),
                IsPaid = isPaid
            };
        }

        private bool VerifySignature(WebhookRequestDto callback, string signature)
        {
            string rawData = $"{callback.MerchantId}|{callback.OrderId}|{(int)callback.Amount}|{callback.Timestamp}";
            return signature == GenerateHmacHash(rawData, _secretKey);
        }

        private static string GenerateHmacHash(string data, string key) => GenerateHmacForTest(data, key);

        /// <summary>Public cho DevTools tạo chữ ký test webhook.</summary>
        public static string GenerateHmacForTest(string data, string key)
        {
            byte[] keyBytes = Encoding.UTF8.GetBytes(key);
            byte[] dataBytes = Encoding.UTF8.GetBytes(data);

            using var hmac = new HMACSHA256(keyBytes);
            byte[] hashBytes = hmac.ComputeHash(dataBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}
