'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalItems, totalAmount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <button className="relative p-2.5 text-foreground hover:text-primary transition-colors">
      <ShoppingCart size={22} />
    </button>
  );

  return (
    <>
      <button 
        onClick={() => setIsCartOpen(true)}
        className="relative p-2.5 text-foreground hover:text-primary transition-colors"
      >
        <ShoppingCart size={22} />
        {totalItems > 0 && (
          <motion.span 
            key={totalItems}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1.4, 1], opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-background shadow-lg"
          >
            {totalItems}
          </motion.span>
        )}
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isCartOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCartOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-background border-l border-border z-[101] shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <ShoppingCart size={20} />
                    </div>
                    <h2 className="text-xl font-black tracking-tighter text-foreground">GIỎ HÀNG</h2>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
                    <ShoppingCart size={48} className="opacity-20" />
                    <p className="font-medium">Giỏ hàng của bạn đang trống</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-xl mt-4"
                    >
                      Tiếp tục mua sắm
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-bg-main p-4 rounded-2xl border border-border group">
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            <div className="text-primary font-black mt-1">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3 bg-background rounded-lg border border-border p-1">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground">
                                <Minus size={14} />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground">
                                <Plus size={14} />
                              </button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-danger transition-colors p-2">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Checkout */}
                {items.length > 0 && (
                  <div className="p-6 border-t border-border bg-background">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-muted-foreground font-medium">Tổng tiền tạm tính</span>
                      <span className="text-2xl font-black text-foreground">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                      </span>
                    </div>
                    <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="w-full py-4 bg-foreground text-background rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-primary hover:text-white transition-all group">
                      THANH TOÁN <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
