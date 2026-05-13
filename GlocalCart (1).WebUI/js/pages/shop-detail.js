/* Shop Detail Page — ported from ShopDetailScreen.tsx */
function ShopDetailPage() {
  const app = document.getElementById('app');
  const s = {name:'Glocal Cart Official Store',logo:'https://ui-avatars.com/api/?name=G&background=000&color=fff&size=80&bold=true',followers:'304,9k',following:'4',rating:'4.9',totalRatings:'194,2k',chatRate:'100%',chatTime:'Trong vòng vài tiếng',cancelRate:'2%',products:'189',joined:'4 năm',desc:'Gi gỉ gì gi cái gì cũng có'};
  const row=(icon,label,val,sub)=>`<div class="shop-detail-row"><div class="shop-detail-row__left"><i class="${icon}"></i><span class="shop-detail-row__label">${label}</span></div><div class="shop-detail-row__right"><span class="shop-detail-row__value">${val}</span>${sub?`<span class="shop-detail-row__sub"> (${sub})</span>`:''}</div></div><div class="divider--thin" style="margin-left:40px"></div>`;

  app.innerHTML = `
    <div class="page page--white fade-in">
      <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back" style="color:var(--primary)"></i></button><span class="header__title">Chi tiết Shop</span><span class="header__spacer"></span></div>
      <div class="scroll-content">
        <div style="display:flex;padding:16px;align-items:center;gap:12px"><img src="${s.logo}" style="width:60px;height:60px;border-radius:30px" /><div><p style="font-size:16px;font-weight:500">${s.name}</p><div style="display:flex;align-items:center;gap:4px;margin:4px 0"><div style="width:8px;height:8px;border-radius:4px;background:#10B981"></div><span style="font-size:12px;color:var(--text-secondary)">Online</span></div><div style="display:flex;align-items:center;gap:6px"><span style="background:#ee4d2d;color:white;font-size:10px;font-weight:700;padding:2px 4px;border-radius:2px">Yêu thích</span><span style="font-size:13px">Người theo dõi ${s.followers} | Đang Theo ${s.following}</span></div></div></div>
        <div class="divider"></div>
        ${row('ion-ios-star-outline','Đánh giá',s.rating+' / 5',s.totalRatings+' Đánh giá')}
        ${row('ion-ios-chatbubbles','Tỉ lệ phản hồi Chat',s.chatRate,s.chatTime)}
        ${row('ion-ios-close-circle-outline','Tỉ lệ hủy đơn',s.cancelRate)}
        ${row('ion-ios-cube','Sản phẩm',s.products)}
        ${row('ion-ios-person','Đã tham gia',s.joined)}
        ${row('ion-ios-document-outline','Mô tả Shop',s.desc)}
        <div class="shop-detail-row"><div class="shop-detail-row__left"><i class="ion-ios-shield-checkmark"></i><span class="shop-detail-row__label">Tài khoản đã được xác minh</span></div><div class="shop-detail-row__right"><div class="verify-icon" style="background:#10B981"><i class="ion-ios-phone-portrait"></i></div><div class="verify-icon" style="background:#F43F5E"><i class="ion-ios-mail"></i></div><div class="verify-icon" style="background:#3B82F6"><i class="ion-logo-facebook"></i></div></div></div>
        <div style="padding:16px 16px 40px;background:#f5f5f5"><button class="btn btn--primary btn--full" style="background:#ee4d2d" onclick="router.navigate('/shop-view',{activeTab:'products'})">Xem tất cả sản phẩm</button></div>
      </div>
    </div>
  `;
}
window.ShopDetailPage = ShopDetailPage;
