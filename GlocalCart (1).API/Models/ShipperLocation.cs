using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    public class ShipperLocation
    {
        public int ShipperId { get; set; }

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User Shipper { get; set; } = null!;
    }
}
