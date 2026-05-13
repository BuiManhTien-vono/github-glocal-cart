/* Seller Categories Page */
function SellerCategoriesPage() {
  const app = document.getElementById('app');
  const cats = [
    {id:1,name:'Điện thoại & Phụ kiện',count:45},{id:2,name:'Laptop & Máy tính',count:32},
    {id:3,name:'Thời trang Nam',count:68},{id:4,name:'Thời trang Nữ',count:54},
    {id:5,name:'Đồ gia dụng',count:27},{id:6,name:'Sách & Văn phòng phẩm',count:19},
  ];
  app.innerHTML = `
    <div class="page fade-in">
      <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Danh mục Shop</span><button class="header__btn" onclick="showToast('Thêm danh mục mới','info')"><i class="ion-ios-add-circle"></i></button></div>
      <div class="scroll-content">
        ${cats.map(c=>`<div class="cat-row"><div class="cat-row__icon"><i class="ion-ios-folder"></i></div><div style="flex:1"><p class="cat-row__name">${c.name}</p><p class="cat-row__count">${c.count} sản phẩm</p></div><div style="display:flex;gap:8px"><button class="btn btn--outline btn--sm" style="padding:6px 12px">Sửa</button><button class="btn btn--outline btn--sm" style="padding:6px 12px;color:var(--danger);border-color:var(--danger)"><i class="ion-ios-trash"></i></button></div></div>`).join('')}
      </div>
    </div>
  `;
}
window.SellerCategoriesPage = SellerCategoriesPage;
