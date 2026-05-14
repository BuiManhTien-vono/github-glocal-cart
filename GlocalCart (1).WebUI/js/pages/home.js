/* Home Page */
function HomePage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page fade-in" style="padding-bottom:70px">
      <div style="background:var(--primary);padding:12px 16px;display:flex;align-items:center;gap:8px">
        <div style="flex:1;display:flex;align-items:center;background:rgba(255,255,255,0.2);border-radius:8px;padding:0 12px;height:40px;gap:8px;cursor:pointer" onclick="router.navigate('/search')">
          <i class="ion-ios-search" style="color:rgba(255,255,255,0.7);font-size:18px"></i>
          <span style="color:rgba(255,255,255,0.7);font-size:14px">Tìm kiếm sản phẩm...</span>
        </div>
        <i class="ion-ios-cart" style="color:white;font-size:24px;cursor:pointer" onclick="router.navigate('/cart')"></i>
        <i class="ion-ios-chatbubbles" style="color:white;font-size:24px"></i>
      </div>
      <div id="homeContent"><div class="loading"><div class="spinner"></div><span class="text-secondary">Đang tải...</span></div></div>
    </div>
  `;
  loadHomeContent();
}

async function loadHomeContent() {
  const container = document.getElementById('homeContent');
  let products = [];
  try {
    const res = await API.get('/products');
    products = res?.items || (Array.isArray(res) ? res : []);
  } catch(e) { console.warn('Home fetch error:', e); }

  const categories = [
    {name:'Điện thoại',icon:'ion-ios-phone-portrait'},{name:'Laptop',icon:'ion-ios-laptop'},
    {name:'Thời trang',icon:'ion-ios-shirt'},{name:'Đồ gia dụng',icon:'ion-ios-home'},
    {name:'Mỹ phẩm',icon:'ion-ios-color-palette'},{name:'Sách',icon:'ion-ios-book'},
    {name:'Giày dép',icon:'ion-ios-walk'},{name:'Xem thêm',icon:'ion-ios-apps'},
  ];

  const catHTML = categories.map(c => `
    <div style="width:25%;text-align:center;padding:12px 4px;cursor:pointer" onclick="router.navigate('/search',{q:'${c.name}'})">
      <div style="width:44px;height:44px;border-radius:22px;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;margin:0 auto 6px"><i class="${c.icon}" style="font-size:22px;color:var(--primary)"></i></div>
      <span style="font-size:12px;color:var(--text)">${c.name}</span>
    </div>
  `).join('');

  const productsHTML = products.slice(0,10).map(p => {
    const img = p.images?.[0]?.imageUrl || 'https://via.placeholder.com/150';
    return `<div class="product-card" onclick="router.navigate('/product/${p.id}')" style="cursor:pointer">
      <img src="${img}" style="width:100%;height:150px;object-fit:cover;border-radius:8px 8px 0 0" onerror="this.src='https://via.placeholder.com/150'" />
      <div style="padding:8px"><p style="font-size:13px;color:var(--text);height:36px;overflow:hidden">${p.name}</p>
      <p style="font-size:15px;font-weight:700;color:var(--primary);margin-top:4px">₫${(p.price||0).toLocaleString('vi-VN')}</p></div></div>`;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;background:var(--white);padding:8px 0">${catHTML}</div>
    <div class="divider"></div>
    <div class="section"><div class="section__header"><div class="flash-title-row"><i class="ion-ios-flash" style="color:#ee4d2d;font-size:20px"></i><span class="flash-title">FLASH SALE</span><div class="timer-row"><span class="timer-box">02</span><span class="timer-sep">:</span><span class="timer-box">45</span><span class="timer-sep">:</span><span class="timer-box">30</span></div></div><span class="section__see-all">Xem tất cả ›</span></div>
      <div class="h-scroll">${products.slice(0,6).map((p,i) => {const disc=15+i*5;const img=p.images?.[0]?.imageUrl||'https://via.placeholder.com/120';return `<div class="flash-card" onclick="router.navigate('/product/${p.id}')"><div class="flash-card__img-wrap"><img class="flash-card__img" src="${img}" onerror="this.src='https://via.placeholder.com/120'" /><div class="flash-card__discount">-${disc}%</div></div><div class="flash-card__price">₫${Math.round(p.price*(1-disc/100)).toLocaleString('vi-VN')}</div><div class="sold-bar"><div class="sold-bar__fill" style="width:${30+i*12}%"></div><span class="sold-bar__text">Đã bán ${30+i*12}%</span></div></div>`;}).join('')}</div>
    </div>
    <div class="divider"></div>
    <div class="section"><div class="section__header"><span class="section__title">Gợi ý hôm nay</span></div><div class="product-grid">${productsHTML}</div></div>
  `;
}
window.HomePage = HomePage;
