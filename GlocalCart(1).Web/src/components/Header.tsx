'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import CartDrawer from './CartDrawer';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';
import { motion } from 'framer-motion';

export default function Header() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 10) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);
  
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path) || (path === '/shop' && (pathname.startsWith('/product') || pathname.startsWith('/category')));
  };

  const navLinks = [
    { name: 'Trang Chủ', path: '/' },
    { name: 'Sản Phẩm', path: '/shop' },
    { name: 'Giới Thiệu', path: '/about' }
  ];

  return (
    <header 
      className={`fixed top-0 z-50 w-full px-4 py-4 transition-transform duration-500 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-6 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-border rounded-3xl shadow-2xl shadow-black/5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform">
              <ShoppingCart size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tighter text-foreground">
              GLOCAL<span className="text-primary italic">CART</span>
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground/70">
            {navLinks.map(link => (
              <Link 
                key={link.path}
                href={link.path} 
                onMouseEnter={() => setHoveredNav(link.path)}
                onMouseLeave={() => setHoveredNav(null)}
                className={`relative px-5 py-2.5 rounded-xl transition-colors z-10 ${isActive(link.path) ? 'text-primary' : 'hover:text-foreground'}`}
              >
                {hoveredNav === link.path && (
                  <motion.div
                    layoutId="nav-hover"
                    className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                {link.name}
                {isActive(link.path) && (
                  <motion.span 
                    layoutId="nav-active-line"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            <NotificationDropdown />
            <CartDrawer />
            <UserMenu />

            <button className="md:hidden p-2 text-foreground">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
