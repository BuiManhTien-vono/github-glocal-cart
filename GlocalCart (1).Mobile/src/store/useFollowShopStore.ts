import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/api/apiClient';

const STORAGE_KEY = '@glocal_followed_shops';

interface FollowedShop {
  id: number;
  name: string;
  logoUrl?: string;
  productCount?: number;
}

interface FollowShopState {
  followedShops: FollowedShop[];
  isLoading: boolean;
  loadFollowedShops: () => Promise<void>;
  followShop: (shop: FollowedShop) => Promise<void>;
  unfollowShop: (shopId: number) => Promise<void>;
  toggleFollow: (shop: FollowedShop) => Promise<void>;
  isFollowing: (shopId: number) => boolean;
}

export const useFollowShopStore = create<FollowShopState>((set, get) => ({
  followedShops: [],
  isLoading: false,

  loadFollowedShops: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get('/shops/followed') as any;
      if (Array.isArray(res)) {
        set({ followedShops: res, isLoading: false });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        return;
      }
    } catch {}
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) set({ followedShops: JSON.parse(stored) });
    } catch {}
    set({ isLoading: false });
  },

  followShop: async (shop: FollowedShop) => {
    if (get().isFollowing(shop.id)) return;
    const updated = [...get().followedShops, shop];
    set({ followedShops: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    try {
      await apiClient.post(`/shops/${shop.id}/follow`);
    } catch {}
  },

  unfollowShop: async (shopId: number) => {
    const updated = get().followedShops.filter(s => s.id !== shopId);
    set({ followedShops: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    try {
      await apiClient.delete(`/shops/${shopId}/follow`);
    } catch {}
  },

  toggleFollow: async (shop: FollowedShop) => {
    if (get().isFollowing(shop.id)) {
      await get().unfollowShop(shop.id);
    } else {
      await get().followShop(shop);
    }
  },

  isFollowing: (shopId: number) => {
    return get().followedShops.some(s => s.id === shopId);
  },
}));
