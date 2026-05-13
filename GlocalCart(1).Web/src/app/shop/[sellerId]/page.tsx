import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import FollowShopButton from '@/components/FollowShopButton';
import { Store, Star, Package, MapPin, Users } from 'lucide-react';
import Image from 'next/image';

export default async function SellerShopPage({ params }: { params: Promise<{ sellerId: string }> }) {
  const resolvedParams = await params;
  const sellerId = parseInt(resolvedParams.sellerId) || 0;
  const products = await api.products.getAll('', undefined, sellerId);
  const followData = (sellerId > 0) 
    ? await api.follows.getCount(sellerId).catch(() => ({ count: 0 }))
    : { count: 0 };
  
  // Try to get seller name from first product
  const sellerName = products.length > 0 ? products[0].sellerName : `Người bán #${sellerId}`;

  return (
    <div className="bg-bg-main min-h-screen pb-20">
      {/* Shop Header Banner */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="container-fluid px-[5%] py-12">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-5xl">
            {/* Avatar */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-2xl shrink-0">
              <Image 
                src="https://via.placeholder.com/150?text=Shop" 
                alt="Shop Logo" 
                fill 
                className="object-cover" 
              />
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-foreground">{sellerName}</h1>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Store size={14} /> Official
                </div>
              </div>
              <p className="text-muted-foreground font-medium mb-6">Đang hoạt động trên GlocalCart</p>
              
              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start gap-6 overflow-x-auto pb-2">
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-muted-foreground" />
                  <div>
                    <div className="text-lg font-black text-foreground">{products.length}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Sản phẩm</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-warning" />
                  <div>
                    <div className="text-lg font-black text-foreground">4.9</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Đánh giá</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  <div>
                    <div className="text-lg font-black text-foreground">{followData.count}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Theo dõi</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-muted-foreground" />
                  <div>
                    <div className="text-lg font-black text-foreground">Hà Nội</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Khu vực</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Follow Button */}
            <div className="shrink-0 mt-6 md:mt-0 w-full md:w-64">
              <FollowShopButton sellerId={sellerId} />
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container-fluid px-[5%] mt-12">
        <h2 className="text-2xl font-black text-foreground mb-8 uppercase tracking-tighter flex items-center gap-3">
          Sản Phẩm Của Shop <span className="bg-primary text-white text-xs px-2 py-1 rounded-full font-bold">{products.length}</span>
        </h2>
        
        {products.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border">
            <Store size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-black text-foreground">Shop chưa có sản phẩm nào</h3>
            <p className="text-muted-foreground mt-2">Vui lòng quay lại sau</p>
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
