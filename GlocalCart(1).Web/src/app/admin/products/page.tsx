'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Package, Search, Loader2, 
  Lock, Unlock, Eye, Star,
  AlertTriangle, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/lib/store';
import Image from 'next/image';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.products.getAll();
      setProducts(data);
    } catch (err) {
      addNotification('Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (id: number) => {
    try {
      const res = await api.admin.toggleProductLock(id);
      if (res.success) {
        addNotification(res.message, 'success');
        fetchProducts();
      }
    } catch (err) {
      addNotification('Lỗi khi cập nhật trạng thái sản phẩm', 'error');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sellerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search & Filter Header */}
      <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên sản phẩm hoặc người bán..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-main border border-border rounded-2xl pl-12 pr-6 py-3 outline-none focus:border-primary transition-all font-medium"
          />
        </div>
        <button className="px-6 py-3 bg-muted rounded-2xl font-bold flex items-center gap-2 hover:bg-muted/80 transition-all">
          <Filter size={18} /> Lọc kết quả
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-[40px] border border-border shadow-sm overflow-hidden flex flex-col group hover:border-primary/50 transition-all"
            >
              {/* Product Image */}
              <div className="relative h-64 bg-muted overflow-hidden">
                {p.images && p.images[0] ? (
                  <img 
                    src={p.images[0].imageUrl.startsWith('http') ? p.images[0].imageUrl : `http://127.0.0.1:5100${p.images[0].imageUrl}`} 
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package size={48} /></div>
                )}
                {p.isLocked && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-red-500 text-white px-4 py-2 rounded-full font-black text-xs flex items-center gap-2 shadow-xl">
                      <Lock size={14} /> ĐÃ KHÓA
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 space-y-4">
                <div>
                  <h4 className="font-black text-xl text-foreground line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h4>
                  <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-2">
                    <Store size={12} className="text-primary" /> {p.sellerName}
                  </p>
                </div>

                <div className="flex items-center justify-between py-4 border-y border-border/50">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Giá bán</p>
                    <p className="text-lg font-black text-primary">{p.price.toLocaleString()}đ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tồn kho</p>
                    <p className="text-lg font-black text-foreground">{p.availableItemCount}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => handleToggleLock(p.id)}
                    className={`flex-1 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                      p.isLocked ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    {p.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                    {p.isLocked ? 'MỞ KHÓA' : 'KHÓA SẢN PHẨM'}
                  </button>
                  <button className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all">
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
