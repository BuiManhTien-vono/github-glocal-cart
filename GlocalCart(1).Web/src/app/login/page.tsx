'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/lib/store';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await api.auth.login({ email, password });
      if (result && result.token && result.user) {
        login(result.token, {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role
        });
        
        addNotification('Đăng nhập thành công!', 'success');
        router.back();
      } else {
        addNotification('Đăng nhập thất bại: Phản hồi từ máy chủ không hợp lệ.', 'error');
      }
    } catch (error: any) {
      addNotification(error.message || 'Đăng nhập thất bại do lỗi kết nối.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-[40px] p-10 shadow-2xl border border-border">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tighter mb-2 text-foreground">Xin Chào Lại!</h1>
          <p className="text-muted-foreground font-medium">Đăng nhập để trải nghiệm mua sắm không giới hạn.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none transition-colors font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-foreground">Mật khẩu</label>
              <Link href="#" className="text-xs font-bold text-primary hover:underline">Quên mật khẩu?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none transition-colors font-medium"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-4 bg-foreground text-background py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-primary hover:text-white transition-all disabled:opacity-70 group"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                ĐĂNG NHẬP <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center text-sm font-bold text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link href="#" className="text-primary hover:underline">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
