/* Shop View Page — ported from ShopScreen.tsx */
function ShopViewPage(params) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page fade-in"><div class="loading"><div class="spinner"></div><span class="text-secondary">Đang tải cửa hàng...</span></div></div>`;
  loadShopView(params?.activeTab || 'shop');
}
async function loadShopView(initTab) {
  const app = document.getElementById('app');
  let products = [];
  try { const res = await API.get('/products'); products = res?.items || (Array.isArray(res) ? res : []); } catch(e) {}
  let activeTab = initTab;
  let isFollowing = false;
  let followCount = 12500;
  const SHOP = {name:'Glocal Cart Official Store',logo:'https://ui-avatars.com/api/?name=GC&background=FF6B35&color=fff&size=80&bold=true',banner:'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop',rating:4.8};
  const cats = [{id:'sc1',name:'Điện thoại & Phụ kiện',count:45,icon:'ion-ios-phone-portrait'},{id:'sc2',name:'Laptop & Máy tính',count:32,icon:'ion-ios-laptop'},{id:'sc3',name:'Thời trang Nam',count:68,icon:'ion-ios-shirt'},{id:'sc4',name:'Thời trang Nữ',count:'ion-ios-woman'},{id:'sc5',name:'Đồ gia dụng',count:27,icon:'ion-ios-home'}];

  function render() {
    const fStr = followCount>=1000?(followCount/1000).toFixed(1)+'k':followCount;
    let tabContent = '';
    if (activeTab==='shop') {
      tabContent = `<div class="section"><div class="section__header"><div class="flash-title-row"><i class="ion-ios-flash" style="color:#ee4d2d;font-size:20px"></i><span class="flash-title">FLASH SALE</span></div><span class="section__see-all">Xem tất cả ›</span></div><div class="h-scroll">${products.slice(0,6).map((p,i)=>{const img=p.images?.[0]?.imageUrl||'https://via.placeholder.com/120';const disc=15+i*5;return `<div class="flash-card" onclick="router.navigate('/product/${p.id}')"><div class="flash-card__img-wrap"><img class="flash-card__img" src="${img}" onerror="this.src='https://via.placeholder.com/120'" /><div class="flash-card__discount">-${disc}%</div></div><div class="flash-card__price">₫${Math.round(p.price*(1-disc/100)).toLocaleString('vi-VN')}</div><div class="sold-bar"><div class="sold-bar__fill" style="width:${30+i*12}%"></div><span class="sold-bar__text">Đã bán ${30+i*12}%</span></div></div>`;}).join('')}</div></div>
        <div class="divider"></div>
        <div class="section"><div class="section__header"><span class="section__title">Gợi ý cho bạn</span></div><div class="product-grid">${products.slice(0,8).map(p=>{const img=p.images?.[0]?.imageUrl||'https://via.placeholder.com/150';return `<div style="cursor:pointer;background:var(--white);border-radius:8px;overflow:hidden;border:1px solid var(--border-light)" onclick="router.navigate('/product/${p.id}')"><img src="${img}" style="width:100%;height:140px;object-fit:cover" onerror="this.src='https://via.placeholder.com/150'" /><div style="padding:8px"><p style="font-size:12px;height:32px;overflow:hidden">${p.name}</p><p style="font-size:14px;font-weight:700;color:var(--primary)">₫${(p.price||0).toLocaleString('vi-VN')}</p></div></div>`;}).join('')}</div></div>`;
    } else if (activeTab==='products') {
      tabContent = `<div class="section"><div class="section__header"><span class="section__title">Tất cả sản phẩm (${products.length})</span></div>${products.length?`<div class="product-grid">${products.map(p=>{const img=p.images?.[0]?.imageUrl||'https://via.placeholder.com/150';return `<div style="cursor:pointer;background:var(--white);border-radius:8px;overflow:hidden;border:1px solid var(--border-light)" onclick="router.navigate('/product/${p.id}')"><img src="${img}" style="width:100%;height:140px;object-fit:cover" onerror="this.src='https://via.placeholder.com/150'" /><div style="padding:8px"><p style="font-size:12px;height:32px;overflow:hidden">${p.name}</p><p style="font-size:14px;font-weight:700;color:var(--primary)">₫${(p.price||0).toLocaleString('vi-VN')}</p></div></div>`;}).join('')}</div>`:'<div class="empty-state"><i class="ion-ios-cube"></i><span class="empty-state__text">Chưa có sản phẩm nào</span></div>'}</div>`;
    } else {
      tabContent = `<div class="section"><div class="section__header"><span class="section__title">Danh mục của Shop</span></div>${cats.map(c=>`<div class="cat-row" onclick="router.navigate('/search',{q:'${c.name}'})"><div class="cat-row__icon"><i class="${c.icon||'ion-ios-folder'}"></i></div><div style="flex:1"><p class="cat-row__name">${c.name}</p><p class="cat-row__count">${c.count} sản phẩm</p></div><i class="ion-ios-arrow-forward" style="color:var(--text-muted)"></i></div>`).join('')}</div>`;
    }

    app.innerHTML = `<div class="page fade-in">
      <div class="shop-banner"><img class="shop-banner__img" src="${SHOP.banner}" onerror="this.style.background='var(--primary)'" /><div class="shop-banner__overlay"></div>
        <div class="shop-banner__nav"><button class="shop-float-btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><div class="shop-banner__nav-right"><button class="shop-float-btn" onclick="router.navigate('/search')"><i class="ion-ios-search"></i></button><button class="shop-float-btn" onclick="router.navigate('/cart')"><i class="ion-ios-cart"></i></button></div></div>
        <div class="shop-info-card"><div class="shop-info-card__left"><img class="shop-info-card__logo" src="${SHOP.logo}" /><div><div class="shop-info-card__name" onclick="router.navigate('/shop-detail')">${SHOP.name} <i class="ion-ios-arrow-forward" style="font-size:12px"></i></div><div class="shop-info-card__stats"><i class="ion-ios-star" style="color:#FFD700;font-size:13px"></i> ${SHOP.rating} | <i class="ion-ios-people" style="font-size:13px"></i> ${fStr} Theo dõi</div></div></div>
          <div class="shop-info-card__actions"><button class="shop-follow-btn ${isFollowing?'active':''}" id="followBtn">${isFollowing?'✓ Đang theo dõi':'+ Theo dõi'}</button><button class="shop-chat-btn"><i class="ion-ios-chatbubbles"></i> Nhắn tin</button></div></div>
      </div>
      <div class="shop-tab-content"><div class="tabs"><span class="tabs__item ${activeTab==='shop'?'active':''}" onclick="switchShopTab('shop')">Shop</span><span class="tabs__item ${activeTab==='products'?'active':''}" onclick="switchShopTab('products')">Sản phẩm</span><span class="tabs__item ${activeTab==='categories'?'active':''}" onclick="switchShopTab('categories')">Danh mục</span></div>${tabContent}</div>
    </div>`;

    document.getElementById('followBtn')?.addEventListener('click', () => { isFollowing=!isFollowing; followCount+=isFollowing?1:-1; render(); });
  }

  window.switchShopTab = (t) => { activeTab=t; render(); };
  render();
}
window.ShopViewPage = ShopViewPage;
