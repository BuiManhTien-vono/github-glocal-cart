import { create } from 'zustand';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  shopName: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
  messages: ChatMessage[];
}

interface ChatState {
  conversations: Conversation[];
  totalUnreadCount: number;
  isLoading: boolean;
  
  fetchConversations: () => Promise<void>;
  markAsRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [
    {
      id: '1',
      shopName: 'Glocal Official Store',
      lastMessage: 'Chào bạn, đơn hàng của bạn đã được gửi đi rồi ạ!',
      unreadCount: 0,
      updatedAt: '2026-05-12T10:00:00Z',
      messages: []
    },
    {
      id: '2',
      shopName: 'Thời Trang Nam GenZ',
      lastMessage: 'Voucher 50k sắp hết hạn, bạn dùng ngay nhé.',
      unreadCount: 4,
      updatedAt: '2026-05-12T09:30:00Z',
      messages: []
    },
    {
      id: '3',
      shopName: 'Điện Máy Xanh',
      lastMessage: 'Sản phẩm bạn quan tâm đang có chương trình trả góp 0%.',
      unreadCount: 3,
      updatedAt: '2026-05-11T15:20:00Z',
      messages: []
    },
    {
      id: '4',
      shopName: 'Mèo Cưng Shop',
      lastMessage: 'Cảm ơn bạn đã mua hàng, hãy đánh giá 5 sao nhé!',
      unreadCount: 1,
      updatedAt: '2026-05-10T08:15:00Z',
      messages: []
    }
  ],
  totalUnreadCount: 8,
  isLoading: false,

  fetchConversations: async () => {
    // Mock fetching
    set({ isLoading: true });
    // In real app: fetch from API
    set({ isLoading: false });
  },

  markAsRead: (conversationId: string) => {
    set((state) => {
      const updatedConversations = state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      const newTotal = updatedConversations.reduce((acc, c) => acc + c.unreadCount, 0);
      return { conversations: updatedConversations, totalUnreadCount: newTotal };
    });
  }
}));
