import * as signalR from "@microsoft/signalr";
import { BASE_URL } from "../api/config";
import { getSecureItem } from "../../utils/secureStore";
import { ChatMessage, Conversation } from "../../store/useChatStore";

export type ChatRealtimeEvent = "ReceiveMessage" | "ConversationUpdated";

type ChatRealtimePayloadMap = {
  ReceiveMessage: ChatMessage;
  ConversationUpdated: Conversation;
};

const HUB_URL = `${BASE_URL}/hubs/chat`;

let connection: signalR.HubConnection | null = null;
let disabledUntil = 0;
const handlers = new Map<ChatRealtimeEvent, Set<(payload: any) => void>>();

const EVENTS: ChatRealtimeEvent[] = ["ReceiveMessage", "ConversationUpdated"];

function getConnection() {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: async () => (await getSecureItem("auth_token")) || "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.None)
    .build();

  connection.onclose((error) => {
    console.log("[ChatSignalR] Connection closed", error?.message);
    connection = null;
  });

  EVENTS.forEach((eventName) => {
    connection!.on(eventName, (payload: any) => {
      handlers.get(eventName)?.forEach((handler) => handler(payload));
    });
  });

  return connection;
}

export async function startChatRealtime() {
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
    console.log("[ChatSignalR] Realtime unavailable, using API refresh.", error instanceof Error ? error.message : error);
  }
}

export async function stopChatRealtime() {
  if (!connection) return;
  try {
    await connection.stop();
  } catch (error) {
    console.log("[ChatSignalR] Failed to stop connection:", error);
  }
}

export function onChatRealtime<T extends ChatRealtimeEvent>(
  eventName: T,
  handler: (payload: ChatRealtimePayloadMap[T]) => void,
) {
  const eventHandlers = handlers.get(eventName) || new Set<(payload: any) => void>();
  eventHandlers.add(handler as any);
  handlers.set(eventName, eventHandlers);

  return () => {
    eventHandlers.delete(handler as any);
  };
}
