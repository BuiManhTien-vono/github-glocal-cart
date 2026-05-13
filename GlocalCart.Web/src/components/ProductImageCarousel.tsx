'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getFileUrl } from '@/lib/api';

interface ProductImageCarouselProps {
  images: { imageUrl: string }[];
  productName: string;
}

export default function ProductImageCarousel({ images, productName }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const displayImages = images.length > 0
    ? images.map(img => getFileUrl(img.imageUrl))
    : [`https://via.placeholder.com/800?text=${encodeURIComponent(productName)}`];

  // Auto-slide
  useEffect(() => {
    if (isHovered || displayImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isHovered, displayImages.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  return (
    <div
      className="flex flex-col gap-4 h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image Container */}
      <div className="relative flex-1 bg-white dark:bg-white/5 rounded-[40px] border border-border shadow-sm overflow-hidden group min-h-[400px] md:min-h-[500px] flex items-center justify-center p-8 md:p-12">
        {/* Professional Studio Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full h-full"
          >
            <Image
              src={displayImages[currentIndex]}
              alt={`${productName} - ${currentIndex + 1}`}
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {displayImages.length > 1 && (
          <>
            {/* Navigation Buttons */}
            <button
              onClick={handlePrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-xl border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-primary hover:text-white shadow-xl translate-x-2 group-hover:translate-x-0"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-xl border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-primary hover:text-white shadow-xl -translate-x-2 group-hover:translate-x-0"
            >
              <ChevronRight size={24} />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10 bg-black/10 dark:bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
              {displayImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-500 ${currentIndex === idx ? 'w-8 bg-primary shadow-lg shadow-primary/40' : 'w-2 bg-foreground/20 hover:bg-foreground/40'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Section - Moved Outside for cleaner look */}
      {displayImages.length > 1 && (
        <div className="flex items-center justify-center gap-4 px-2 overflow-x-auto no-scrollbar py-2">
          {displayImages.slice(0, 6).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${currentIndex === idx ? 'border-primary scale-110 shadow-xl z-10' : 'border-card opacity-60 hover:opacity-100 hover:scale-105'}`}
            >
              <Image src={img} alt="thumb" fill className="object-cover" />
              {currentIndex === idx && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
