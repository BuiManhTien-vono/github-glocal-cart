using GlocalCart.API.DTOs.Orders;
using GlocalCart.API.Helpers;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IOrderService
    {
        // Buyer
        Task<OrderResponseDto> CreateOrderAsync(int buyerId, CreateOrderDto dto);
        Task<PagedResult<OrderResponseDto>> GetBuyerOrdersAsync(int buyerId, int page, int pageSize);
        Task<OrderResponseDto> GetOrderByIdAsync(int userId, int orderId);
        Task<bool> CancelOrderAsync(int buyerId, int orderId);
        Task<List<OrderLogDto>> GetOrderLogsAsync(int userId, int orderId);

        // Seller
        Task<PagedResult<OrderResponseDto>> GetSellerOrdersAsync(int sellerId, int page, int pageSize);
        Task<bool> UpdateOrderStatusAsync(int sellerId, int orderId, UpdateOrderStatusDto dto);
        Task<bool> RejectOrderAsync(int sellerId, int orderId, RejectOrderDto dto);

        // Shipment
        Task<ShipmentInfoDto> CreateShipmentAsync(int sellerId, int orderId, CreateShipmentDto dto);
        Task<ShipmentInfoDto> GetShipmentAsync(int userId, int orderId);
        Task<bool> UpdateShipmentStatusAsync(int sellerId, int shipmentId, UpdateShipmentStatusDto dto);
        Task<List<ShipmentLogDto>> GetShipmentLogsAsync(int userId, int shipmentId);
        Task<bool> SelectPaymentMethodAsync(int buyerId, int orderId, SelectPaymentMethodDto dto);
        Task<bool> ConfirmTransferAsync(int buyerId, int orderId);
        Task<ConfirmReceiptResultDto> ConfirmReceiptAsync(int buyerId, int orderId);
    }
}
