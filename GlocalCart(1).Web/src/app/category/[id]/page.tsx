import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { PackageSearch } from 'lucide-react';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const categoryId = parseInt(resolvedParams.id);
  
  // Fetch products by category
  const products = await api.products.getAll('', categoryId);
  
  // Try to find the category name. We can fetch all categories and find it.
  const categories = await api.categories.getAll();
  const category = categories.find((c: any) => c.id === categoryId);
  const categoryName = category ? category.name : `Danh mục #${categoryId}`;

  return (
    <div className="bg-bg-main min-h-screen pb-20">
      {/* Category Header */}
      <div className="w-full bg-primary/5 border-b border-border py-12">
        <div className="container-fluid px-[5%]">
          <h1 className="text-4xl md:text-5xl font-black text-foreground uppercase tracking-tighter mb-4">
            {categoryName}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            {category?.description || `Khám phá các sản phẩm nổi bật nhất trong danh mục ${categoryName}.`}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
              {products.length} sản phẩm
            </span>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container-fluid px-[5%] mt-12">
        {products.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border">
            <PackageSearch size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-black text-foreground">Không tìm thấy sản phẩm</h3>
            <p className="text-muted-foreground mt-2">Hiện tại danh mục này chưa có sản phẩm nào. Vui lòng quay lại sau!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
