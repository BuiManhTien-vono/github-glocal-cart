/* Seller Dashboard — ported from SellerDashboardScreen.tsx */
function SellerDashboardPage() {
  const app = document.getElementById('app');
  const stats = [{label:'Doanh thu',value:'45.0M',icon:'ion-ios-wallet',color:'var(--success)'},{label:'Đơn chờ duyệt',value:'12',icon:'ion-ios-cube',color:'var(--warning)'},{label:'Sản phẩm',value:'34',icon:'ion-ios-pricetags',color:'var(--primary)'},{label:'Đánh giá',value:'4.8',icon:'ion-ios-star',color:'#F59E0B'}];
  const menus = [
    {icon:'ion-ios-storefront',color:'var(--primary)',label:'Xem Shop của tôi',sub:'Hiển thị giao diện người mua',extra:'ion-ios-eye',path:'/shop-view'},
    {icon:'ion-ios-receipt',color:'var(--warning)',label:'Quản lý Đơn Hàng',badge:'12',path:'/seller-orders'},
    {icon:'ion-ios-shirt',color:'var(--primary)',label:'Quản lý Sản Phẩm',path:'/seller-products'},
    {icon:'ion-ios-color-palette',color:'#8B5CF6',label:'Trang trí Shop',sub:'Thay đổi tên, logo, ảnh bìa, mô tả',path:'/seller-shop-info'},
    {icon:'ion-ios-folder',color:'#06B6D4',label:'Danh mục Shop',sub:'Thêm, sửa, xóa danh mục riêng',path:'/seller-categories'},
    {icon:'ion-ios-flash',color:'#ee4d2d',label:'Cài đặt Flash Sale',sub:'Bật/tắt giảm giá cho sản phẩm',path:'/seller-flash-sale'},
    {icon:'ion-ios-pie',color:'var(--success)',label:'Tài Chính & Doanh Thu'},
    {icon:'ion-ios-megaphone',color:'var(--secondary)',label:'Kênh Marketing'},
  ];

  app.innerHTML = `
    <div class="page fade-in">
      <div class="header header--primary"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Kênh Người Bán</span><span class="header__spacer"></span></div>
      <div class="scroll-content">
        <div class="seller-banner"><p class="seller-banner__title">Hiệu suất hôm nay</p></div>
        <div class="seller-stats"><div class="seller-stats__row">${stats.slice(0,2).map((s,i)=>`<div class="seller-stat ${i===0?'seller-stat--border-right':''} seller-stat--border-bottom"><i class="${s.icon} seller-stat__icon" style="color:${s.color}"></i><p class="seller-stat__val">${s.value}</p><p class="seller-stat__label">${s.label}</p></div>`).join('')}</div><div class="seller-stats__row">${stats.slice(2).map((s,i)=>`<div class="seller-stat ${i===0?'seller-stat--border-right':''}"><i class="${s.icon} seller-stat__icon" style="color:${s.color}"></i><p class="seller-stat__val">${s.value}</p><p class="seller-stat__label">${s.label}</p></div>`).join('')}</div></div>
        <div class="seller-menu"><p class="seller-menu__title">Quản lý Cửa Hàng</p>
          ${menus.map(m=>`<div class="seller-menu__item" onclick="${m.path?`router.navigate('${m.path}')`:"showToast('Tính năng đang phát triển','info')"}"><div class="seller-menu__icon" style="background:${m.color}20"><i class="${m.icon}" style="color:${m.color}"></i></div><div style="flex:1"><p class="seller-menu__label">${m.label}</p>${m.sub?`<p class="seller-menu__desc">${m.sub}</p>`:''}</div>${m.badge?`<span class="badge">${m.badge}</span>`:''}<i class="${m.extra||'ion-ios-arrow-forward'} seller-menu__chevron"></i></div>`).join('')}
        </div>
      </div>
    </div>
  `;
}
window.SellerDashboardPage = SellerDashboardPage;
