/* Seller Shop Info Page */
function SellerShopInfoPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page fade-in">
      <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Trang trí Shop</span><span class="header__spacer"></span></div>
      <div class="scroll-content">
        <div style="text-align:center;padding:24px;background:var(--white)"><img src="https://ui-avatars.com/api/?name=GC&background=FF6B35&color=fff&size=100&bold=true" style="width:80px;height:80px;border-radius:40px;margin:0 auto 12px;border:3px solid var(--primary)" /><button class="btn btn--outline-primary btn--sm" style="margin:0 auto">Đổi Logo</button></div>
        <div class="divider"></div>
        <div class="seller-form">
          <div class="seller-form__group"><label class="seller-form__label">Tên Shop</label><input class="seller-form__input" value="Glocal Cart Official Store" /></div>
          <div class="seller-form__group"><label class="seller-form__label">Mô tả Shop</label><textarea class="seller-form__textarea">Gi gỉ gì gi cái gì cũng có. Chuyên cung cấp các sản phẩm công nghệ, thời trang, gia dụng chính hãng.</textarea></div>
          <div class="seller-form__group"><label class="seller-form__label">Số điện thoại</label><input class="seller-form__input" value="0901234567" /></div>
          <div class="seller-form__group"><label class="seller-form__label">Email</label><input class="seller-form__input" value="shop@glocalcart.com" /></div>
          <div class="seller-form__group"><label class="seller-form__label">Địa chỉ</label><input class="seller-form__input" value="123 Đường Lê Lợi, Q.1, HCM" /></div>
          <button class="btn btn--primary btn--full" onclick="showToast('Đã lưu thông tin shop!','success')">Lưu thay đổi</button>
        </div>
      </div>
    </div>
  `;
}
window.SellerShopInfoPage = SellerShopInfoPage;
