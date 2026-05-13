'use client';

import { useWishlist } from '@/contexts/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return null;

  return (
    <div className="bg-bg-main min-h-screen pb-20 pt-10">
      <div className="container-fluid px-[5%]">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-danger/10 text-danger rounded-2xl flex items-center justify-center">
            <Heart size={24} className="fill-danger" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tighter">
            Đã thích <span className="text-primary text-2xl">({wishlist.length})</span>
          </h1>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
            <Heart size={64} className="mx-auto text-muted-foreground opacity-30 mb-6" />
            <h3 className="text-2xl font-black text-foreground mb-2">Danh sách yêu thích đang trống</h3>
            <p className="text-muted-foreground font-medium mb-8">Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.</p>
            <button 
              onClick={() => router.push('/shop')}
              className="px-8 py-4 bg-foreground text-background font-black rounded-xl hover:bg-primary hover:text-white transition-all inline-flex items-center gap-2"
            >
              <ShoppingBag size={20} />
              BẮT ĐẦU MUA SẮM NGAY
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {wishlist.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
