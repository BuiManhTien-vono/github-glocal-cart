/* Seller Orders Page */
function SellerOrdersPage() {
  const app = document.getElementById('app');
  const orders = [
    {id:'ORD001',customer:'Nguyễn Văn A',total:32500000,status:'Chờ xác nhận',date:'19/10/2026',items:2},
    {id:'ORD002',customer:'Trần Thị B',total:5490000,status:'Đang giao',date:'18/10/2026',items:1},
    {id:'ORD003',customer:'Lê Văn C',total:990000,status:'Đã giao',date:'17/10/2026',items:1},
  ];
  const statusColor=(s)=>({['Chờ xác nhận']:'var(--warning)',['Đang giao']:'var(--secondary)',['Đã giao']:'var(--success)'}[s]||'var(--text)');

  app.innerHTML = `
    <div class="page fade-in">
      <div class="header header--primary"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Quản lý Đơn Hàng</span><span class="header__spacer"></span></div>
      <div class="tabs"><span class="tabs__item active">Tất cả</span><span class="tabs__item">Chờ xác nhận <span class="badge" style="margin-left:4px">2</span></span><span class="tabs__item">Đang giao</span><span class="tabs__item">Hoàn thành</span></div>
      <div class="scroll-content" style="padding:12px">${orders.map(o=>`
        <div class="seller-order-card"><div class="seller-order-card__header"><span class="seller-order-card__id">${o.id}</span><span class="seller-order-card__status" style="color:${statusColor(o.status)}">${o.status}</span></div><div class="seller-order-card__body"><p class="seller-order-card__customer"><i class="ion-ios-person" style="margin-right:4px"></i>${o.customer} • ${o.items} sản phẩm</p><p class="seller-order-card__total">₫${o.total.toLocaleString('vi-VN')}</p><p style="font-size:12px;color:var(--text-muted);margin-top:4px">${o.date}</p></div>
        <div class="seller-order-card__actions">${o.status==='Chờ xác nhận'?'<button class="btn btn--primary btn--sm">Xác nhận</button><button class="btn btn--outline btn--sm" style="color:var(--danger);border-color:var(--danger)">Từ chối</button>':'<button class="btn btn--outline btn--sm">Chi tiết</button>'}</div></div>
      `).join('')}</div>
    </div>
  `;
}
window.SellerOrdersPage = SellerOrdersPage;
