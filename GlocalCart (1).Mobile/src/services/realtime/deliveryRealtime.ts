import * as signalR from "@microsoft/signalr";
import { BASE_URL } from "../api/config";
import { getSecureItem } from "../../utils/secureStore";

export type DeliveryRealtimeEvent =
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
  shipperId?: number;
}

const HUB_URL = `${BASE_URL}/hubs/delivery`;

let connection: signalR.HubConnection | null = null;
const handlers = new Map<
  DeliveryRealtimeEvent,
  Set<(payload: DeliveryRealtimePayload) => void>
>();

const EVENTS: DeliveryRealtimeEvent[] = [
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

  console.log(`[SignalR] Initializing connection to ${HUB_URL}`);

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: async () => (await getSecureItem("auth_token")) || "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  // Handle connection lifecycle events
  connection.onreconnecting((error) => {
    console.warn("[SignalR] Reconnecting...", error?.message);
  });

  connection.onreconnected((connectionId) => {
    console.log("[SignalR] Reconnected with ID:", connectionId);
  });

  connection.onclose((error) => {
    console.warn("[SignalR] Connection closed", error?.message);
    connection = null;
  });

  EVENTS.forEach((eventName) => {
    connection!.on(eventName, (payload: DeliveryRealtimePayload) => {
      console.log(`[SignalR] Event received: ${eventName}`, payload);
      handlers.get(eventName)?.forEach((handler) => handler(payload || {}));
    });
  });

  return connection;
}

export async function startDeliveryRealtime() {
  const hub = getConnection();
  if (
    hub.state === signalR.HubConnectionState.Connected ||
    hub.state === signalR.HubConnectionState.Connecting
  ) {
    console.log("[SignalR] Already connected or connecting");
    return;
  }

  try {
    console.log("[SignalR] Starting connection...");
    await hub.start();
    console.log("[SignalR] Connection started successfully");
  } catch (error) {
    console.error("[SignalR] Connection failed:", error);
    connection = null; // Reset connection on failure to allow retry

    // Log detailed error information
    if (error instanceof Error) {
      console.error("[SignalR] Error message:", error.message);
      console.error("[SignalR] Error stack:", error.stack);
    }
  }
}

export async function stopDeliveryRealtime() {
  if (!connection) return;
  try {
    console.log("[SignalR] Stopping connection...");
    await connection.stop();
    console.log("[SignalR] Connection stopped");
  } catch (error) {
    console.error("[SignalR] Failed to stop connection:", error);
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
