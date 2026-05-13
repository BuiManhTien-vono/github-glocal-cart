'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ScrollIndicator() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      const isScrollable = documentHeight > windowHeight + 100;
      const isAtBottom = scrollTop + windowHeight >= documentHeight - 50;
      
      // Only hide if we are sure we are at the bottom or the page is definitely not scrollable
      if (isAtBottom) {
        setVisible(false);
      } else if (isScrollable) {
        setVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Check multiple times as images/content might load late
    const interval = setInterval(handleScroll, 1000);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-[9999] transition-all cursor-pointer group"
      onClick={(e) => {
        e.preventDefault();
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }}
    >
      <div className="bg-primary text-white px-6 py-3 flex items-center gap-3 shadow-2xl border-t border-x border-white/20 animate-pulse">
        <span className="text-[11px] font-black uppercase tracking-[0.3em]">
          CUỘN XUỐNG
        </span>
        <ChevronDown size={14} className="stroke-[4px]" />
      </div>
    </div>
  );
}
