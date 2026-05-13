'use client';

import { useState, useEffect } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import FlashSaleCard from './FlashSaleCard';
import { Product } from '@/lib/api';

interface FlashSaleSectionProps {
  products: Product[];
}

export default function FlashSaleSection({ products }: FlashSaleSectionProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 18,
    minutes: 24,
    seconds: 59
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <section className="py-12 bg-white dark:bg-card/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-8">
            <h2 className="text-4xl md:text-5xl font-black text-red-600 italic tracking-tighter uppercase drop-shadow-sm">
              FLASH SALE
            </h2>
            <div className="flex items-center gap-2">
              <div className="bg-black text-white px-3 py-2 rounded-lg font-black text-xl min-w-[40px] text-center shadow-lg">
                {formatTime(timeLeft.hours)}
              </div>
              <span className="font-black text-2xl text-foreground">:</span>
              <div className="bg-black text-white px-3 py-2 rounded-lg font-black text-xl min-w-[40px] text-center shadow-lg">
                {formatTime(timeLeft.minutes)}
              </div>
              <span className="font-black text-2xl text-foreground">:</span>
              <div className="bg-black text-white px-3 py-2 rounded-lg font-black text-xl min-w-[40px] text-center shadow-lg">
                {formatTime(timeLeft.seconds)}
              </div>
            </div>
          </div>
          <Link href="/shop" className="text-sm font-black text-muted-foreground hover:text-primary flex items-center gap-2 uppercase tracking-widest transition-all">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.slice(0, 5).map((product, i) => (
            <FlashSaleCard 
              key={product.id} 
              product={product} 
              discount={20 + (i * 5)} 
              soldPercentage={40 + (i * 12)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
