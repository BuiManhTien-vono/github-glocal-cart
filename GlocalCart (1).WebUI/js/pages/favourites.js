/* Favourites Page — ported from FavouritesScreen.tsx */
function FavouritesPage() {
  const app = document.getElementById('app');
  const favs = [
    {id:'1',name:'Tai nghe Bluetooth Apple AirPods Pro 2',price:5490000,img:'https://via.placeholder.com/150',rating:4.9,sold:1200},
    {id:'2',name:'Áo Thun Nam Phông Trơn Cổ Tròn',price:99000,img:'https://via.placeholder.com/150',rating:4.8,sold:5400},
  ];

  function render(items) {
    app.innerHTML = `
      <div class="page fade-in">
        <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Sản Phẩm Yêu Thích (${items.length})</span><span class="header__spacer"></span></div>
        <div class="scroll-content" style="padding:12px">
          ${items.length ? items.map(i=>`
            <div class="fav-card"><img class="fav-card__img" src="${i.img}" onerror="this.src='https://via.placeholder.com/90'" /><div class="fav-card__info"><p class="fav-card__name">${i.name}</p><p class="fav-card__price">₫${i.price.toLocaleString('vi-VN')}</p><div class="fav-card__rating"><i class="ion-ios-star" style="color:#F59E0B;font-size:12px"></i> ${i.rating} | Đã bán ${i.sold}</div></div><button class="fav-card__heart" onclick="removeFav('${i.id}')"><i class="ion-ios-heart"></i></button></div>
          `).join('') : `<div class="empty-state" style="margin-top:40px"><i class="ion-ios-heart-dislike" style="font-size:80px"></i><span class="empty-state__text">Chưa có sản phẩm yêu thích nào</span><button class="btn btn--primary btn--sm" onclick="router.navigate('/')">Khám phá ngay</button></div>`}
        </div>
      </div>
    `;
  }

  window.removeFav = (id) => { const idx = favs.findIndex(f=>f.id===id); if (idx>=0) favs.splice(idx,1); render(favs); };
  render(favs);
}
window.FavouritesPage = FavouritesPage;
