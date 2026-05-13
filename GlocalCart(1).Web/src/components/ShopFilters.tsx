'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';

interface ShopFiltersProps {
  categories: any[];
}

export default function ShopFilters({ categories }: ShopFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const currentCategoryId = searchParams.get('categoryId');
  const currentName = searchParams.get('name') || '';
  
  const [searchTerm, setSearchTerm] = useState(currentName);

  // Sync searchTerm with URL when it changes (e.g., from clear button or external navigation)
  useEffect(() => {
    setSearchTerm(searchParams.get('name') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleCategoryClick = (id?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set('categoryId', id.toString());
    } else {
      params.delete('categoryId');
    }
    startTransition(() => {
      router.push(`/shop?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="bg-card rounded-3xl border border-border p-6 sticky top-24 shadow-sm">
      <div className="flex items-center gap-2 font-black text-foreground uppercase tracking-widest mb-6 border-b border-border pb-4">
        <Filter size={20} className="text-primary" /> Lọc sản phẩm
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">Tìm kiếm</h3>
        <div className="relative">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tên sản phẩm..."
            className={`w-full bg-background border border-border rounded-2xl px-10 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all ${isPending ? 'opacity-50' : ''}`}
          />
          <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isPending ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
          {searchTerm && (
            <button 
              type="button"
              onClick={() => { setSearchTerm(''); router.push('/shop'); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:underline"
            >
              Xóa
            </button>
          )}
        </div>
      </form>
      
      <h3 className="font-bold text-foreground mb-4">Danh mục</h3>
      <ul className="flex flex-col gap-3">
        <li>
          <button 
            onClick={() => handleCategoryClick()}
            className={`text-sm font-medium hover:text-primary transition-colors text-left w-full ${!currentCategoryId ? 'text-primary font-bold' : 'text-muted-foreground'}`}
          >
            Tất cả sản phẩm
          </button>
        </li>
        {categories.map((cat: any) => (
          <li key={cat.id}>
            <button 
              onClick={() => handleCategoryClick(cat.id)}
              className={`text-sm font-medium hover:text-primary transition-colors text-left w-full ${currentCategoryId === cat.id.toString() ? 'text-primary font-bold' : 'text-muted-foreground'}`}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
