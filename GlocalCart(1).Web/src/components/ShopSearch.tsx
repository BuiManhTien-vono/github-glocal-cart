'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { api, Product } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function ShopSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const currentName = searchParams.get('name') || '';
  const [searchTerm, setSearchTerm] = useState(currentName);
  
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(searchParams.get('name') || '');
  }, [searchParams]);

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
      if (!searchTerm.trim()) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const results = await api.products.getAll(searchTerm.trim());
        setSuggestions(results.slice(0, 5));
      } catch (error) {
        console.error('Error fetching suggestions', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      // Only fetch suggestions if the searchTerm is different from the current URL parameter
      // This prevents the dropdown from showing up immediately after submitting a search
      if (searchTerm.trim() !== (searchParams.get('name') || '').trim()) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    const query = searchTerm.trim();
    
    if (query) {
      params.set('name', query);
    } else {
      params.delete('name');
    }
    
    startTransition(() => {
      router.push(`/shop?${params.toString()}`, { scroll: false });
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('name');
    startTransition(() => {
      router.push(`/shop?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-3xl mb-8 group">
      <form onSubmit={handleSearch} className="relative w-full">
        <Search size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isPending ? 'text-primary animate-pulse' : 'text-muted-foreground group-focus-within:text-primary'}`} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Nhập tên sản phẩm bạn muốn tìm..."
          className={`w-full bg-card border-2 border-border/50 hover:border-primary/30 focus:border-primary rounded-[24px] pl-12 pr-12 py-4 text-base font-medium outline-none transition-all shadow-sm focus:shadow-md focus:shadow-primary/5 ${isPending ? 'opacity-70' : ''}`}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-danger transition-colors"
          >
            <X size={20} />
          </button>
        )}
        <button type="submit" className="hidden">Tìm kiếm</button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && searchTerm.trim() && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-card rounded-2xl border border-border shadow-xl overflow-hidden z-50">
          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col max-h-[400px] overflow-y-auto">
              {suggestions.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 p-4 hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="w-12 h-12 relative bg-white rounded-lg overflow-hidden shrink-0 border border-border/50">
                    <Image 
                      src={product.images?.[0]?.imageUrl || 'https://via.placeholder.com/100'} 
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-base font-bold text-foreground truncate">{product.name}</span>
                    <span className="text-sm font-black text-primary mt-0.5">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                    </span>
                  </div>
                </Link>
              ))}
              <div 
                onClick={handleSearch}
                className="p-4 text-center text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
              >
                Xem tất cả kết quả cho "{searchTerm}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
