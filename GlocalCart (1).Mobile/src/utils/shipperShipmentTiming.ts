export type TimedShipment = {
  shipmentStatus?: string;
  canConfirmPickup?: boolean;
  canConfirmArrival?: boolean;
  pickupCountdownSeconds?: number;
  arrivalCountdownSeconds?: number;
};

const nextCountdown = (value?: number) =>
  typeof value === "number" ? Math.max(0, value - 1) : undefined;

export const tickShipmentCountdown = <T extends TimedShipment>(shipment: T): T => {
  if (shipment.shipmentStatus === "Accepted") {
    const pickupCountdownSeconds = nextCountdown(shipment.pickupCountdownSeconds);
    if (pickupCountdownSeconds == null) return shipment;

    const canConfirmPickup = shipment.canConfirmPickup || pickupCountdownSeconds === 0;
    if (
      pickupCountdownSeconds === shipment.pickupCountdownSeconds &&
      canConfirmPickup === shipment.canConfirmPickup
    ) {
      return shipment;
    }

    return {
      ...shipment,
      pickupCountdownSeconds,
      canConfirmPickup,
    };
  }

  if (shipment.shipmentStatus === "Shipped") {
    const arrivalCountdownSeconds = nextCountdown(shipment.arrivalCountdownSeconds);
    if (arrivalCountdownSeconds == null) return shipment;

    const canConfirmArrival = shipment.canConfirmArrival || arrivalCountdownSeconds === 0;
    if (
      arrivalCountdownSeconds === shipment.arrivalCountdownSeconds &&
      canConfirmArrival === shipment.canConfirmArrival
    ) {
      return shipment;
    }

    return {
      ...shipment,
      arrivalCountdownSeconds,
      canConfirmArrival,
    };
  }

  return shipment;
};

export const hasActiveShipmentCountdown = (shipment: TimedShipment) =>
  (shipment.shipmentStatus === "Accepted" &&
    typeof shipment.pickupCountdownSeconds === "number" &&
    shipment.pickupCountdownSeconds > 0) ||
  (shipment.shipmentStatus === "Shipped" &&
    typeof shipment.arrivalCountdownSeconds === "number" &&
    shipment.arrivalCountdownSeconds > 0);
