'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Package, Clock, Truck, CheckCircle2, XCircle, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.orders.getMyOrders(1);
      // Depending on PagedResult, it might be res.items or res
      setOrders(res.items || res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Pending': return { label: 'Chờ xác nhận', color: 'text-warning', bg: 'bg-warning/10', icon: Clock };
      case 'Processing': return { label: 'Đang xử lý', color: 'text-primary', bg: 'bg-primary/10', icon: RefreshCw };
      case 'Shipped': return { label: 'Đang giao hàng', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Truck };
      case 'Delivered': return { label: 'Đã giao hàng', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 };
      case 'Cancelled': return { label: 'Đã hủy', color: 'text-danger', bg: 'bg-danger/10', icon: XCircle };
      default: return { label: status, color: 'text-muted-foreground', bg: 'bg-bg-main', icon: Package };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="bg-bg-main min-h-screen pb-20 pt-10">
      <div className="container-fluid px-[5%] max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-8">ĐƠN HÀNG CỦA TÔI</h1>
        
        {orders.length === 0 ? (
          <div className="bg-card p-12 rounded-3xl border border-border shadow-sm flex flex-col items-center text-center">
            <Package size={64} className="text-muted-foreground opacity-50 mb-4" />
            <h2 className="text-xl font-black text-foreground mb-2">Bạn chưa có đơn hàng nào</h2>
            <p className="text-muted-foreground font-medium mb-6">Hãy khám phá cửa hàng và mua sắm ngay nhé!</p>
            <button 
              onClick={() => router.push('/shop')}
              className="px-8 py-3 bg-primary text-white rounded-xl font-black hover:bg-primary/90 transition-colors"
            >
              TIẾP TỤC MUA SẮM
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {orders.map(order => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={order.id} className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className="p-5 border-b border-border bg-bg-main/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="text-sm font-bold text-muted-foreground mb-1">
                        Đơn hàng <span className="text-foreground uppercase">#{order.orderNumber}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Ngày đặt: {new Date(order.orderDate).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon size={16} />
                      {statusInfo.label}
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="p-5 flex flex-col gap-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="relative w-20 h-20 bg-bg-main rounded-2xl border border-border overflow-hidden shrink-0">
                          {item.productImage ? (
                            <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package size={24} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground line-clamp-1">{item.productName}</h4>
                          <p className="text-xs font-bold text-muted-foreground mt-1">Cung cấp bởi: <span className="text-primary">{item.sellerName}</span></p>
                          <div className="text-sm font-medium text-muted-foreground mt-2">x{item.quantity}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-primary">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.subtotal)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Footer */}
                  <div className="p-5 border-t border-border bg-bg-main flex justify-between items-center">
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      Tổng tiền:
                    </div>
                    <div className="text-2xl font-black text-foreground">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
