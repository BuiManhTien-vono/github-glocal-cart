'use client';

import { useState } from 'react';
import { Star, User } from 'lucide-react';
import { Product } from '@/lib/api';

interface ProductTabsProps {
  product: Product;
}

const MOCK_REVIEWS = [
  {
    id: 1,
    user: "Nguyễn Văn A",
    rating: 5,
    comment: "Sản phẩm tuyệt vời, đóng gói cẩn thận. Giao hàng nhanh hơn dự kiến.",
    date: "2024-03-15"
  },
  {
    id: 2,
    user: "Trần Thị B",
    rating: 4,
    comment: "Chất lượng tốt so với giá tiền. Sẽ ủng hộ shop lần sau.",
    date: "2024-03-10"
  },
  {
    id: 3,
    user: "Lê Văn C",
    rating: 5,
    comment: "Rất hài lòng với dịch vụ chăm sóc khách hàng của shop.",
    date: "2024-03-05"
  },
  {
    id: 4,
    user: "Phạm Minh D",
    rating: 3,
    comment: "Sản phẩm ổn nhưng giao hàng hơi chậm một chút.",
    date: "2024-03-01"
  },
  {
    id: 5,
    user: "Hoàng Anh E",
    rating: 2,
    comment: "Màu sắc không giống hình lắm, hơi thất vọng.",
    date: "2024-02-25"
  }
];

const FILTERS = [
  { label: 'Tất cả', value: 'all', count: '1.2k' },
  { label: '5 Sao', value: '5', count: '1k' },
  { label: '4 Sao', value: '4', count: '150' },
  { label: '3 Sao', value: '3', count: '20' },
  { label: '2 Sao', value: '2', count: '5' },
  { label: '1 Sao', value: '1', count: '1' }
];

export default function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredReviews = activeFilter === 'all' 
    ? MOCK_REVIEWS 
    : MOCK_REVIEWS.filter(r => r.rating.toString() === activeFilter);

  return (
    <div className="bg-card p-10 rounded-[32px] border border-border shadow-sm">
      {/* Tab Headers */}
      <div className="flex gap-8 border-b border-border mb-10">
        <button 
          onClick={() => setActiveTab('description')}
          className={`pb-4 text-sm font-black tracking-widest transition-all relative ${
            activeTab === 'description' 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          MÔ TẢ SẢN PHẨM
          {activeTab === 'description' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 text-sm font-black tracking-widest transition-all relative ${
            activeTab === 'reviews' 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ĐÁNH GIÁ (1.2K)
          {activeTab === 'reviews' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'description' ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-12 bg-bg-main/50 p-8 rounded-3xl border border-border/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Danh mục</span>
              <span className="font-black text-foreground">Glocal Mall &gt; {product.categoryName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Thương hiệu</span>
              <span className="font-black text-foreground">Premium Brand</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Kho hàng</span>
              <span className="font-black text-foreground">{product.availableItemCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Gửi từ</span>
              <span className="font-black text-foreground">Hồ Chí Minh</span>
            </div>
          </div>

          <div className="prose prose-zinc max-w-none">
            <p className="text-lg leading-loose text-foreground/80 whitespace-pre-wrap italic">
              {product.description || 'Sản phẩm cao cấp được tuyển chọn bởi GlocalCart. Đảm bảo chất lượng và trải nghiệm tuyệt vời nhất cho người dùng.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-6 p-8 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20">
            <div className="text-center">
              <div className="text-5xl font-black text-amber-500 tracking-tighter">4.9</div>
              <div className="flex items-center gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} fill="#f59e0b" className="text-amber-500" />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {FILTERS.map((filter) => (
                <button 
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    activeFilter === filter.value
                      ? 'bg-white dark:bg-card border-primary text-primary shadow-md scale-105' 
                      : 'bg-white/50 dark:bg-card/50 border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <div key={review.id} className="p-8 bg-bg-main/30 rounded-3xl border border-border/50 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-border/50 rounded-full flex items-center justify-center text-muted-foreground">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="font-black text-sm">{review.user}</div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} fill={s <= review.rating ? "#f59e0b" : "none"} className={s <= review.rating ? "text-amber-500" : "text-muted-foreground"} />
                        ))}
                      </div>
                    </div>
                    <div className="ml-auto text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{review.date}</div>
                  </div>
                  <p className="text-foreground/80 leading-relaxed font-medium">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-bg-main/30 rounded-3xl border border-dashed border-border text-muted-foreground font-bold">
                Chưa có đánh giá nào cho mức sao này.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
