/* Seller Products Page */
function SellerProductsPage() {
  const app = document.getElementById('app');
  const products = [
    {id:1,name:'iPhone 15 Pro Max 256GB',price:29990000,stock:15,status:'Đang bán'},
    {id:2,name:'Tai nghe AirPods Pro 2',price:5490000,stock:42,status:'Đang bán'},
    {id:3,name:'Ốp lưng MagSafe',price:990000,stock:0,status:'Hết hàng'},
  ];
  app.innerHTML = `
    <div class="page fade-in">
      <div class="header header--primary"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Quản lý Sản Phẩm</span><button class="header__btn"><i class="ion-ios-add"></i></button></div>
      <div class="tabs"><span class="tabs__item active">Tất cả (${products.length})</span><span class="tabs__item">Đang bán</span><span class="tabs__item">Hết hàng</span></div>
      <div class="scroll-content">${products.map(p=>`
        <div class="seller-product-card"><img class="seller-product-card__img" src="https://via.placeholder.com/80" /><div class="seller-product-card__info"><p class="seller-product-card__name">${p.name}</p><p class="seller-product-card__price">₫${p.price.toLocaleString('vi-VN')}</p><p class="seller-product-card__stock">${p.stock>0?`Kho: ${p.stock}`:'<span style="color:var(--danger)">Hết hàng</span>'}</p></div><div class="seller-product-card__actions"><button class="btn btn--outline btn--sm">Sửa</button><button class="btn btn--outline btn--sm" style="color:var(--danger);border-color:var(--danger)">Ẩn</button></div></div>
      `).join('')}</div>
    </div>
  `;
}
window.SellerProductsPage = SellerProductsPage;
