'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

export type CartItem = {
  id: number; // This is ProductId in frontend context
  dbItemId?: number; // Real ID in the CartItems table
  name: string;
  price: number;
  quantity: number;
  image: string;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  totalItems: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load initial cart
  useEffect(() => {
    const loadCart = async () => {
      if (authLoading) return;

      if (isAuthenticated) {
        try {
          const remoteCart = await api.cart.get();
          // Map backend items to frontend CartItem
          const mappedItems: CartItem[] = remoteCart.items.map((item: any) => ({
            id: item.productId,
            dbItemId: item.id,
            name: item.productName,
            price: item.priceSnapshot,
            quantity: item.quantity,
            image: item.productImage
          }));
          
          // If we had items in local storage before logging in, sync them
          const localSaved = localStorage.getItem('glocal_cart');
          if (localSaved) {
            const localItems = JSON.parse(localSaved);
            if (localItems.length > 0) {
              const syncData = localItems.map((li: any) => ({ productId: li.id, quantity: li.quantity }));
              await api.cart.sync(syncData);
              localStorage.removeItem('glocal_cart');
              // Reload remote cart after sync
              const updatedCart = await api.cart.get();
              setItems(updatedCart.items.map((item: any) => ({
                id: item.productId,
                dbItemId: item.id,
                name: item.productName,
                price: item.priceSnapshot,
                quantity: item.quantity,
                image: item.productImage
              })));
            } else {
              setItems(mappedItems);
            }
          } else {
            setItems(mappedItems);
          }
        } catch (error) {
          console.error("Failed to fetch remote cart", error);
        }
      } else {
        const saved = localStorage.getItem('glocal_cart');
        if (saved) {
          try {
            setItems(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse local cart");
          }
        }
      }
      setIsLoaded(true);
      setIsLoading(false);
    };

    loadCart();
  }, [isAuthenticated, authLoading]);

  // 2. Save to localStorage ONLY if guest
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      localStorage.setItem('glocal_cart', JSON.stringify(items));
    }
  }, [items, isLoaded, isAuthenticated]);

  const addToCart = async (newItem: CartItem) => {
    if (isAuthenticated) {
      try {
        await api.cart.addItem(newItem.id, newItem.quantity);
        const remoteCart = await api.cart.get();
        setItems(remoteCart.items.map((item: any) => ({
          id: item.productId,
          dbItemId: item.id,
          name: item.productName,
          price: item.priceSnapshot,
          quantity: item.quantity,
          image: item.productImage
        })));
      } catch (error) {
        console.error("Failed to add to remote cart", error);
      }
    } else {
      setItems(currentItems => {
        const existingItem = currentItems.find(item => item.id === newItem.id);
        if (existingItem) {
          return currentItems.map(item =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          );
        }
        return [...currentItems, newItem];
      });
    }
  };

  const removeFromCart = async (productId: number) => {
    const itemToRemove = items.find(i => i.id === productId);
    if (isAuthenticated && itemToRemove?.dbItemId) {
      try {
        await api.cart.removeItem(itemToRemove.dbItemId);
        setItems(currentItems => currentItems.filter(item => item.id !== productId));
      } catch (error) {
        console.error("Failed to remove from remote cart", error);
      }
    } else {
      setItems(currentItems => currentItems.filter(item => item.id !== productId));
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) return;
    const itemToUpdate = items.find(i => i.id === productId);
    
    if (isAuthenticated && itemToUpdate?.dbItemId) {
      try {
        await api.cart.updateItem(itemToUpdate.dbItemId, quantity);
        setItems(currentItems =>
          currentItems.map(item =>
            item.id === productId ? { ...item, quantity } : item
          )
        );
      } catch (error) {
        console.error("Failed to update remote cart quantity", error);
      }
    } else {
      setItems(currentItems =>
        currentItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.cart.clear();
      } catch (error) {
        console.error("Failed to clear remote cart", error);
      }
    }
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      totalItems,
      totalAmount,
      isCartOpen,
      setIsCartOpen,
      clearCart,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
