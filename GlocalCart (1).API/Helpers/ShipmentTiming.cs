namespace GlocalCart.API.Helpers
{
    public static class ShipmentTiming
    {
        public static readonly TimeSpan PickupDelay = TimeSpan.FromSeconds(30);
        public static readonly TimeSpan ArrivalDelay = TimeSpan.FromSeconds(30);

        public static int CountdownSeconds(DateTime? startedAt)
        {
            if (startedAt == null) return 0;
            var remaining = (startedAt.Value + PickupDelay) - DateTime.UtcNow;
            return Math.Max(0, (int)Math.Ceiling(remaining.TotalSeconds));
        }

        public static int ArrivalCountdownSeconds(DateTime? pickedUpAt)
        {
            if (pickedUpAt == null) return 0;
            var remaining = (pickedUpAt.Value + ArrivalDelay) - DateTime.UtcNow;
            return Math.Max(0, (int)Math.Ceiling(remaining.TotalSeconds));
        }

        public static bool CanConfirmPickup(DateTime? acceptedAt) =>
            acceptedAt != null && DateTime.UtcNow >= acceptedAt.Value + PickupDelay;

        public static bool CanConfirmArrival(DateTime? pickedUpAt) =>
            pickedUpAt != null && DateTime.UtcNow >= pickedUpAt.Value + ArrivalDelay;
    }
}
