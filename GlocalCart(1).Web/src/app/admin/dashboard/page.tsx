'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Users, Store, Package, ShoppingBag, 
  Clock, BarChart3, TrendingUp, ArrowUpRight, 
  Loader2, AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.admin.getDashboard();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
      <p className="text-muted-foreground font-bold">Đang tải dữ liệu hệ thống...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl flex flex-col items-center text-center">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h3 className="text-xl font-black text-foreground mb-2">Lỗi tải dữ liệu</h3>
      <p className="text-muted-foreground">{error}</p>
    </div>
  );

  const cards = [
    { label: 'Tổng người dùng', value: stats.totalUsers, icon: Users, color: 'blue', trend: '+12%' },
    { label: 'Số lượng Seller', value: stats.totalSellers, icon: Store, color: 'emerald', trend: '+5%' },
    { label: 'Tổng sản phẩm', value: stats.totalProducts, icon: Package, color: 'purple', trend: '+18%' },
    { label: 'Tổng đơn hàng', value: stats.totalOrders, icon: ShoppingBag, color: 'orange', trend: '+24%' },
    { label: 'Đơn chờ duyệt', value: stats.pendingOrders, icon: Clock, color: 'amber', trend: '-2%' },
    { label: 'Tổng doanh thu', value: `${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: BarChart3, color: 'rose', trend: '+31%' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-primary to-primary-dark p-10 rounded-[40px] text-white shadow-2xl shadow-primary/20 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tight">Chào mừng quay lại, Admin! 👋</h2>
          <p className="text-white/80 font-medium max-w-md">Dưới đây là tổng quan tình hình hoạt động của hệ thống GlocalCart trong 24h qua.</p>
        </div>
        <TrendingUp size={200} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card p-8 rounded-[32px] border border-border shadow-sm group hover:border-primary/30 transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                card.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                card.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                card.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                card.color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
                card.color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
                'bg-rose-500/10 text-rose-500'
              }`}>
                <card.icon size={28} />
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${
                card.trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {card.trend} <ArrowUpRight size={12} />
              </div>
            </div>
            <h3 className="text-4xl font-black text-foreground mb-1">{card.value}</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Secondary Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-[32px] border border-border">
          <h3 className="text-xl font-black mb-6">Hoạt động gần đây</h3>
          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Clock size={20} className="text-muted-foreground group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">Người dùng mới đăng ký</p>
                  <p className="text-xs text-muted-foreground">Vừa xong • {i + 1} phút trước</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card p-8 rounded-[32px] border border-border">
          <h3 className="text-xl font-black mb-6">Thông tin hệ thống</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-bg-main rounded-2xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Database</p>
              <div className="flex items-center gap-2 font-black text-green-500 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Healthy
              </div>
            </div>
            <div className="p-6 bg-bg-main rounded-2xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">API Status</p>
              <div className="flex items-center gap-2 font-black text-green-500 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
