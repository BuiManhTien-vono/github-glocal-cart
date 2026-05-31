import { create } from 'zustand';
import apiClient from '../services/api/apiClient';

export type ChatId = number | string;

export interface ChatMessage {
  id: ChatId;
  conversationId?: ChatId;
  senderId: ChatId;
  isMine?: boolean;
  text?: string | null;
  imageUrl?: string | null;
  imageUri?: string | null;
  isRead?: boolean;
  createdAt: string;
}

export interface Conversation {
  id: ChatId;
  buyerId?: number;
  sellerId?: number;
  otherUserId?: number;
  otherUserName?: string;
  shopName?: string;
  peerId?: string;
  peerName: string;
  avatarUrl?: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
  messages?: ChatMessage[];
}

interface AddMessagePayload {
  id: ChatId;
  peerId?: string;
  peerName: string;
  avatarUrl?: string;
  message: ChatMessage;
}

interface ChatState {
  conversations: Conversation[];
  totalUnreadCount: number;
  isLoading: boolean;

  fetchConversations: () => Promise<void>;
  startConversation: (sellerId: number, productId?: number) => Promise<Conversation>;
  getMessages: (conversationId: ChatId) => Promise<ChatMessage[]>;
  sendMessage: (conversationId: ChatId, text?: string, imageUri?: string) => Promise<ChatMessage>;
  markAsRead: (conversationId: ChatId) => Promise<void>;
  upsertConversation: (conversation: Conversation) => void;

  addMessage: (payload: AddMessagePayload) => Promise<void>;
  getConversation: (conversationId: ChatId) => Conversation | undefined;
}

const isNotFound = (error: any) => error?.status === 404;
const isNumericId = (id: ChatId) => Number.isFinite(Number(id));

const totalUnread = (conversations: Conversation[]) =>
  conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0);

const sortConversations = (conversations: Conversation[]) =>
  [...conversations].sort((a, b) => {
    const left = new Date(a.updatedAt || 0).getTime();
    const right = new Date(b.updatedAt || 0).getTime();
    return right - left;
  });

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

const normalizeMessage = (item: any): ChatMessage => ({
  id: item?.id ?? `${Date.now()}`,
  conversationId: item?.conversationId,
  senderId: item?.senderId ?? '',
  isMine: Boolean(item?.isMine),
  text: item?.text ?? null,
  imageUrl: item?.imageUrl ?? null,
  imageUri: item?.imageUri ?? item?.imageUrl ?? null,
  isRead: Boolean(item?.isRead),
  createdAt: item?.createdAt || new Date().toISOString(),
});

const normalizeConversation = (item: any): Conversation => {
  const id = item?.id ?? item?.conversationId;
  const peerId = item?.peerId ?? item?.otherUserId ?? item?.sellerId ?? item?.buyerId;
  const peerName =
    item?.peerName ||
    item?.otherUserName ||
    item?.shopName ||
    item?.sellerName ||
    item?.buyerName ||
    'Nguoi dung';
  const messages = Array.isArray(item?.messages) ? item.messages.map(normalizeMessage) : undefined;

  return {
    id,
    buyerId: item?.buyerId,
    sellerId: item?.sellerId,
    otherUserId: item?.otherUserId,
    otherUserName: item?.otherUserName,
    shopName: item?.shopName || peerName,
    peerId: peerId != null ? String(peerId) : undefined,
    peerName,
    avatarUrl: item?.avatarUrl,
    lastMessage: item?.lastMessage || messages?.at(-1)?.text || '',
    unreadCount: Number(item?.unreadCount || 0),
    updatedAt: item?.updatedAt || messages?.at(-1)?.createdAt || new Date().toISOString(),
    messages,
  };
};

const upsertConversationInList = (list: Conversation[], conversation: Conversation) => {
  const normalized = normalizeConversation(conversation);
  const withoutCurrent = list.filter(item => String(item.id) !== String(normalized.id));
  return sortConversations([normalized, ...withoutCurrent]);
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  totalUnreadCount: 0,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/chat/conversations');
      const conversations = sortConversations(
        (Array.isArray(response) ? response : []).map(normalizeConversation)
      );
      set({ conversations, totalUnreadCount: totalUnread(conversations) });
    } catch (error: any) {
      if (isNotFound(error)) {
        set({ conversations: [], totalUnreadCount: 0 });
        return;
      }
      console.warn('fetchConversations error:', error);
      set({ conversations: [], totalUnreadCount: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  startConversation: async (sellerId: number, productId?: number) => {
    const conversation = normalizeConversation(await apiClient.post('/chat/conversations', {
      sellerId,
      productId,
    }));

    const conversations = upsertConversationInList(get().conversations, conversation);
    set({ conversations, totalUnreadCount: totalUnread(conversations) });
    return conversation;
  },

  getMessages: async (conversationId: ChatId) => {
    if (!isNumericId(conversationId)) {
      return get().getConversation(conversationId)?.messages || [];
    }

    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
    return (Array.isArray(response) ? response : []).map(normalizeMessage);
  },

  sendMessage: async (conversationId: ChatId, text?: string, imageUri?: string) => {
    if (!isNumericId(conversationId)) {
      const message = normalizeMessage({
        id: Date.now(),
        conversationId,
        senderId: 'me',
        isMine: true,
        text: text?.trim() || null,
        imageUri,
        createdAt: new Date().toISOString(),
      });

      await get().addMessage({
        id: conversationId,
        peerName: get().getConversation(conversationId)?.peerName || 'Nguoi dung',
        message,
      });
      return message;
    }

    const formData = new FormData();
    if (text?.trim()) formData.append('text', text.trim());
    if (imageUri) formData.append('image', imageFileFromUri(imageUri));

    const message = normalizeMessage(await apiClient.post(
      `/chat/conversations/${conversationId}/messages`,
      formData
    ));

    await get().fetchConversations();
    return message;
  },

  markAsRead: async (conversationId: ChatId) => {
    if (isNumericId(conversationId)) {
      await apiClient.patch(`/chat/conversations/${conversationId}/read`).catch(error => {
        if (!isNotFound(error)) throw error;
      });
    }

    const conversations = get().conversations.map(conversation =>
      String(conversation.id) === String(conversationId)
        ? { ...conversation, unreadCount: 0 }
        : conversation
    );
    set({ conversations, totalUnreadCount: totalUnread(conversations) });
  },

  upsertConversation: (conversation: Conversation) => {
    const conversations = upsertConversationInList(get().conversations, conversation);
    set({ conversations, totalUnreadCount: totalUnread(conversations) });
  },

  addMessage: async ({ id, peerId, peerName, avatarUrl, message }: AddMessagePayload) => {
    const current = get().conversations;
    const existing = current.find(conversation => String(conversation.id) === String(id));
    const normalizedMessage = normalizeMessage({ ...message, conversationId: id });
    const messages = [...(existing?.messages || []), normalizedMessage];
    const lastMessage = normalizedMessage.text || (normalizedMessage.imageUri ? '[Hinh anh]' : '');

    const conversation: Conversation = {
      id,
      peerId: peerId || existing?.peerId,
      peerName: peerName || existing?.peerName || 'Nguoi dung',
      avatarUrl: avatarUrl || existing?.avatarUrl,
      lastMessage,
      unreadCount: existing?.unreadCount || 0,
      updatedAt: normalizedMessage.createdAt,
      messages,
    };

    const conversations = upsertConversationInList(current, conversation);
    set({ conversations, totalUnreadCount: totalUnread(conversations) });
  },

  getConversation: (conversationId: ChatId) =>
    get().conversations.find(conversation => String(conversation.id) === String(conversationId)),
}));
