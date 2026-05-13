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
  
  const currentCategoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean) || [];
  // Fallback to legacy single categoryId if present
  const singleCategoryId = searchParams.get('categoryId');
  const activeCategories = currentCategoryIds.length > 0 ? currentCategoryIds : (singleCategoryId ? [singleCategoryId] : []);
  
  const currentName = searchParams.get('name') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  
  const [searchTerm, setSearchTerm] = useState(currentName);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  // Sync state with URL
  useEffect(() => {
    setSearchTerm(searchParams.get('name') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
  }, [searchParams]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`/shop?${params.toString()}`, { scroll: false });
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ name: searchTerm.trim() });
  };

  const handlePriceApply = () => {
    updateFilters({ 
      minPrice: minPrice.trim() || null, 
      maxPrice: maxPrice.trim() || null 
    });
  };

  const toggleCategory = (id: string) => {
    let newCategories = [...activeCategories];
    if (newCategories.includes(id)) {
      newCategories = newCategories.filter(c => c !== id);
    } else {
      newCategories.push(id);
    }
    
    updateFilters({ 
      categoryIds: newCategories.length > 0 ? newCategories.join(',') : null,
      categoryId: null // clear legacy param
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    startTransition(() => {
      router.push('/shop', { scroll: false });
    });
  };

  const hasActiveFilters = activeCategories.length > 0 || currentName || currentMinPrice || currentMaxPrice;

  return (
    <div className="bg-card rounded-3xl border border-border p-6 sticky top-24 shadow-sm">
      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
        <div className="flex items-center gap-2 font-black text-foreground uppercase tracking-widest">
          <Filter size={20} className="text-primary" /> Lọc
        </div>
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="text-xs font-bold text-primary hover:underline">
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
          <span>Khoảng giá</span>
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <input 
                type="number" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Tối thiểu"
                className="w-full bg-background border border-border rounded-xl pl-3 pr-8 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">đ</span>
            </div>
            <div className="w-3 h-[2px] bg-border rounded-full shrink-0"></div>
            <div className="relative flex-1 group">
              <input 
                type="number" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Tối đa"
                className="w-full bg-background border border-border rounded-xl pl-3 pr-8 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">đ</span>
            </div>
          </div>
          <button 
            onClick={handlePriceApply}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all text-sm active:scale-[0.98]"
          >
            ÁP DỤNG GIÁ
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Danh mục</h3>
        <ul className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {categories.map((cat: any) => {
            const isChecked = activeCategories.includes(cat.id.toString());
            return (
              <li key={cat.id}>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-primary border-primary text-white' : 'border-border group-hover:border-primary/50'}`}>
                    {isChecked && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${isChecked ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {cat.name}
                  </span>
                </label>
                {/* Hidden checkbox for accessibility */}
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isChecked}
                  onChange={() => toggleCategory(cat.id.toString())}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
