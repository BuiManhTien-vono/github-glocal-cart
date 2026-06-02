import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/api/apiClient';

const STORAGE_KEY = '@glocal_followed_shops';

interface FollowedShop {
  id: number;
  name: string;
  logoUrl?: string;
  productCount?: number;
  followedAt?: string;
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
    try {
      await apiClient.post(`/shops/${shop.id}/follow`);
      const updated = [...get().followedShops, shop];
      set({ followedShops: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      get().loadFollowedShops();
    } catch (error) {
      console.log('followShop sync failed:', error);
      throw error;
    }
  },

  unfollowShop: async (shopId: number) => {
    try {
      try {
        await apiClient.delete(`/shops/${shopId}/follow`);
      } catch {
        await apiClient.post(`/shops/${shopId}/unfollow`);
      }
      const updated = get().followedShops.filter(s => s.id !== shopId);
      set({ followedShops: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      get().loadFollowedShops();
    } catch (error) {
      console.log('unfollowShop sync failed:', error);
      throw error;
    }
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
