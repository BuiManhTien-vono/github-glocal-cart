import { Bell, Package, Tag, Clock } from 'lucide-react';
import Link from 'next/link';

const NOTIFICATIONS = [
  { id: 1, type: 'order', title: 'Đơn hàng đang giao', message: 'Đơn hàng #GLC-89247 đang được giao đến bạn. Vui lòng chú ý điện thoại.', time: '10 phút trước', date: '05/05/2026' },
  { id: 2, type: 'promo', title: 'Giảm 50% cho Đồng hồ', message: 'Mã giảm giá ĐỘC QUYỀN đã được thêm vào ví của bạn. Nhanh tay kẻo lỡ!', time: '2 giờ trước', date: '05/05/2026' },
  { id: 3, type: 'system', title: 'GlocalCart chào bạn mới', message: 'Cảm ơn bạn đã gia nhập hệ sinh thái GlocalCart. Chúc bạn mua sắm vui vẻ!', time: '1 ngày trước', date: '04/05/2026' },
  { id: 4, type: 'promo', title: 'Siêu sale 5.5 đã bắt đầu', message: 'Hàng ngàn sản phẩm đang giảm giá lên đến 70%. Mua ngay!', time: '2 ngày trước', date: '03/05/2026' },
  { id: 5, type: 'order', title: 'Giao hàng thành công', message: 'Đơn hàng #GLC-88120 đã được giao thành công. Đánh giá ngay để nhận xu!', time: '3 ngày trước', date: '02/05/2026' },
];

export default function NotificationsPage() {
  return (
    <div className="bg-bg-main min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">
            TẤT CẢ <span className="text-primary italic">THÔNG BÁO</span>
          </h1>
          <button className="text-sm font-bold text-primary hover:underline">
            Đánh dấu tất cả đã đọc
          </button>
        </div>

        <div className="bg-card rounded-[40px] border border-border shadow-xl overflow-hidden">
          {NOTIFICATIONS.map((notif, idx) => (
            <div 
              key={notif.id} 
              className={`p-8 border-b border-border last:border-0 hover:bg-primary/5 transition-all flex flex-col md:flex-row gap-6 group`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 shrink-0 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110 ${
                notif.type === 'order' ? 'bg-blue-500 shadow-blue-500/30' : 
                notif.type === 'promo' ? 'bg-primary shadow-primary/30' : 
                'bg-emerald-500 shadow-emerald-500/30'
              }`}>
                {notif.type === 'order' ? <Package size={28} /> : notif.type === 'promo' ? <Tag size={28} /> : <Bell size={28} />}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                  <h4 className="font-black text-xl text-foreground group-hover:text-primary transition-colors">
                    {notif.title}
                  </h4>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold bg-bg-main px-3 py-1 rounded-full w-fit">
                    <Clock size={14} />
                    {notif.time} • {notif.date}
                  </div>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {notif.message}
                </p>
                
                {/* Actions */}
                <div className="flex items-center gap-4">
                  {notif.type === 'order' && (
                    <Link href="/profile" className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
                      Theo dõi đơn hàng
                    </Link>
                  )}
                  {notif.type === 'promo' && (
                    <Link href="/shop" className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                      Mua sắm ngay
                    </Link>
                  )}
                  <button className="px-6 py-3 border-2 border-border text-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-muted-foreground font-bold hover:text-primary transition-colors">
            ← Quay lại Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
