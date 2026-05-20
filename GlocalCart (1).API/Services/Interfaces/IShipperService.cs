using GlocalCart.API.DTOs.Shipper;
using GlocalCart.API.Helpers;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IShipperService
    {
        Task<PagedResult<ShipperShipmentDto>> GetAvailableShipmentsAsync(int page, int pageSize);
        Task<PagedResult<ShipperShipmentDto>> GetMyShipmentsAsync(int shipperId, int page, int pageSize);
        Task<PagedResult<ShipperShipmentDto>> GetCompletedShipmentsAsync(int shipperId, int page, int pageSize);
        Task<ShipperShipmentDto> GetShipmentDetailAsync(int shipperId, int shipmentId);
        Task<ShipperShipmentDto> AcceptShipmentAsync(int shipperId, int shipmentId, string? note);
        Task<ShipperShipmentDto> ConfirmPickupAsync(int shipperId, int shipmentId, string? note);
        Task<ShipperShipmentDto> ConfirmArrivalAsync(int shipperId, int shipmentId, string? note);
        Task<ShipperShipmentDto> ConfirmCashReceivedAsync(int shipperId, int shipmentId, string? note);
        Task<ShipperShipmentDto> ConfirmTransferReceivedAsync(int shipperId, int shipmentId, string? note);
        Task<bool> RequestPaymentAsync(int shipperId, int shipmentId);
        Task<ShipperShipmentDto> ConfirmDeliveredAsync(int shipperId, int shipmentId, string? note);
    }
}
