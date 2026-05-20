using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using GlocalCart.API.Enums;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng Orders - Đơn hàng (Order trong UML)
    /// Quản lý vòng đời: Pending -> Shipped -> Complete hoặc Canceled
    /// </summary>
    public class Order
    {
        public int Id { get; set; }

        /// <summary>
        /// Mã đơn hàng duy nhất (theo UML: orderNumber: string)
        /// </summary>
        [Required, MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        /// <summary>
        /// ID người mua
        /// </summary>
        public int BuyerId { get; set; }

        /// <summary>
        /// ID địa chỉ giao hàng
        /// </summary>
        public int ShippingAddressId { get; set; }

        /// <summary>
        /// Trạng thái đơn hàng (theo UML: status: OrderStatus)
        /// </summary>
        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        /// <summary>
        /// Ngày tạo đơn (theo UML: orderDate: date)
        /// </summary>
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Tổng tiền đơn hàng
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        /// <summary>
        /// Phí vận chuyển
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingFee { get; set; } = 30000;

        [MaxLength(500)]
        public string? Note { get; set; }

        // Navigation
        public User Buyer { get; set; } = null!;
        public UserAddress ShippingAddress { get; set; } = null!;
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<OrderLog> OrderLogs { get; set; } = new List<OrderLog>();
        public Payment? Payment { get; set; }
        public Shipment? Shipment { get; set; }
    }
}
