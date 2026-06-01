using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Payments;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Hubs;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
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
        private readonly string _bankGatewayUrl;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IHubContext<DeliveryHub> _deliveryHub;

        public PaymentService(
            AppDbContext db,
            IConfiguration config,
            INotificationService notif,
            IHttpClientFactory httpClientFactory,
            IHubContext<DeliveryHub> deliveryHub)
        {
            _db = db;
            _notif = notif;
            _httpClientFactory = httpClientFactory;
            _deliveryHub = deliveryHub;

            var settings = config.GetSection("PaymentSettings");
            _merchantId = settings["MerchantId"] ?? "MERCHANT_001";
            _secretKey = settings["SecretKey"] ?? "default_secret";
            _bankId = settings["BankId"] ?? "vietinbank";
            _bankAccount = settings["BankAccount"] ?? "1133666688888";
            _accountName = settings["AccountName"] ?? "CONG TY DEMO";
            _bankGatewayUrl = settings["BankGatewayUrl"] ?? "http://localhost:5000";
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

            var bill = await CreateGatewayBillAsync(order.OrderNumber, order.TotalAmount);

            if (payment.Status != PaymentStatus.Pending)
            {
                payment.Status = PaymentStatus.Pending;
                payment.UpdatedAt = DateTime.UtcNow;

                _db.OrderLogs.Add(new OrderLog
                {
                    OrderId = order.Id,
                    Status = order.Status,
                    Note = "Da tao bill thanh toan. Dang cho nguoi mua chuyen khoan va gateway xac nhan."
                });

                await _db.SaveChangesAsync();
                await BroadcastPaymentUpdatedAsync(order, "PaymentPending");
            }

            return new PaymentInitiateResponseDto
            {
                BillId = bill.BillId,
                MerchantId = _merchantId,
                OrderId = bill.OrderId,
                Amount = bill.Amount,
                Timestamp = bill.Timestamp,
                Signature = bill.Signature,
                VietQrUrl = bill.VietQrUrl,
                BankId = bill.BankId,
                BankAccount = bill.BankAccount,
                AccountName = bill.AccountName
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

            await SubmitTransferToGatewayAsync(order);

            var sellerIds = await _db.OrderItems
                .Where(oi => oi.OrderId == orderId)
                .Select(oi => oi.SellerId)
                .Distinct()
                .ToListAsync();

            foreach (var sellerId in sellerIds)
                await _notif.CreateNotificationAsync(sellerId,
                    $"Đơn #{order.OrderNumber}: người mua đã chuyển khoản, chờ ngân hàng xác nhận.");

            await BroadcastPaymentUpdatedAsync(order, "PaymentPending");

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

        private async Task<bool> ApplyBankResultAsync(string orderNumber, decimal amount, string transactionId, string status)
        {
            var order = await _db.Orders
                .Include(o => o.Payment)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);

            if (order?.Payment == null) return false;

            if (!OrderBusinessRules.RequiresBankConfirmation(order.Payment))
                return false;

            if (order.TotalAmount != amount)
                return false;

            if (order.Payment.Status == PaymentStatus.Completed)
                return true;

            status = status.ToUpperInvariant();

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
            else
            {
                return false;
            }

            await _db.SaveChangesAsync();
            await BroadcastPaymentUpdatedAsync(order, status == "FAILED" ? "PaymentFailed" : "PaymentCompleted");
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

        private async Task<GatewayBillResponse> CreateGatewayBillAsync(string orderNumber, decimal amount)
        {
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var signature = GenerateSignature(_merchantId, orderNumber, amount, timestamp);

            var request = new GatewayCreateBillRequest
            {
                MerchantId = _merchantId,
                OrderId = orderNumber,
                Amount = amount,
                Timestamp = timestamp,
                Signature = signature
            };

            var response = await PostGatewayAsync<GatewayCreateBillRequest, GatewayBillResponse>(
                "/api/gateway/create-bill",
                request);

            return response with
            {
                Signature = signature,
                Timestamp = timestamp
            };
        }

        private async Task SubmitTransferToGatewayAsync(Order order)
        {
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var request = new GatewayTransferRequest
            {
                MerchantId = _merchantId,
                OrderId = order.OrderNumber,
                Amount = order.TotalAmount,
                Timestamp = timestamp,
                Signature = GenerateSignature(_merchantId, order.OrderNumber, order.TotalAmount, timestamp)
            };

            await PostGatewayAsync<GatewayTransferRequest, GatewayTransferAcceptedResponse>(
                "/api/gateway/process-transfer",
                request);
        }

        private async Task<TResponse> PostGatewayAsync<TRequest, TResponse>(string path, TRequest request)
        {
            var client = _httpClientFactory.CreateClient();
            var json = JsonSerializer.Serialize(request);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_bankGatewayUrl}{path}")
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            if (request is GatewayCreateBillRequest createBillRequest)
            {
                httpRequest.Headers.Add("X-Signature", createBillRequest.Signature);
            }
            else if (request is GatewayTransferRequest transferRequest)
            {
                httpRequest.Headers.Add("X-Signature", transferRequest.Signature);
            }

            using var response = await client.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"Bank gateway rejected request ({(int)response.StatusCode}): {responseBody}");
            }

            var result = JsonSerializer.Deserialize<TResponse>(
                responseBody,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return result ?? throw new InvalidOperationException("Bank gateway returned an empty response.");
        }

        private async Task<Order> LoadOrderWithPaymentAsync(int orderId) =>
            await _db.Orders
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

        private async Task BroadcastPaymentUpdatedAsync(Order order, string eventName)
        {
            var shipment = await _db.Shipments.FirstOrDefaultAsync(s => s.OrderId == order.Id);
            var groups = new List<string> { DeliveryHub.UserGroup(order.BuyerId) };

            groups.AddRange(await _db.OrderItems
                .Where(oi => oi.OrderId == order.Id)
                .Select(oi => oi.SellerId)
                .Distinct()
                .Select(sellerId => DeliveryHub.UserGroup(sellerId))
                .ToListAsync());

            if (shipment?.ShipperId.HasValue == true)
            {
                groups.Add(DeliveryHub.UserGroup(shipment.ShipperId.Value));
            }

            var payload = new
            {
                shipmentId = shipment?.Id,
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                shipmentStatus = shipment?.Status.ToString(),
                orderStatus = order.Status.ToString(),
                paymentStatus = order.Payment?.Status.ToString(),
                buyerId = order.BuyerId,
                shipperId = shipment?.ShipperId
            };

            var targetGroups = groups.Distinct().ToArray();
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync(eventName, payload);
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync("PaymentUpdated", payload);
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync("OrderUpdated", payload);
        }

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
            if (callback.MerchantId != _merchantId)
            {
                return false;
            }

            var callbackTime = DateTimeOffset.FromUnixTimeSeconds(callback.Timestamp);
            if (DateTimeOffset.UtcNow - callbackTime > TimeSpan.FromMinutes(15)
                || callbackTime - DateTimeOffset.UtcNow > TimeSpan.FromMinutes(5))
            {
                return false;
            }

            var expected = GenerateSignature(
                callback.MerchantId,
                callback.OrderId,
                callback.Amount,
                callback.Timestamp);

            var expectedBytes = Encoding.UTF8.GetBytes(expected);
            var actualBytes = Encoding.UTF8.GetBytes(signature.ToLowerInvariant());

            return expectedBytes.Length == actualBytes.Length
                && CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
        }

        private string GenerateSignature(string merchantId, string orderId, decimal amount, long timestamp)
        {
            var rawData = $"{merchantId}|{orderId}|{(int)amount}|{timestamp}";
            return GenerateHmacHash(rawData, _secretKey);
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

    internal sealed class GatewayCreateBillRequest
    {
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public long Timestamp { get; set; }
        public string Signature { get; set; } = string.Empty;
    }

    internal sealed class GatewayTransferRequest
    {
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public long Timestamp { get; set; }
        public string Signature { get; set; } = string.Empty;
    }

    internal sealed record GatewayBillResponse
    {
        public string BillId { get; init; } = string.Empty;
        public string MerchantId { get; init; } = string.Empty;
        public string OrderId { get; init; } = string.Empty;
        public decimal Amount { get; init; }
        public long Timestamp { get; init; }
        public string Signature { get; init; } = string.Empty;
        public string VietQrUrl { get; init; } = string.Empty;
        public string BankId { get; init; } = string.Empty;
        public string BankAccount { get; init; } = string.Empty;
        public string AccountName { get; init; } = string.Empty;
    }

    internal sealed class GatewayTransferAcceptedResponse
    {
        public string TransactionId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
