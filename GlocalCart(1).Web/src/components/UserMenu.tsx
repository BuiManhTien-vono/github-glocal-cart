'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  ChevronDown,
  ShoppingBag,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMenu() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return (
      <Link 
        href="/login"
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
      >
        <User size={18} />
        <span className="hidden sm:inline">ĐĂNG NHẬP</span>
      </Link>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/profile#overview', color: 'primary' },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User, href: '/profile#profile', color: 'blue' },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, href: '/profile#orders', color: 'emerald' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-4 bg-muted/50 hover:bg-muted rounded-2xl transition-all border border-border group"
      >
        <div className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center font-black shadow-lg group-hover:rotate-6 transition-transform">
          {user?.fullName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Thành viên</p>
          <p className="text-sm font-bold truncate max-w-[100px]">{user?.fullName}</p>
        </div>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#121212] border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-50 overflow-hidden"
          >
            <div className="p-5 border-b border-border bg-muted/10">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Tài khoản của bạn</p>
              <p className="text-sm font-black truncate text-foreground">{user?.email}</p>
            </div>

            <div className="p-2 relative">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  onClick={() => setIsOpen(false)}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-foreground transition-colors z-10 hover:text-primary"
                >
                  {hoveredTab === item.id && (
                    <motion.div
                      layoutId="hover-pill"
                      className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hoveredTab === item.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <item.icon size={18} />
                  </div>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="p-2 border-t border-border">
              <button
                onMouseEnter={() => setHoveredTab('logout')}
                onMouseLeave={() => setHoveredTab(null)}
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-red-500 transition-colors z-10"
              >
                {hoveredTab === 'logout' && (
                  <motion.div
                    layoutId="hover-pill"
                    className="absolute inset-0 bg-red-500/10 rounded-2xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hoveredTab === 'logout' ? 'bg-red-500 text-white' : 'bg-red-500/10'}`}>
                  <LogOut size={18} />
                </div>
                Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
