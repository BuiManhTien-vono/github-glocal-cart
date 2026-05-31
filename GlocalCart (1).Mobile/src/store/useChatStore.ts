import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const CHAT_STORAGE_KEY = '@glocal_chat_conversations';

export interface ChatMessage {
  id: string;
  text?: string;
  imageUri?: string;
  senderId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  peerId?: string;
  peerName: string;
  avatarUrl?: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
  messages: ChatMessage[];
}

interface UpsertConversationPayload {
  id: string;
  peerId?: string;
  peerName: string;
  avatarUrl?: string;
}

interface AddMessagePayload extends UpsertConversationPayload {
  message: ChatMessage;
}

interface ChatState {
  conversations: Conversation[];
  totalUnreadCount: number;
  isLoading: boolean;

  fetchConversations: () => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  addMessage: (payload: AddMessagePayload) => Promise<void>;
  getConversation: (conversationId: string) => Conversation | undefined;
}

const calculateUnread = (conversations: Conversation[]) =>
  conversations.reduce((acc, conversation) => acc + conversation.unreadCount, 0);

const sortConversations = (conversations: Conversation[]) =>
  [...conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const normalizeConversation = (item: any): Conversation | null => {
  const peerName = item?.peerName || item?.userName || item?.sellerName || item?.buyerName || '';
  const messages = Array.isArray(item?.messages) ? item.messages : [];
  if (!item?.id || !peerName || messages.length === 0) return null;

  return {
    id: String(item.id),
    peerId: item.peerId != null ? String(item.peerId) : undefined,
    peerName,
    avatarUrl: item.avatarUrl,
    lastMessage: item.lastMessage || '',
    unreadCount: Number(item.unreadCount || 0),
    updatedAt: item.updatedAt || new Date().toISOString(),
    messages,
  };
};

const persistConversations = async (conversations: Conversation[]) => {
  await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversations));
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  totalUnreadCount: 0,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const raw = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const conversations = sortConversations(
        (Array.isArray(parsed) ? parsed : [])
          .map(normalizeConversation)
          .filter(Boolean) as Conversation[]
      );

      set({
        conversations,
        totalUnreadCount: calculateUnread(conversations),
      });
    } catch (error) {
      console.warn('fetchConversations error:', error);
      set({ conversations: [], totalUnreadCount: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (conversationId: string) => {
    const updatedConversations = get().conversations.map((conversation) =>
      conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
    );

    set({
      conversations: updatedConversations,
      totalUnreadCount: calculateUnread(updatedConversations),
    });
    await persistConversations(updatedConversations);
  },

  addMessage: async ({ id, peerId, peerName, avatarUrl, message }: AddMessagePayload) => {
    const state = get();
    const existing = state.conversations.find((conversation) => conversation.id === id);
    const lastMessage = message.text || (message.imageUri ? '[Hình ảnh]' : '');
    const updatedAt = message.createdAt;

    const updatedConversation: Conversation = existing
      ? {
        ...existing,
        peerId: peerId || existing.peerId,
        peerName: peerName || existing.peerName,
        avatarUrl: avatarUrl || existing.avatarUrl,
        lastMessage,
        updatedAt,
        messages: [...existing.messages, message],
      }
      : {
        id,
        peerId,
        peerName,
        avatarUrl,
        lastMessage,
        unreadCount: 0,
        updatedAt,
        messages: [message],
      };

    const conversations = sortConversations([
      updatedConversation,
      ...state.conversations.filter((conversation) => conversation.id !== id),
    ]);

    set({
      conversations,
      totalUnreadCount: calculateUnread(conversations),
    });
    await persistConversations(conversations);
  },

  getConversation: (conversationId: string) =>
    get().conversations.find((conversation) => conversation.id === conversationId),
}));
