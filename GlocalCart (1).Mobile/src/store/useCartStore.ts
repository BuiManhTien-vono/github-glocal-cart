import { create } from 'zustand';
import apiClient from '../services/api/apiClient';
import { getSecureItem } from '../utils/secureStore';
import { 
  getGuestCartItems, 
  addOrUpdateGuestCartItem, 
  updateGuestCartItemQuantity, 
  removeGuestCartItem, 
  clearGuestCart, 
  DbCartItem 
} from '../services/db/database';

export interface CartItem extends DbCartItem {}

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
      const token = await getSecureItem('auth_token');
      if (token) {
        const response = await apiClient.get('/cart');
        const cartData = response as any;
        set({ 
          items: cartData.items || [], 
          totalAmount: cartData.totalAmount || 0, 
          totalItems: cartData.totalItems || 0 
        });
      } else {
        const items = await getGuestCartItems();
        const totals = calculateTotals(items);
        set({ items, ...totals });
      }
    } catch (error) {
      console.log('fetchCart error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (product: any, quantity: number) => {
    try {
      const token = await getSecureItem('auth_token');
      if (token) {
        await apiClient.post('/cart', { productId: product.id, quantity });
        await get().fetchCart();
      } else {
        const item: DbCartItem = {
          id: product.id,
          productId: product.id,
          productName: product.name,
          productImage: product.images && product.images.length > 0 ? product.images[0].imageUrl : undefined,
          priceSnapshot: product.price,
          currentPrice: product.price,
          quantity: quantity,
          availableStock: product.stock,
          subtotal: product.price * quantity,
        };
        await addOrUpdateGuestCartItem(item);
        
        const updatedItems = await getGuestCartItems();
        const totals = calculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      }
    } catch (error) {
      console.log('addToCart error:', error);
      throw error;
    }
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    try {
      const token = await getSecureItem('auth_token');
      if (token) {
        await apiClient.put(`/cart/${itemId}`, { quantity });
        await get().fetchCart();
      } else {
        await updateGuestCartItemQuantity(itemId, quantity);
        const updatedItems = await getGuestCartItems();
        const totals = calculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      }
    } catch (error) {
      console.log('updateQuantity error:', error);
    }
  },

  removeFromCart: async (itemId: number) => {
    try {
      const token = await getSecureItem('auth_token');
      if (token) {
        await apiClient.delete(`/cart/${itemId}`);
        await get().fetchCart();
      } else {
        await removeGuestCartItem(itemId);
        const updatedItems = await getGuestCartItems();
        const totals = calculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      }
    } catch (error) {
      console.log('removeFromCart error:', error);
    }
  },

  clearCart: async () => {
    try {
      const token = await getSecureItem('auth_token');
      if (token) {
        await apiClient.delete('/cart/clear');
        await get().fetchCart();
      } else {
        await clearGuestCart();
        set({ items: [], totalAmount: 0, totalItems: 0 });
      }
    } catch (error) {
      console.log('clearCart error:', error);
    }
  },

  syncCart: async () => {
    try {
      const guestItems = await getGuestCartItems();
      if (guestItems.length > 0) {
        const syncPayload = {
          items: guestItems.map(i => ({
            productId: i.productId,
            quantity: i.quantity
          }))
        };
        await apiClient.post('/cart/sync', syncPayload);
        await clearGuestCart();
      }
      await get().fetchCart();
    } catch (error) {
      console.log('syncCart error:', error);
    }
  }
}));
