/* Seller Flash Sale Page */
function SellerFlashSalePage() {
  const app = document.getElementById('app');
  const items = [
    {id:1,name:'iPhone 15 Pro Max',original:29990000,sale:25490000,active:true},
    {id:2,name:'Tai nghe AirPods Pro 2',original:5490000,sale:4490000,active:true},
    {id:3,name:'Ốp lưng MagSafe',original:990000,sale:790000,active:false},
  ];

  function render() {
    app.innerHTML = `
      <div class="page fade-in">
        <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Cài đặt Flash Sale</span><span class="header__spacer"></span></div>
        <div style="background:linear-gradient(135deg,#ee4d2d,#ff6633);padding:16px;color:white;display:flex;align-items:center;gap:12px"><i class="ion-ios-flash" style="font-size:32px"></i><div><p style="font-size:16px;font-weight:700">Flash Sale đang diễn ra</p><p style="font-size:13px;opacity:0.8">${items.filter(i=>i.active).length} sản phẩm đang giảm giá</p></div></div>
        <div class="scroll-content">${items.map(i=>`
          <div class="seller-flash-card"><img class="seller-flash-card__img" src="https://via.placeholder.com/60" /><div class="seller-flash-card__info"><p class="seller-flash-card__name">${i.name}</p><div class="seller-flash-card__prices"><span class="seller-flash-card__original">₫${i.original.toLocaleString('vi-VN')}</span><span class="seller-flash-card__sale">₫${i.sale.toLocaleString('vi-VN')}</span></div></div><div class="toggle-switch ${i.active?'active':''}" onclick="this.classList.toggle('active')"><div class="toggle-switch__knob"></div></div></div>
        `).join('')}</div>
      </div>
    `;
  }
  render();
}
window.SellerFlashSalePage = SellerFlashSalePage;
