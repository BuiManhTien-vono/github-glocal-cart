import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    }, 5000);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  }))
}));

export interface BellNotification {
  id: number;
  type: 'order' | 'promo' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

interface BellState {
  notifications: BellNotification[];
  addNotification: (notif: Omit<BellNotification, 'id' | 'isRead' | 'time'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

export const useBellStore = create<BellState>((set) => ({
  notifications: [
    { id: 1, type: 'order', title: 'Đơn hàng đang giao', message: 'Đơn hàng #GLC-89247 đang được giao đến bạn. Vui lòng chú ý điện thoại.', time: '10 phút trước', isRead: false },
    { id: 2, type: 'promo', title: 'Giảm 50% cho Đồng hồ', message: 'Mã giảm giá ĐỘC QUYỀN đã được thêm vào ví của bạn. Nhanh tay kẻo lỡ!', time: '2 giờ trước', isRead: false },
    { id: 3, type: 'system', title: 'GlocalCart chào bạn mới', message: 'Cảm ơn bạn đã gia nhập hệ sinh thái GlocalCart. Chúc bạn mua sắm vui vẻ!', time: '1 ngày trước', isRead: true }
  ],
  addNotification: (notif) => set((state) => ({
    notifications: [
      { 
        ...notif, 
        id: Date.now(), 
        isRead: false, 
        time: 'Vừa xong' 
      },
      ...state.notifications
    ]
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true }))
  }))
}));

export interface RecentlyViewedProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

interface RecentlyViewedState {
  products: RecentlyViewedProduct[];
  addProduct: (product: RecentlyViewedProduct) => void;
  clearHistory: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      products: [],
      addProduct: (product) => set((state) => {
        // Remove if exists to move it to the front
        const filtered = state.products.filter(p => p.id !== product.id);
        const newProducts = [product, ...filtered].slice(0, 10); // Keep last 10
        return { products: newProducts };
      }),
      clearHistory: () => set({ products: [] })
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
);
