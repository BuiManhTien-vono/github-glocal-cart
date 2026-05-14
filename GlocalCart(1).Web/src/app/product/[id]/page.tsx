import { api, Product, getFileUrl } from '@/lib/api';
import { Star, ShoppingCart, ShieldCheck, ArrowLeft, RefreshCcw, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BackButton from '@/components/BackButton';
import AddToCartButton from '@/components/AddToCartButton';
import ProductTabs from '@/components/ProductTabs';
import FollowShopButton from '@/components/FollowShopButton';
import ProductImageCarousel from '@/components/ProductImageCarousel';
import RecentlyViewedTracker from '@/components/RecentlyViewedTracker';
import { notFound } from 'next/navigation';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id);
  
  let product;
  try {
    product = await api.products.getById(productId);
  } catch (error) {
    return notFound();
  }

  if (!product) return notFound();

  const oldPrice = product.oldPrice || product.price * 1.2;
  const discount = Math.round(((oldPrice - product.price) / oldPrice) * 100);

  return (
    <div className="bg-bg-main min-h-screen pb-20">
      <RecentlyViewedTracker product={{
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images?.[0]?.imageUrl ? getFileUrl(product.images[0].imageUrl) : ''
      }} />
      <div className="container-fluid px-[5%] py-6">
        <BackButton />
      </div>

      <div className="container-fluid px-[5%]">
        {/* Top Section: Media & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mb-12">
          {/* Left: Image Carousel */}
          <div className="h-full">
            <ProductImageCarousel images={product.images} productName={product.name} />
          </div>

          {/* Right: Price & Actions Card */}
          <div className="flex flex-col gap-6">
            <div className="bg-card p-8 rounded-[40px] border border-border shadow-2xl shadow-primary/5 flex flex-col gap-8 h-fit">
              <div className="price-stack">
                <div className="text-5xl font-black text-primary tracking-tighter mb-2">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg text-muted-foreground line-through decoration-danger/30 decoration-2">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(oldPrice)}
                  </span>
                  <span className="bg-danger/10 text-danger text-[10px] font-black px-2 py-1 rounded-md">GIẢM {discount}%</span>
                </div>
              </div>

              <AddToCartButton 
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images?.[0]?.imageUrl ? getFileUrl(product.images[0].imageUrl) : ''
                }} 
              />

              <div className="pt-8 border-t border-border/50 flex flex-col gap-4">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="w-10 h-10 bg-bg-main rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} className="text-success" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground">24 Tháng bảo hành</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Chính sách Premium</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="w-10 h-10 bg-bg-main rounded-xl flex items-center justify-center">
                    <RefreshCcw size={20} className="text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground">30 Ngày đổi trả</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Miễn phí hoàn toàn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Product Identity */}
        <div className="flex flex-col gap-6 mb-12">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-danger text-white text-xs font-black px-3 py-1 rounded-lg uppercase tracking-tighter shadow-lg shadow-danger/20">Mall</span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-[1.1]">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-amber-500 font-bold bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-500/20">
              <Star size={18} fill="currentColor" />
              <span>{product.averageRating || 4.9}</span>
            </div>
            <div className="w-[1px] h-4 bg-border hidden md:block"></div>
            <span className="text-muted-foreground font-medium underline cursor-pointer hover:text-primary">{product.reviewCount || 0} Đánh giá</span>
            <div className="w-[1px] h-4 bg-border hidden md:block"></div>
            <span className="text-muted-foreground font-medium">1.2k Đã bán</span>
          </div>
        </div>

        {/* Bottom Section: Details, Shop & Reviews */}
        <div className="web-detail-grid grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          <div className="flex flex-col gap-12">
            {/* Trust Banner (Full Width in this column) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-6 rounded-3xl border border-border">
              <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <RefreshCcw size={20} />
                </div>
                <span>15 Ngày trả hàng</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <ShieldCheck size={20} />
                </div>
                <span>100% Chính hãng</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <ShoppingCart size={20} />
                </div>
                <span>Giao hàng miễn phí</span>
              </div>
            </div>

            <ProductTabs product={product} />
          </div>

          <aside className="flex flex-col gap-8">
            {/* Shop Info Card */}
            <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm">
              <div className="flex items-center gap-6 pb-6 border-b border-border/50 mb-6">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 p-1">
                  <Image src="https://via.placeholder.com/100?text=Shop" alt="Shop" fill className="rounded-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black tracking-tight line-clamp-1">{product.sellerName || 'Glocal Store Official'}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-success mt-1">
                    <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                    ONLINE 5 PHÚT TRƯỚC
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-black text-primary">125</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Sản phẩm</div>
                </div>
                <div className="text-center border-x border-border/50">
                  <div className="text-lg font-black text-primary">4.9</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Đánh giá</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-primary">1k+</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Người theo dõi</div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <FollowShopButton sellerId={product.sellerId} />
                <Link href={`/shop/${product.sellerId}`} className="block w-full py-3 bg-primary-soft text-primary font-black rounded-2xl hover:bg-primary hover:text-white transition-all text-center text-sm">
                  XEM SHOP
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
