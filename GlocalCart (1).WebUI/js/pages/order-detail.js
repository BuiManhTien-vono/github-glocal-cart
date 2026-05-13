/* Order Detail Page — ported from OrderDetailScreen.tsx */
function OrderDetailPage(params) {
  const orderId = params?.orderId || 'ORD202611';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page fade-in">
      <div class="header header--primary"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Chi tiết đơn hàng</span><span class="header__spacer"></span></div>
      <div class="scroll-content">
        <div class="status-banner"><p class="status-banner__big">Người bán đang chuẩn bị hàng</p><p class="status-banner__sub">Dự kiến giao hàng vào 20/10/2026</p></div>
        <div class="detail-card" onclick="router.navigate('/shipment-tracking')" style="cursor:pointer"><div style="display:flex;gap:12px"><i class="ion-ios-car" style="font-size:24px;color:var(--secondary)"></i><div style="flex:1"><p style="font-size:15px;font-weight:700;color:var(--secondary);margin-bottom:6px">Thông tin vận chuyển</p><p style="font-size:14px;color:var(--success);margin-bottom:4px">Đơn hàng đã tới kho phân loại HCM.</p><p style="font-size:12px;color:var(--text-muted)">12:30 18-10-2026</p></div><i class="ion-ios-arrow-forward" style="color:var(--text-muted)"></i></div></div>
        <div class="detail-card"><div style="display:flex;gap:12px"><i class="ion-ios-pin" style="font-size:24px;color:var(--primary)"></i><div><p style="font-size:15px;font-weight:700;margin-bottom:6px">Địa chỉ nhận hàng</p><p style="font-size:14px;margin-bottom:4px">Nguyễn Văn A | 0901234567</p><p style="font-size:13px;color:var(--text-secondary)">123 Đường Lê Lợi, P. Bến Nghé, Quận 1, HCM</p></div></div></div>
        <div class="detail-card"><div style="display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--border-light);padding-bottom:12px;margin-bottom:12px"><i class="ion-ios-storefront" style="font-size:18px;color:var(--text-secondary)"></i><span style="font-size:15px;font-weight:700">Apple Official Store</span></div>
          <div class="product-row"><div class="product-row__img">💻</div><div class="product-row__info"><span class="product-row__name">MacBook Pro M2 2023</span><div class="product-row__price-row"><span class="product-row__price">32.000.000đ</span><span class="product-row__qty">x1</span></div></div></div>
          <div class="product-row" style="border-bottom:none"><div class="product-row__img">🖱</div><div class="product-row__info"><span class="product-row__name">Chuột không dây Logitech</span><div class="product-row__price-row"><span class="product-row__price">2.500.000đ</span><span class="product-row__qty">x1</span></div></div></div>
          <div style="border-top:1px solid var(--border-light);padding-top:12px"><div class="summary-row"><span class="summary-row__label">Mã đơn hàng</span><span class="summary-row__value">${orderId}</span></div><div class="summary-row"><span class="summary-row__label">Thành tiền</span><span style="font-size:18px;color:var(--primary);font-weight:700">34.500.000đ</span></div></div>
        </div>
      </div>
      <div class="bottom-bar"><button class="btn btn--outline btn--sm" style="flex:1">Liên hệ người bán</button><button class="btn btn--primary btn--sm" style="flex:1" onclick="router.navigate('/write-review')">Cho Đánh Giá</button></div>
    </div>
  `;
}
window.OrderDetailPage = OrderDetailPage;
