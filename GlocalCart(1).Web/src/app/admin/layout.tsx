'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'Admin')) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'Admin') return null;

  return (
    <div className="bg-bg-main min-h-screen pb-20">
      <div className="bg-card border-b border-border mb-8">
        <div className="container-fluid px-[4%] max-w-[1400px] mx-auto py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/profile" className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Hệ Thống Quản Trị</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-black">{user.fullName}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black">
              {user.fullName?.charAt(0)}
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid px-[4%] max-w-[1400px] mx-auto">
        {children}
      </div>
    </div>
  );
}
