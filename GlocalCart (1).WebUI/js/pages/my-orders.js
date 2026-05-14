/* My Orders Page — ported from MyOrdersScreen.tsx */
function MyOrdersPage(params) {
  const app = document.getElementById('app');
  const tabsList = ['Tất cả','Chờ xác nhận','Đang giao','Đã giao','Đánh giá','Đã hủy'];
  let activeTab = params?.activeTab || 'Tất cả';
  const orders = [
    {id:'ORD202611',status:'Đang giao',total:32035000,items:2,date:'12/10/2026',product:'MacBook Pro M2 2023',shop:'Apple Official Store'},
    {id:'ORD202612',status:'Đã giao',total:150000,items:1,date:'01/10/2026',product:'Ốp lưng Silicone iPhone 15',shop:'Phụ Kiện Số 1'},
    {id:'ORD202613',status:'Chờ xác nhận',total:450000,items:3,date:'15/10/2026',product:'Áo sơ mi nam công sở',shop:'VietTien'},
  ];
  const statusColor=(s)=>({['Chờ xác nhận']:'var(--warning)',['Đang giao']:'var(--secondary)',['Đã giao']:'var(--success)',['Đã hủy']:'var(--danger)'}[s]||'var(--text)');

  function render() {
    const filtered = activeTab==='Tất cả'?orders:activeTab==='Đánh giá'?orders.filter(o=>o.status==='Đã giao'):orders.filter(o=>o.status===activeTab);
    app.innerHTML = `
      <div class="page fade-in">
        <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Đơn mua</span><button class="header__btn"><i class="ion-ios-search"></i></button></div>
        <div class="tabs" id="orderTabs">${tabsList.map(t=>`<span class="tabs__item ${activeTab===t?'active':''}" onclick="switchOrderTab('${t}')">${t}</span>`).join('')}</div>
        <div class="scroll-content" style="padding:var(--sp-sm)">
          ${filtered.length ? filtered.map(o=>`
            <div class="order-card"><div class="order-card__header"><div class="order-card__shop"><i class="ion-ios-storefront" style="font-size:16px"></i> ${o.shop}</div><span class="order-card__status" style="color:${statusColor(o.status)}">${o.status}</span></div>
            <div class="order-card__body" onclick="router.navigate('/order-detail',{orderId:'${o.id}'})"><div class="order-card__img"><i class="ion-ios-cube"></i></div><div><p class="order-card__product-name">${o.product}</p><p class="order-card__item-count">và ${o.items-1} sản phẩm khác...</p></div></div>
            <div class="order-card__footer">Thành tiền: <span class="order-card__amount">₫${o.total.toLocaleString('vi-VN')}</span></div>
            <div class="order-card__actions">${o.status==='Đã giao'?'<button class="btn btn--primary btn--sm" onclick="router.navigate(\'/write-review\')">Đánh Giá</button>':''}${o.status==='Đang giao'?'<button class="btn btn--primary btn--sm" onclick="router.navigate(\'/shipment-tracking\')">Theo dõi Đơn</button>':''}<button class="btn btn--outline btn--sm">Mua Lại</button></div></div>
          `).join('') : '<div class="empty-state"><i class="ion-ios-receipt" style="font-size:60px"></i><span class="empty-state__text">Chưa có đơn hàng nào</span></div>'}
        </div>
      </div>
    `;
  }

  window.switchOrderTab = (t) => { activeTab=t; render(); };
  render();
}
window.MyOrdersPage = MyOrdersPage;
