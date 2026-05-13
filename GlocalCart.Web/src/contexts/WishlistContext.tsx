'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/lib/api';
import { useNotificationStore } from '@/lib/store';

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const addNotification = useNotificationStore(state => state.addNotification);

  // Load from Local Storage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('glocal_wishlist');
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse wishlist', error);
      }
    }
  }, []);

  // Save to Local Storage when wishlist changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('glocal_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, mounted]);

  const addToWishlist = (product: Product) => {
    setWishlist(prev => {
      if (prev.some(p => p.id === product.id)) return prev;
      addNotification(`Đã thêm ${product.name} vào danh sách yêu thích`, 'success');
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: number) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some(p => p.id === productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
