/* Cart Page */
function CartPage() {
  const app = document.getElementById('app');
  const cartItems = [
    {id:'1',name:'MacBook Pro M2 2023',price:32000000,qty:1,img:'💻'},
    {id:'2',name:'Chuột không dây Logitech Master 3',price:2500000,qty:2,img:'🖱'},
  ];
  const total = cartItems.reduce((a,i)=>a+i.price*i.qty,0);

  app.innerHTML = `
    <div class="page fade-in" style="padding-bottom:70px">
      <div class="header"><span class="header__spacer"></span><span class="header__title">Giỏ Hàng (${cartItems.length})</span><span class="header__spacer"></span></div>
      <div class="scroll-content">
        ${cartItems.map(item=>`
          <div style="background:var(--white);padding:12px 16px;border-bottom:1px solid var(--border-light);display:flex;gap:12px">
            <div style="width:80px;height:80px;background:var(--background);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:32px">${item.img}</div>
            <div style="flex:1"><p style="font-size:14px;font-weight:500;margin-bottom:4px">${item.name}</p><p style="font-size:16px;font-weight:700;color:var(--primary)">₫${item.price.toLocaleString('vi-VN')}</p>
            <div style="display:flex;align-items:center;gap:12px;margin-top:8px"><button class="btn btn--outline btn--sm" style="padding:4px 10px">−</button><span>${item.qty}</span><button class="btn btn--outline btn--sm" style="padding:4px 10px">+</button><button style="margin-left:auto;color:var(--text-muted);font-size:18px"><i class="ion-ios-trash"></i></button></div></div>
          </div>
        `).join('')}
      </div>
      <div class="checkout-bottom">
        <div class="checkout-bottom__left"><span class="checkout-bottom__label">Tổng thanh toán</span><span class="checkout-bottom__price">₫${total.toLocaleString('vi-VN')}</span></div>
        <button class="checkout-bottom__btn" onclick="router.navigate('/checkout')">Mua Hàng (${cartItems.length})</button>
      </div>
    </div>
  `;
}
window.CartPage = CartPage;
