import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ShopFilters from '@/components/ShopFilters';
import ShopSearch from '@/components/ShopSearch';
import RecentlyViewedProducts from '@/components/RecentlyViewedProducts';
import { PackageSearch } from 'lucide-react';

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ categoryId?: string, categoryIds?: string, name?: string, minPrice?: string, maxPrice?: string }> }) {
  const resolvedParams = await searchParams;
  const categoryId = resolvedParams.categoryId ? parseInt(resolvedParams.categoryId) : undefined;
  const categoryIds = resolvedParams.categoryIds ? resolvedParams.categoryIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : undefined;
  const searchName = resolvedParams.name || '';
  const minPrice = resolvedParams.minPrice ? parseInt(resolvedParams.minPrice) : undefined;
  const maxPrice = resolvedParams.maxPrice ? parseInt(resolvedParams.maxPrice) : undefined;

  // Fetch products
  const products = await api.products.getAll(searchName, categoryId, undefined, categoryIds, minPrice, maxPrice);
  
  // Fetch categories for filtering
  const categories = await api.categories.getAll();

  return (
    <div className="bg-bg-main min-h-screen pb-20">
      {/* Page Header */}
      <div className="w-full bg-primary/5 border-b border-border py-12">
        <div className="container-fluid px-[5%] text-center">
          <h1 className="text-4xl md:text-5xl font-black text-foreground uppercase tracking-tighter mb-4">
            CỬA HÀNG <span className="text-primary italic">GLOCAL</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl mx-auto">
            Khám phá hàng ngàn sản phẩm chất lượng cao từ các nhà bán hàng uy tín trên toàn quốc.
          </p>
        </div>
      </div>

      <div className="container-fluid px-[5%] mt-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0">
          <ShopFilters categories={categories} />
        </div>

        {/* Product Grid & Search */}
        <div className="flex-1">
          <ShopSearch />

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-foreground">
              {categoryId || (categoryIds && categoryIds.length > 0) ? `Sản phẩm theo danh mục` : 'Tất cả sản phẩm'}
              <span className="ml-3 text-sm px-3 py-1 bg-primary-soft text-primary rounded-full">{products.length} kết quả</span>
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
              <PackageSearch size={64} className="mx-auto text-muted-foreground opacity-30 mb-6" />
              <h3 className="text-xl font-black text-foreground mb-2">Không tìm thấy sản phẩm nào</h3>
              <p className="text-muted-foreground font-medium mb-8">Vui lòng thử tìm kiếm hoặc chọn danh mục khác.</p>
              <a href="/shop" className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-colors inline-block">
                XEM TẤT CẢ SẢN PHẨM
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx + 1} />
              ))}
            </div>
          )}
          
          <RecentlyViewedProducts />
        </div>
      </div>
    </div>
  );
}
