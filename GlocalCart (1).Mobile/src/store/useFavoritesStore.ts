import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/api/apiClient';

const STORAGE_KEY = '@glocal_favorites';

interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  mediaUrl?: string;
  imageUrls?: string[];
  sellerName?: string;
  averageRating?: number;
  stock?: number;
  availableItemCount?: number;
}

interface FavoritesState {
  favorites: FavoriteProduct[];
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  addFavorite: (product: FavoriteProduct) => Promise<void>;
  removeFavorite: (productId: number) => Promise<void>;
  toggleFavorite: (product: FavoriteProduct) => Promise<void>;
  isFavorite: (productId: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,

  loadFavorites: async () => {
    set({ isLoading: true });
    try {
      // Thử lấy từ API trước
      const res = await apiClient.get('/favorites') as any;
      if (Array.isArray(res) && res.length >= 0) {
        set({ favorites: res, isLoading: false });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        return;
      }
    } catch {
      // API không có, load từ local
    }
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) set({ favorites: JSON.parse(stored) });
    } catch {}
    set({ isLoading: false });
  },

  addFavorite: async (product: FavoriteProduct) => {
    const current = get().favorites;
    if (current.some(f => f.id === product.id)) return;

    try {
      await apiClient.post('/favorites', { productId: product.id });
      const updated = [...current, product];
      set({ favorites: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      throw error;
    }
  },

  removeFavorite: async (productId: number) => {
    try {
      await apiClient.delete(`/favorites/${productId}`);
      const updated = get().favorites.filter(f => f.id !== productId);
      set({ favorites: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      throw error;
    }
  },

  toggleFavorite: async (product: FavoriteProduct) => {
    if (get().isFavorite(product.id)) {
      await get().removeFavorite(product.id);
    } else {
      await get().addFavorite(product);
    }
  },

  isFavorite: (productId: number) => {
    return get().favorites.some(f => f.id === productId);
  },
}));
