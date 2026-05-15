'use client';

import Image from 'next/image';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useNotificationStore } from '@/lib/store';
import { getFileUrl } from '@/lib/api';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    oldPrice?: number;
    images?: { imageUrl: string }[];
    rating?: number;
    soldCount?: string;
    categoryName: string;
  };
  index?: number;
  showFavoriteBadge?: boolean;
  showCheapBadge?: boolean;
}

export default function ProductCard({ product, index, showFavoriteBadge = false, showCheapBadge = false }: ProductCardProps) {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const isLiked = isInWishlist(product.id);

  const mainImage = product.images && product.images.length > 0 
    ? getFileUrl(product.images[0].imageUrl) 
    : `https://via.placeholder.com/400?text=${encodeURIComponent(product.name)}`;

  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: mainImage
    });
    
    addNotification(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product as any);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group bg-card rounded-[32px] border border-border overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-3 flex flex-col h-full backdrop-blur-sm"
    >
      {/* Image Container */}
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-bg-main dark:bg-white/5 block">
        <Image 
          src={mainImage} 
          alt={product.name} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          loading="eager"
          priority={index !== undefined && index <= 4}
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-0 flex flex-col gap-2 z-10">
          {showFavoriteBadge && (
            <div className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-r-md shadow-lg uppercase tracking-tighter flex items-center gap-1">
               Yêu thích
            </div>
          )}
          <div className="flex flex-col gap-2 pl-4 mt-1">
            <span className="bg-danger text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg uppercase tracking-tighter w-fit">Mall</span>
            {discount > 0 && (
              <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg w-fit">
                -{discount}%
              </span>
            )}
          </div>
        </div>

        {/* Index Badge */}
        {index !== undefined && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-black/50 backdrop-blur-md text-white text-xs font-black w-8 h-8 rounded-full flex items-center justify-center border border-white/20 shadow-xl">
              #{index}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`absolute inset-0 bg-black/5 dark:bg-black/40 transition-opacity flex items-center justify-center gap-2 ${isLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button 
            onClick={handleToggleWishlist}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl ${isLiked ? 'bg-danger text-white hover:bg-danger/90' : 'bg-white text-foreground hover:bg-primary hover:text-white'}`}
          >
            <Heart size={20} className={isLiked ? "fill-white" : ""} />
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 block">
          {product.categoryName}
        </span>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-base leading-tight mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {showCheapBadge && (
           <div className="mb-3">
              <span className="border border-red-500 text-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded">
                Rẻ Vô Địch
              </span>
           </div>
        )}

        <div className="flex items-center justify-between mb-4 mt-auto">
          <span className="text-xl font-black text-red-600 tracking-tighter">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold">Đã bán {product.soldCount || '1.2k'}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
           <div className="flex items-center text-amber-500 dark:text-amber-400 text-xs font-bold">
            <Star size={12} fill="currentColor" className="mr-1" />
            {product.rating || 5.0}
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="w-10 h-10 bg-foreground text-background rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-md"
          >
            <ShoppingCart size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
