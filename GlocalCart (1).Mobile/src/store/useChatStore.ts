import { create } from 'zustand';
import apiClient from '../services/api/apiClient';

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  isMine: boolean;
  text?: string | null;
  imageUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: number;
  buyerId: number;
  sellerId: number;
  otherUserId: number;
  otherUserName: string;
  shopName: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  totalUnreadCount: number;
  isLoading: boolean;

  fetchConversations: () => Promise<void>;
  startConversation: (sellerId: number, productId?: number) => Promise<Conversation>;
  getMessages: (conversationId: number) => Promise<ChatMessage[]>;
  sendMessage: (conversationId: number, text?: string, imageUri?: string) => Promise<ChatMessage>;
  markAsRead: (conversationId: number) => Promise<void>;
  upsertConversation: (conversation: Conversation) => void;
}

const updateUnreadTotal = (conversations: Conversation[]) =>
  conversations.reduce((total, c) => total + (c.unreadCount || 0), 0);

const sortConversations = (conversations: Conversation[]) =>
  [...conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const isNotFound = (error: any) => error?.status === 404;

const imageFileFromUri = (uri: string) => {
  const cleanUri = uri.split('?')[0];
  const ext = cleanUri.split('.').pop()?.toLowerCase() || 'jpg';
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  return {
    uri,
    name: `chat-${Date.now()}.${ext}`,
    type,
  } as any;
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  totalUnreadCount: 0,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const conversations = (await apiClient.get('/chat/conversations')) as Conversation[];
      set({
        conversations,
        totalUnreadCount: updateUnreadTotal(conversations),
      });
    } catch (error: any) {
      if (isNotFound(error)) {
        set({ conversations: [], totalUnreadCount: 0 });
        return;
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  startConversation: async (sellerId: number, productId?: number) => {
    const conversation = (await apiClient.post('/chat/conversations', {
      sellerId,
      productId,
    })) as Conversation;

    const current = get().conversations;
    const exists = current.some(c => c.id === conversation.id);
    const conversations = exists
      ? current.map(c => c.id === conversation.id ? conversation : c)
      : [conversation, ...current];

    const sorted = sortConversations(conversations);
    set({ conversations: sorted, totalUnreadCount: updateUnreadTotal(sorted) });
    return conversation;
  },

  getMessages: async (conversationId: number) => {
    return (await apiClient.get(`/chat/conversations/${conversationId}/messages`)) as ChatMessage[];
  },

  sendMessage: async (conversationId: number, text?: string, imageUri?: string) => {
    const formData = new FormData();
    if (text?.trim()) formData.append('text', text.trim());
    if (imageUri) formData.append('image', imageFileFromUri(imageUri));

    const message = (await apiClient.post(
      `/chat/conversations/${conversationId}/messages`,
      formData
    )) as ChatMessage;

    await get().fetchConversations();
    return message;
  },

  markAsRead: async (conversationId: number) => {
    await apiClient.patch(`/chat/conversations/${conversationId}/read`);
    const conversations = get().conversations.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    set({ conversations, totalUnreadCount: updateUnreadTotal(conversations) });
  },

  upsertConversation: (conversation: Conversation) => {
    const current = get().conversations;
    const exists = current.some(c => c.id === conversation.id);
    const conversations = exists
      ? current.map(c => c.id === conversation.id ? conversation : c)
      : [conversation, ...current];
    const sorted = sortConversations(conversations);
    set({ conversations: sorted, totalUnreadCount: updateUnreadTotal(sorted) });
  },
}));
