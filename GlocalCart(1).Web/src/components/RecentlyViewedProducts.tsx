'use client';

import { useRecentlyViewedStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { History, X } from 'lucide-react';

export default function RecentlyViewedProducts() {
  const { products, clearHistory } = useRecentlyViewedStore();

  if (products.length === 0) return null;

  return (
    <div className="mt-16 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
          <History className="text-primary" />
          Sản phẩm bạn vừa xem
        </h2>
        <button 
          onClick={clearHistory}
          className="text-sm font-medium text-muted-foreground hover:text-danger flex items-center gap-1 transition-colors"
        >
          <X size={16} />
          Xóa lịch sử
        </button>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
        {products.map((product) => (
          <Link 
            href={`/product/${product.id}`} 
            key={product.id}
            className="shrink-0 w-[160px] md:w-[200px] snap-start group"
          >
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square relative bg-white">
                <Image 
                  src={product.imageUrl || 'https://via.placeholder.com/300?text=No+Image'} 
                  alt={product.name}
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="text-xs font-bold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <div className="text-sm font-black text-primary">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
