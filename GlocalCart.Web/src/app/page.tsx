import {
  ArrowRight, Sparkles, LayoutGrid, ShieldCheck, RefreshCcw, Truck, Zap,
  Smartphone, Shirt, Home as HomeIcon, Sofa, Sparkle, Trophy, ShoppingBag,
  Clock, Ticket, Award, Tag, Store, Crown, ShoppingBasket
} from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import FlashSaleSection from '@/components/FlashSaleSection';
import { api, Product } from '@/lib/api';



export default async function Home({ searchParams }: { searchParams: Promise<{ categoryId?: string }> }) {
  const resolvedParams = await searchParams;
  const selectedCategoryId = resolvedParams.categoryId ? parseInt(resolvedParams.categoryId) : undefined;
  
  let products: Product[] = [];
  let categoriesData: any[] = [];
  let isApiOnline = false;

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api.products.getAll(undefined, selectedCategoryId).catch(() => null),
      api.categories.getAll().catch(() => null)
    ]);

    if (productsRes && productsRes.length > 0) {
      products = productsRes;
      isApiOnline = true;
    }

    if (categoriesRes && categoriesRes.length > 0) {
      categoriesData = categoriesRes;
    }
  } catch (error) {
    console.error('Error in Home component data fetching:', error);
  }

  const MOCK_CATEGORY_STYLES = [
    { icon: <Smartphone className="w-8 h-8" />, color: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-500/30" },
    { icon: <Shirt className="w-8 h-8" />, color: "bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400", border: "border-pink-200 dark:border-pink-500/30" },
    { icon: <HomeIcon className="w-8 h-8" />, color: "bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-500/30" },
    { icon: <Sofa className="w-8 h-8" />, color: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-500/30" },
    { icon: <Sparkle className="w-8 h-8" />, color: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/30" },
    { icon: <Trophy className="w-8 h-8" />, color: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30" }
  ];

  const displayCategories = categoriesData.length > 0
    ? categoriesData.map((cat, idx) => ({
      ...cat,
      icon: MOCK_CATEGORY_STYLES[idx % MOCK_CATEGORY_STYLES.length].icon,
      color: MOCK_CATEGORY_STYLES[idx % MOCK_CATEGORY_STYLES.length].color,
      border: MOCK_CATEGORY_STYLES[idx % MOCK_CATEGORY_STYLES.length].border
    }))
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Dynamic Hero Carousel */}
      <HeroCarousel products={products.slice(0, 5)} />

      {/* Trust Badges - Responsive Glassmorphism */}
      <div className="container mx-auto px-4 mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/70 dark:bg-white/5 backdrop-blur-2xl p-3 rounded-[40px] border border-white/20 dark:border-white/10 shadow-2xl">
          <div className="bg-white/50 dark:bg-white/5 p-4 rounded-[32px] flex items-center gap-4 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-default group border border-white/10 dark:border-white/5">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><ShieldCheck size={24} /></div>
            <div><h4 className="font-black text-sm uppercase tracking-tighter text-foreground">Chính Hãng</h4><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Glocal Mall 100%</p></div>
          </div>
          <div className="bg-white/50 dark:bg-white/5 p-4 rounded-[32px] flex items-center gap-4 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-default group border border-white/10 dark:border-white/5">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><RefreshCcw size={24} /></div>
            <div><h4 className="font-black text-sm uppercase tracking-tighter text-foreground">Đổi Trả</h4><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Miễn phí 15 ngày</p></div>
          </div>
          <div className="bg-white/50 dark:bg-white/5 p-4 rounded-[32px] flex items-center gap-4 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-default group border border-white/10 dark:border-white/5">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Truck size={24} /></div>
            <div><h4 className="font-black text-sm uppercase tracking-tighter text-foreground">Vận Chuyển</h4><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Giao hàng hỏa tốc</p></div>
          </div>
          <div className="bg-white/50 dark:bg-white/5 p-4 rounded-[32px] flex items-center gap-4 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-default group border border-white/10 dark:border-white/5">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Zap size={24} /></div>
            <div><h4 className="font-black text-sm uppercase tracking-tighter text-foreground">Ưu Đãi</h4><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Member Exclusive</p></div>
          </div>
        </div>
      </div>



      {/* Flash Sale Section */}
      <FlashSaleSection products={products} />






      {/* Daily Suggestions Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-center text-foreground">
              DANH SÁCH <span className="text-primary italic">SẢN PHẨM</span>
            </h2>
            <div className="h-1.5 w-40 bg-primary/20 rounded-full mt-4 flex justify-center">
               <div className="h-full w-12 bg-primary rounded-full"></div>
            </div>
          </div>

          {/* Category Filter Bar */}
          <div className="flex items-center justify-center gap-3 mb-12 overflow-x-auto pb-4 no-scrollbar">
            <Link 
              href="/" 
              scroll={false}
              className={`px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap shadow-sm border ${!selectedCategoryId ? 'bg-primary text-white border-primary shadow-primary/20 scale-105' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
            >
              TẤT CẢ
            </Link>
            {displayCategories.map((cat: any) => (
              <Link 
                key={cat.id}
                href={`/?categoryId=${cat.id}`}
                scroll={false}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap shadow-sm border flex items-center gap-2 ${selectedCategoryId === cat.id ? 'bg-primary text-white border-primary shadow-primary/20 scale-105' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
              >
                <span className="opacity-70">{cat.icon}</span>
                {cat.name.toUpperCase()}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {products.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx + 1}
                showFavoriteBadge={true}
                showCheapBadge={true}
              />
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Link
              href="/shop"
              className="px-12 py-5 border-2 border-foreground dark:border-white rounded-2xl font-black uppercase tracking-widest hover:bg-foreground hover:text-background dark:hover:bg-white dark:hover:text-black transition-all"
            >
              Xem thêm sản phẩm
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
