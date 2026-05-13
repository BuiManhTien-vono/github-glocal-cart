'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getFileUrl } from '@/lib/api';

interface FlashSaleCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    oldPrice?: number;
    images?: { imageUrl: string }[];
  };
  discount?: number;
  soldPercentage?: number;
}

export default function FlashSaleCard({ product, discount = 20, soldPercentage = 65 }: FlashSaleCardProps) {
  const mainImage = product.images && product.images.length > 0 
    ? getFileUrl(product.images[0].imageUrl) 
    : `https://via.placeholder.com/400?text=${encodeURIComponent(product.name)}`;

  const formattedPrice = product.price.toLocaleString('vi-VN') + ' đ';

  return (
    <div className="flex flex-col bg-white dark:bg-card rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 group">
      <Link href={`/product/${product.id}`} className="relative aspect-square">
        <Image 
          src={mainImage} 
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-0 right-0 bg-yellow-400 text-red-600 font-black text-[10px] px-2.5 py-1.5 rounded-bl-xl shadow-md">
          -{discount}%
        </div>
      </Link>
      
      <div className="p-6 flex flex-col items-center gap-4">
        <span className="text-red-600 font-black text-2xl tracking-tighter">
          {formattedPrice}
        </span>
        
        {/* Progress Bar - Pill Style */}
        <div className="w-full h-6 bg-orange-200 dark:bg-orange-900/20 rounded-full relative overflow-hidden shadow-inner">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-red-600 rounded-full shadow-lg"
            style={{ width: `${soldPercentage}%` }}
          ></div>
          
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 z-10">
            <span className="text-sm">🔥</span>
            <span className="text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-md">
              ĐANG BÁN CHẠY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
