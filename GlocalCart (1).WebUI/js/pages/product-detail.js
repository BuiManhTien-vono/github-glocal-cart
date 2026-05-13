/* Product Detail Page */
function ProductDetailPage(params) {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="page fade-in"><div class="loading"><div class="spinner"></div><span class="text-secondary">Đang tải sản phẩm...</span></div></div>';
  loadProductDetail(params?.id || 1);
}

async function loadProductDetail(id) {
  const app = document.getElementById('app');
  let product;
  try { product = await API.get(`/products/${id}`); } catch(e) {
    app.innerHTML = '<div class="page"><div class="empty-state"><i class="ion-ios-alert"></i><span class="empty-state__text">Không tìm thấy sản phẩm</span><button class="btn btn--primary btn--sm" onclick="router.back()">Quay lại</button></div></div>';
    return;
  }
  const imgs = product.images?.map(i=>i.imageUrl) || ['https://via.placeholder.com/400'];
  app.innerHTML = `
    <div class="page fade-in">
      <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">${product.name||'Chi tiết'}</span><button class="header__btn" onclick="router.navigate('/cart')"><i class="ion-ios-cart"></i></button></div>
      <div class="scroll-content">
        <div style="position:relative;background:#f5f5f5"><img src="${imgs[0]}" style="width:100%;height:320px;object-fit:contain" onerror="this.src='https://via.placeholder.com/400'" />
        ${imgs.length>1?`<div style="display:flex;gap:6px;padding:8px 12px;overflow-x:auto">${imgs.map((img,i)=>`<img src="${img}" style="width:56px;height:56px;border-radius:6px;object-fit:cover;border:2px solid ${i===0?'var(--primary)':'transparent'};cursor:pointer" onerror="this.src='https://via.placeholder.com/60'" />`).join('')}</div>`:''}</div>
        <div style="background:var(--white);padding:16px"><p style="font-size:22px;font-weight:800;color:var(--primary);margin-bottom:8px">₫${(product.price||0).toLocaleString('vi-VN')}</p><h1 style="font-size:16px;font-weight:500;color:var(--text);line-height:1.5;margin-bottom:8px">${product.name}</h1>
        <div style="display:flex;gap:16px;font-size:13px;color:var(--text-secondary)"><span><i class="ion-ios-star" style="color:#F59E0B"></i> 4.8</span><span>Đã bán 1.2k</span></div></div>
        <div class="divider"></div>
        <div style="background:var(--white);padding:16px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;cursor:pointer" onclick="router.navigate('/shop-view')"><img src="https://ui-avatars.com/api/?name=GC&background=FF6B35&color=fff&size=40" style="width:40px;height:40px;border-radius:20px" /><div><p style="font-size:14px;font-weight:600">Glocal Cart Official Store</p><p style="font-size:12px;color:var(--text-secondary)">Online • 12.5k Theo dõi</p></div><button class="btn btn--outline-primary btn--sm" style="margin-left:auto">Xem Shop</button></div></div>
        <div class="divider"></div>
        <div style="background:var(--white);padding:16px"><h3 style="font-size:16px;font-weight:700;margin-bottom:12px">Mô tả sản phẩm</h3><p style="font-size:14px;color:var(--text-secondary);line-height:1.6">${product.description||'Chưa có mô tả chi tiết cho sản phẩm này.'}</p></div>
      </div>
      <div class="bottom-bar" style="gap:0">
        <button style="flex:1;display:flex;flex-direction:column;align-items:center;padding:12px;color:var(--primary);gap:2px;border-right:1px solid var(--border-light)" onclick="router.navigate('/shop-view')"><i class="ion-ios-chatbubbles" style="font-size:22px"></i><span style="font-size:11px">Chat</span></button>
        <button style="flex:2;background:var(--primary);color:white;font-weight:700;font-size:15px;padding:16px" onclick="showToast('Đã thêm vào giỏ hàng!','success')"><i class="ion-ios-cart"></i> Thêm Giỏ Hàng</button>
        <button style="flex:2;background:var(--primary-dark);color:white;font-weight:700;font-size:15px;padding:16px" onclick="router.navigate('/checkout')">Mua Ngay</button>
      </div>
    </div>
  `;
}
window.ProductDetailPage = ProductDetailPage;
