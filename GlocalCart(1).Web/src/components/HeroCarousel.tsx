'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, ChevronsDown } from 'lucide-react';
import { Product, getFileUrl } from '@/lib/api';

interface HeroCarouselProps {
  products: Product[];
}

export default function HeroCarousel({ products }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-slide
  useEffect(() => {
    if (isHovered || products.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(timer);
  }, [isHovered, products.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  if (!products || products.length === 0) return null;

  const currentProduct = products[currentIndex];
  
  let mainImage = `https://via.placeholder.com/800?text=${encodeURIComponent(currentProduct.name)}`;
  if (currentProduct.images && currentProduct.images.length > 0) {
    const rawUrl = currentProduct.images[0].imageUrl;
    if (rawUrl.startsWith('/images/')) {
      mainImage = rawUrl; // Local public image
    } else {
      mainImage = getFileUrl(rawUrl); // API or external image
    }
  }

  return (
    <section 
      className="relative pt-4 pb-12 overflow-hidden bg-background"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-primary/10 dark:bg-primary/20 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-primary/5 dark:bg-primary/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-card/50 dark:bg-card/20 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative min-h-[400px] md:min-h-[480px] flex items-center">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col md:flex-row items-center"
            >
              {/* Content Side */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black mb-6 w-fit uppercase tracking-widest"
                >
                  🔥 Sản phẩm nổi bật
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-6xl font-black tracking-tighter text-foreground mb-6 leading-[1.1] line-clamp-3"
                >
                  {currentProduct.name}
                </motion.h1>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-end gap-4 mb-10"
                >
                  <span className="text-4xl font-black text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentProduct.price)}
                  </span>
                  {currentProduct.oldPrice && (
                    <span className="text-xl text-muted-foreground line-through font-medium mb-1">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentProduct.oldPrice)}
                    </span>
                  )}
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link 
                    href={`/product/${currentProduct.id}`} 
                    className="group relative px-8 py-4 bg-primary text-white rounded-2xl font-black text-lg overflow-hidden shadow-xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <ShoppingCart size={20} /> MUA NGAY
                    </span>
                    <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:left-[100%] transition-all duration-1000"></div>
                  </Link>
                  <Link 
                    href="/shop" 
                    className="px-8 py-4 bg-foreground/5 text-foreground rounded-2xl font-black text-lg hover:bg-foreground/10 transition-colors flex items-center justify-center"
                  >
                    XEM TẤT CẢ
                  </Link>
                </motion.div>
              </div>

              {/* Image Side */}
              <div className="w-full md:w-1/2 relative h-[300px] md:h-full min-h-[300px] md:min-h-[480px] order-1 md:order-2 overflow-hidden rounded-r-[40px]">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 scale-[1.05]"
                >
                  <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full"></div>
                  <Image 
                    src={mainImage} 
                    alt={currentProduct.name}
                    fill
                    className="object-cover z-10"
                    priority
                  />
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute bottom-10 right-10 flex items-center gap-3 z-20">
            <button 
              onClick={handlePrev}
              className="w-12 h-12 rounded-full bg-background/50 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-colors shadow-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={handleNext}
              className="w-12 h-12 rounded-full bg-background/50 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-colors shadow-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Indicators */}
          <div className="absolute bottom-10 left-10 md:left-16 flex items-center gap-2 z-20">
            {products.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full h-2 ${currentIndex === idx ? 'w-8 bg-primary' : 'w-2 bg-foreground/20 hover:bg-foreground/40'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          
          {/* Scroll Down Indicator - Fully Theme Responsive */}
          <div 
            onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 opacity-90 hover:opacity-100 transition-all cursor-pointer group"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center text-primary drop-shadow-md"
            >
              <ChevronsDown size={32} />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
