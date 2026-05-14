/* Checkout Page — ported from CheckoutScreen.tsx */
function CheckoutPage() {
  const app = document.getElementById('app');
  const items = [{id:'1',name:'MacBook Pro M2 2023',price:32000000,qty:1,img:'💻'},{id:'2',name:'Chuột không dây Logitech Master 3',price:2500000,qty:2,img:'🖱'}];
  const sub = items.reduce((a,i)=>a+i.price*i.qty,0);
  const ship = 35000;
  const total = sub + ship;

  app.innerHTML = `
    <div class="page fade-in">
      <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Thanh Toán</span><span class="header__spacer"></span></div>
      <div class="scroll-content">
        <div class="checkout-section" onclick="router.navigate('/addresses')" style="cursor:pointer;position:relative">
          <div class="checkout-section__header"><i class="ion-ios-pin" style="color:var(--primary);font-size:20px"></i><span class="checkout-section__title">Địa chỉ nhận hàng</span></div>
          <div class="address-box"><p class="address-box__name">Nguyễn Văn A | 0901234567</p><p class="address-box__text">123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</p></div>
          <i class="ion-ios-arrow-forward" style="position:absolute;right:16px;top:50%;margin-top:-10px;color:var(--text-muted)"></i>
        </div>
        <div class="address-options"><label class="address-option active" id="opt-default" onclick="setAddrMode('default')"><i class="ion-ios-radio-button-on" style="color:var(--primary)"></i> Đặt làm mặc định</label><label class="address-option" id="opt-once" onclick="setAddrMode('once')"><i class="ion-ios-radio-button-off" style="color:var(--text-muted)"></i> Chỉ dùng lần này</label></div>
        <div class="divider--stripe"></div>
        <div class="checkout-section"><span class="checkout-section__title">Sản phẩm (${items.length})</span>${items.map(i=>`<div class="product-row"><div class="product-row__img">${i.img}</div><div class="product-row__info"><span class="product-row__name">${i.name}</span><div class="product-row__price-row"><span class="product-row__price">₫${i.price.toLocaleString('vi-VN')}</span><span class="product-row__qty">x${i.qty}</span></div></div></div>`).join('')}</div>
        <div class="checkout-section"><span class="checkout-section__title">Phương thức thanh toán</span>
          <div class="payment-method active" id="pay-cod" onclick="setPayment('cod')"><i class="ion-ios-cash"></i><span class="payment-method__label">Thanh toán khi nhận hàng (COD)</span><i class="ion-ios-checkmark-circle payment-method__check"></i></div>
          <div class="payment-method" id="pay-card" onclick="setPayment('card')"><i class="ion-ios-card"></i><span class="payment-method__label">Thẻ Tín Dụng/Ghi Nợ</span></div>
        </div>
        <div class="checkout-section"><div class="summary-row"><span class="summary-row__label">Tổng tiền hàng</span><span class="summary-row__value">₫${sub.toLocaleString('vi-VN')}</span></div><div class="summary-row"><span class="summary-row__label">Phí vận chuyển</span><span class="summary-row__value">₫${ship.toLocaleString('vi-VN')}</span></div><div class="summary-row summary-total"><span class="summary-row__label">Tổng thanh toán</span><span class="summary-row__value">₫${total.toLocaleString('vi-VN')}</span></div></div>
      </div>
      <div class="checkout-bottom"><div class="checkout-bottom__left"><span class="checkout-bottom__label">Tổng thanh toán</span><span class="checkout-bottom__price">₫${total.toLocaleString('vi-VN')}</span></div><button class="checkout-bottom__btn" onclick="placeOrder()">Đặt Hàng</button></div>
    </div>
  `;

  window.setPayment = (m) => {
    document.querySelectorAll('.payment-method').forEach(el=>{el.classList.remove('active');el.querySelector('.payment-method__check')?.remove();});
    const el=document.getElementById('pay-'+m);el.classList.add('active');
    const chk=document.createElement('i');chk.className='ion-ios-checkmark-circle payment-method__check';el.appendChild(chk);
  };
  window.setAddrMode = (m) => {
    ['default','once'].forEach(k=>{const el=document.getElementById('opt-'+k);el.classList.toggle('active',k===m);el.querySelector('i').className=k===m?'ion-ios-radio-button-on':'ion-ios-radio-button-off';el.querySelector('i').style.color=k===m?'var(--primary)':'var(--text-muted)';});
  };
  window.placeOrder = () => { showToast('✅ Đặt hàng thành công! Đơn hàng đang được xử lý.','success'); setTimeout(()=>router.navigate('/'),1500); };
}
window.CheckoutPage = CheckoutPage;
