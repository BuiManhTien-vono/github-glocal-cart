/* Profile Page */
function ProfilePage() {
  const app = document.getElementById('app');
  const user = Auth.getUser() || {fullName:'Người dùng',email:'user@example.com'};
  const role = Auth.getRole();
  const orderTabs = [{label:'Chờ xác nhận',icon:'ion-ios-time'},{label:'Đang giao',icon:'ion-ios-car'},{label:'Đã giao',icon:'ion-ios-checkmark-circle'},{label:'Đánh giá',icon:'ion-ios-star'},{label:'Đã hủy',icon:'ion-ios-close-circle'}];

  app.innerHTML = `
    <div class="page fade-in" style="padding-bottom:70px">
      <div class="profile-header"><img class="profile-header__avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName||'U')}&background=FF6B35&color=fff&size=64" /><div><p class="profile-header__name">${user.fullName||'Người dùng'}</p><p class="profile-header__email">${user.email||''}</p></div></div>
      <div style="background:var(--white);padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:16px;font-weight:700">Đơn mua</span><span style="font-size:13px;color:var(--text-secondary);cursor:pointer" onclick="router.navigate('/my-orders')">Xem lịch sử mua hàng ›</span></div>
        <div style="display:flex;justify-content:space-around">${orderTabs.map(t=>`<div style="text-align:center;cursor:pointer" onclick="router.navigate('/my-orders',{activeTab:'${t.label}'})"><i class="${t.icon}" style="font-size:24px;color:var(--text-secondary)"></i><p style="font-size:11px;color:var(--text-secondary);margin-top:4px">${t.label}</p></div>`).join('')}</div>
      </div>
      <div class="divider"></div>
      <div class="profile-menu">
        <div class="profile-menu__item" onclick="router.navigate('/favourites')"><div class="profile-menu__icon" style="background:rgba(239,68,68,0.12)"><i class="ion-ios-heart" style="color:var(--danger)"></i></div><span class="profile-menu__label">Sản phẩm yêu thích</span><i class="ion-ios-arrow-forward profile-menu__chevron"></i></div>
        ${role==='Seller'||role==='Admin'?`<div class="profile-menu__item" onclick="router.navigate('/seller-dashboard')"><div class="profile-menu__icon" style="background:rgba(255,107,53,0.12)"><i class="ion-ios-storefront" style="color:var(--primary)"></i></div><span class="profile-menu__label">Kênh Người Bán</span><i class="ion-ios-arrow-forward profile-menu__chevron"></i></div>`:''}
        ${role==='Admin'?`<div class="profile-menu__item" onclick="router.navigate('/admin')"><div class="profile-menu__icon" style="background:rgba(37,99,235,0.12)"><i class="ion-ios-settings" style="color:var(--secondary)"></i></div><span class="profile-menu__label">Quản trị Admin</span><i class="ion-ios-arrow-forward profile-menu__chevron"></i></div>`:''}
        <div class="profile-menu__item" onclick="showToast('Tính năng đang phát triển','info')"><div class="profile-menu__icon" style="background:rgba(16,185,129,0.12)"><i class="ion-ios-card" style="color:var(--success)"></i></div><span class="profile-menu__label">Phương thức thanh toán</span><i class="ion-ios-arrow-forward profile-menu__chevron"></i></div>
        <div class="profile-menu__item" onclick="showToast('Tính năng đang phát triển','info')"><div class="profile-menu__icon" style="background:rgba(245,158,11,0.12)"><i class="ion-ios-pin" style="color:var(--warning)"></i></div><span class="profile-menu__label">Sổ địa chỉ</span><i class="ion-ios-arrow-forward profile-menu__chevron"></i></div>
        <div class="profile-menu__item" onclick="showToast('Tính năng đang phát triển','info')"><div class="profile-menu__icon" style="background:rgba(107,114,128,0.12)"><i class="ion-ios-lock" style="color:var(--text-secondary)"></i></div><span class="profile-menu__label">Đổi mật khẩu</span><i class="ion-ios-arrow-forward profile-menu__chevron"></i></div>
      </div>
      <div style="padding:16px"><button class="btn btn--outline btn--full" style="color:var(--danger);border-color:var(--danger)" onclick="Auth.logout();router.navigate('/login')"><i class="ion-ios-log-out"></i> Đăng Xuất</button></div>
    </div>
  `;
}
window.ProfilePage = ProfilePage;
