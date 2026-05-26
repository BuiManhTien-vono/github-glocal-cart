export type Coordinate = { latitude: number; longitude: number };

export interface ShipmentDistanceSource {
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  distanceMeters?: number | null;
  distanceKm?: number | null;
}

export const coordinateFromValues = (
  latitude?: number | null,
  longitude?: number | null,
): Coordinate | null => {
  if (latitude == null || longitude == null) return null;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }

  return { latitude: lat, longitude: lng };
};

export const coordinateFromShipment = (
  shipment: ShipmentDistanceSource | null | undefined,
  type: "pickup" | "delivery",
) =>
  coordinateFromValues(
    type === "pickup" ? shipment?.pickupLatitude : shipment?.deliveryLatitude,
    type === "pickup" ? shipment?.pickupLongitude : shipment?.deliveryLongitude,
  );

export const distanceBetweenMeters = (from: Coordinate, to: Coordinate) => {
  const earthRadiusMeters = 6371008.8;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(haversine)));
};

export const shipmentDistanceMeters = (
  shipment: ShipmentDistanceSource | null | undefined,
) => {
  const distanceMeters = Number(shipment?.distanceMeters);
  if (Number.isFinite(distanceMeters) && distanceMeters > 0) {
    return Math.round(distanceMeters);
  }

  const distanceKm = Number(shipment?.distanceKm);
  if (Number.isFinite(distanceKm) && distanceKm > 0) {
    return Math.round(distanceKm * 1000);
  }

  const pickup = coordinateFromShipment(shipment, "pickup");
  const delivery = coordinateFromShipment(shipment, "delivery");
  if (pickup && delivery) {
    return Math.round(distanceBetweenMeters(pickup, delivery));
  }

  return null;
};

export const formatDistanceMeters = (meters?: number | null) => {
  if (!Number.isFinite(Number(meters))) return "--";
  const rounded = Math.max(0, Math.round(Number(meters)));

  if (rounded >= 1000) {
    return `${(rounded / 1000).toFixed(1)} km`;
  }

  return `${rounded.toLocaleString("vi-VN")} m`;
};

export const fetchRoadDistanceMeters = async (
  from: Coordinate,
  to: Coordinate,
  timeoutMs = 2500,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
      `?overview=false`;
    const response = await fetch(url, { signal: controller.signal });
    const result = await response.json();
    const meters = Number(result?.routes?.[0]?.distance);

    return Number.isFinite(meters) ? Math.round(meters) : null;
  } catch (error) {
    console.log("fetch road distance error:", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};
