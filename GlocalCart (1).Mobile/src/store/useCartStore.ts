import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/api/apiClient';

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  priceSnapshot: number;
  currentPrice: number;
  quantity: number;
  availableStock: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  isLoading: boolean;
  
  fetchCart: () => Promise<void>;
  addToCart: (product: any, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
}

const GUEST_CART_KEY = '@cart_guest';

const calculateTotals = (items: CartItem[]) => {
  const totalAmount = items.reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return { totalAmount, totalItems };
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,
  totalItems: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const response = await apiClient.get('/cart');
        const cartData = response as any;
        set({ 
          items: cartData.items || [], 
          totalAmount: cartData.totalAmount || 0, 
          totalItems: cartData.totalItems || 0 
        });
      } else {
        const guestCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
        if (guestCartStr) {
          const items: CartItem[] = JSON.parse(guestCartStr);
          const totals = calculateTotals(items);
          set({ items, ...totals });
        }
      }
    } catch (error) {
      console.log('fetchCart error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (product: any, quantity: number) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await apiClient.post('/cart', { productId: product.id, quantity });
        await get().fetchCart();
      } else {
        const currentItems = [...get().items];
        const existingItemIndex = currentItems.findIndex((i: CartItem) => i.productId === product.id);

        if (existingItemIndex >= 0) {
          currentItems[existingItemIndex].quantity += quantity;
          currentItems[existingItemIndex].subtotal = currentItems[existingItemIndex].quantity * currentItems[existingItemIndex].priceSnapshot;
        } else {
          currentItems.push({
            id: product.id,
            productId: product.id,
            productName: product.name,
            productImage: product.images && product.images.length > 0 ? product.images[0].imageUrl : undefined,
            priceSnapshot: product.price,
            currentPrice: product.price,
            quantity: quantity,
            availableStock: product.stock,
            subtotal: product.price * quantity,
          });
        }

        const totals = calculateTotals(currentItems);
        set({ items: currentItems, ...totals });
        await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(currentItems));
      }
    } catch (error) {
      console.log('addToCart error:', error);
      throw error;
    }
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await apiClient.put(`/cart/${itemId}`, { quantity });
        await get().fetchCart();
      } else {
        const currentItems = [...get().items];
        const itemIndex = currentItems.findIndex((i: CartItem) => i.id === itemId);
        if (itemIndex >= 0) {
          currentItems[itemIndex].quantity = quantity;
          currentItems[itemIndex].subtotal = quantity * currentItems[itemIndex].priceSnapshot;
          const totals = calculateTotals(currentItems);
          set({ items: currentItems, ...totals });
          await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(currentItems));
        }
      }
    } catch (error) {
      console.log('updateQuantity error:', error);
    }
  },

  removeFromCart: async (itemId: number) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await apiClient.delete(`/cart/${itemId}`);
        await get().fetchCart();
      } else {
        const currentItems = get().items.filter((i: CartItem) => i.id !== itemId);
        const totals = calculateTotals(currentItems);
        set({ items: currentItems, ...totals });
        await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(currentItems));
      }
    } catch (error) {
      console.log('removeFromCart error:', error);
    }
  },

  clearCart: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await apiClient.delete('/cart/clear');
        await get().fetchCart();
      } else {
        set({ items: [], totalAmount: 0, totalItems: 0 });
        await AsyncStorage.removeItem(GUEST_CART_KEY);
      }
    } catch (error) {
      console.log('clearCart error:', error);
    }
  },

  syncCart: async () => {
    try {
      const guestCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (guestCartStr) {
        const guestItems: CartItem[] = JSON.parse(guestCartStr);
        if (guestItems.length > 0) {
          const syncPayload = {
            items: guestItems.map((i: CartItem) => ({
              productId: i.productId,
              quantity: i.quantity
            }))
          };
          await apiClient.post('/cart/sync', syncPayload);
          await AsyncStorage.removeItem(GUEST_CART_KEY);
        }
      }
      await get().fetchCart();
    } catch (error) {
      console.log('syncCart error:', error);
    }
  }
}));
