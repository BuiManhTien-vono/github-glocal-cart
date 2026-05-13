'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Package, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useBellStore } from '@/lib/store';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { notifications, markAsRead, markAllAsRead } = useBellStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return (
    <button className="relative p-2.5 text-foreground hover:text-primary transition-colors">
      <Bell size={22} />
    </button>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 transition-colors rounded-xl ${isOpen ? 'bg-primary/10 text-primary' : 'text-foreground hover:text-primary'}`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full border-2 border-background flex items-center justify-center animate-bounce-short">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[calc(100%+10px)] right-[-60px] sm:right-0 w-[380px] bg-background border border-border shadow-2xl rounded-3xl overflow-hidden z-50 origin-top-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-bg-main">
              <h3 className="font-black text-lg text-foreground">Thông báo</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Check size={14} /> Đánh dấu đã đọc
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto no-scrollbar flex flex-col">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => markAsRead(notif.id)}
                  className={`p-5 border-b border-border last:border-0 hover:bg-bg-main transition-colors cursor-pointer flex gap-4 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    notif.type === 'order' ? 'bg-blue-500 shadow-blue-500/20' : 
                    notif.type === 'promo' ? 'bg-primary shadow-primary/20' : 
                    'bg-emerald-500 shadow-emerald-500/20'
                  }`}>
                    {notif.type === 'order' ? <Package size={20} /> : notif.type === 'promo' ? <Tag size={20} /> : <Bell size={20} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-1">
                    <h4 className={`font-bold text-sm ${!notif.isRead ? 'text-foreground' : 'text-foreground/80'}`}>
                      {notif.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-snug mb-2">
                      {notif.message}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-1">
                      {notif.type === 'order' && (
                        <Link 
                          href="/profile#orders" 
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all"
                        >
                          Theo dõi đơn
                        </Link>
                      )}
                      {notif.type === 'promo' && (
                        <Link 
                          href="/shop" 
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all"
                        >
                          Dùng ngay
                        </Link>
                      )}
                      {notif.type === 'system' && (
                        <Link 
                          href="/about" 
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          Tìm hiểu thêm
                        </Link>
                      )}
                      <span className="text-[10px] font-bold text-muted-foreground ml-auto">{notif.time}</span>
                    </div>
                  </div>
                  
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-bg-main text-center">
              <Link 
                href="/notifications" 
                onClick={() => setIsOpen(false)}
                className="text-sm font-bold text-foreground hover:text-primary transition-colors block w-full py-2"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
