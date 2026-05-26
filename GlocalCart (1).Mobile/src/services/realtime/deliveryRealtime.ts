import * as signalR from "@microsoft/signalr";
import { BASE_URL } from "../api/config";
import { getSecureItem } from "../../utils/secureStore";

export type DeliveryRealtimeEvent =
  | "OrderCreated"
  | "OrderUpdated"
  | "OrderStatusUpdated"
  | "OrderCanceled"
  | "OrderRejected"
  | "OrderShipmentCreated"
  | "PaymentUpdated"
  | "PaymentCompleted"
  | "PaymentFailed"
  | "ShipmentAvailable"
  | "ShipmentAccepted"
  | "ShipmentPickedUp"
  | "ShipmentArrived"
  | "ShipmentDelivered"
  | "ShipmentDeliveryFailed"
  | "ShipmentPaymentMethodSelected"
  | "ShipmentPaymentUpdated"
  | "ShipmentReceiptConfirmed"
  | "ShipmentUpdated";

export interface DeliveryRealtimePayload {
  shipmentId?: number;
  orderId?: number;
  orderNumber?: string;
  shipmentStatus?: string;
  orderStatus?: string;
  paymentStatus?: string;
  buyerId?: number;
  shipperId?: number;
}

const HUB_URL = `${BASE_URL}/hubs/delivery`;

let connection: signalR.HubConnection | null = null;
let disabledUntil = 0;
const handlers = new Map<
  DeliveryRealtimeEvent,
  Set<(payload: DeliveryRealtimePayload) => void>
>();

const EVENTS: DeliveryRealtimeEvent[] = [
  "OrderCreated",
  "OrderUpdated",
  "OrderStatusUpdated",
  "OrderCanceled",
  "OrderRejected",
  "OrderShipmentCreated",
  "PaymentUpdated",
  "PaymentCompleted",
  "PaymentFailed",
  "ShipmentAvailable",
  "ShipmentAccepted",
  "ShipmentPickedUp",
  "ShipmentArrived",
  "ShipmentDelivered",
  "ShipmentDeliveryFailed",
  "ShipmentPaymentMethodSelected",
  "ShipmentPaymentUpdated",
  "ShipmentReceiptConfirmed",
  "ShipmentUpdated",
];

function getConnection() {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: async () => (await getSecureItem("auth_token")) || "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.None)
    .build();

  // Handle connection lifecycle events
  connection.onreconnecting((error) => {
    console.log("[SignalR] Reconnecting...", error?.message);
  });

  connection.onreconnected((connectionId) => {
    console.log("[SignalR] Reconnected with ID:", connectionId);
  });

  connection.onclose((error) => {
    console.log("[SignalR] Connection closed", error?.message);
    connection = null;
  });

  EVENTS.forEach((eventName) => {
    connection!.on(eventName, (payload: DeliveryRealtimePayload) => {
      handlers.get(eventName)?.forEach((handler) => handler(payload || {}));
    });
  });

  return connection;
}

export async function startDeliveryRealtime() {
  if (Date.now() < disabledUntil) return;

  const hub = getConnection();
  if (
    hub.state === signalR.HubConnectionState.Connected ||
    hub.state === signalR.HubConnectionState.Connecting
  ) {
    return;
  }

  try {
    await hub.start();
  } catch (error) {
    disabledUntil = Date.now() + 60_000;
    connection = null;
    console.log("[SignalR] Realtime unavailable, using polling fallback.", error instanceof Error ? error.message : error);
  }
}

export async function stopDeliveryRealtime() {
  if (!connection) return;
  try {
    await connection.stop();
  } catch (error) {
    console.log("[SignalR] Failed to stop connection:", error);
  }
}

export function onDeliveryRealtime(
  eventName: DeliveryRealtimeEvent,
  handler: (payload: DeliveryRealtimePayload) => void,
) {
  const eventHandlers =
    handlers.get(eventName) ||
    new Set<(payload: DeliveryRealtimePayload) => void>();
  eventHandlers.add(handler);
  handlers.set(eventName, eventHandlers);

  return () => {
    eventHandlers.delete(handler);
  };
}
