'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api, Product } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function HeaderSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const results = await api.products.getAll(query);
        setSuggestions(results.slice(0, 5)); // Show top 5 suggestions
      } catch (error) {
        console.error('Error fetching suggestions', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/shop?name=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={wrapperRef} className="relative hidden lg:block w-64 xl:w-80">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full bg-background border border-border rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        {query && (
          <button 
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-card rounded-2xl border border-border shadow-xl overflow-hidden z-50">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col max-h-[300px] overflow-y-auto">
              {suggestions.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="w-10 h-10 relative bg-white rounded-md overflow-hidden shrink-0">
                    <Image 
                      src={product.images?.[0]?.imageUrl || 'https://via.placeholder.com/100'} 
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-foreground truncate">{product.name}</span>
                    <span className="text-xs font-black text-primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                    </span>
                  </div>
                </Link>
              ))}
              <div 
                onClick={handleSubmit}
                className="p-3 text-center text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
              >
                Xem tất cả kết quả cho "{query}"
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Không tìm thấy sản phẩm nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}
