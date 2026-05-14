/* Notifications Page — ported from NotificationsScreen.tsx */
function NotificationsPage() {
  const app = document.getElementById('app');
  const notis = [
    {id:'1',title:'Giao hàng thành công',body:'Đơn hàng ORD202611 đã được giao thành công. Đừng quên đánh giá sản phẩm nhé!',date:'14:35 Hôm nay',type:'order',isRead:false},
    {id:'2',title:'Khuyến mãi khủng cuối tuần',body:'Giảm ngay 50% cho tất cả các sản phẩm Thời trang. Bấm xem ngay!',date:'09:00 Hôm qua',type:'promo',isRead:false},
    {id:'3',title:'Đơn hàng đang đến trạm trung chuyển',body:'Đơn hàng mua từ shop Apple Official đang trên đường giao đến bạn.',date:'12:00 18-10',type:'order',isRead:true},
    {id:'4',title:'Cập nhật hệ thống',body:'GlocalCart vừa cập nhật phiên bản mới với nhiều tính năng hấp dẫn.',date:'10:00 15-10',type:'system',isRead:true},
  ];
  const getIcon=(t)=>{switch(t){case 'order':return{icon:'ion-ios-cube',bg:'rgba(16,185,129,0.12)',color:'var(--success)'};case 'promo':return{icon:'ion-ios-gift',bg:'rgba(239,68,68,0.12)',color:'var(--danger)'};default:return{icon:'ion-ios-information-circle',bg:'rgba(37,99,235,0.12)',color:'var(--secondary)'};}};

  app.innerHTML = `
    <div class="page fade-in" style="padding-bottom:70px">
      <div class="header"><span class="header__spacer"></span><span class="header__title" style="font-size:20px;font-weight:800">Thông báo</span><button style="font-size:13px;color:var(--secondary);font-weight:600;padding:8px" onclick="showToast('Đã đánh dấu tất cả đã đọc','success')">Đánh dấu đã đọc</button></div>
      <div class="scroll-content">
        ${notis.map(n=>{const ic=getIcon(n.type);return `<div class="noti-item ${n.isRead?'':'noti-item--unread'}"><div class="noti-item__icon" style="background:${ic.bg}"><i class="${ic.icon}" style="color:${ic.color};font-size:24px"></i></div><div class="noti-item__content"><p class="noti-item__title">${n.title}</p><p class="noti-item__body">${n.body}</p><span class="noti-item__date">${n.date}</span></div></div>`;}).join('')}
      </div>
    </div>
  `;
}
window.NotificationsPage = NotificationsPage;
