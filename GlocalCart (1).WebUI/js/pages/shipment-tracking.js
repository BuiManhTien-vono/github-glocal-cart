/* Shipment Tracking Page — ported from ShipmentTrackingScreen.tsx */
function ShipmentTrackingPage() {
  const app = document.getElementById('app');
  const data = [
    {title:'Đang giao hàng',desc:'Đơn hàng đang được shipper giao đến bạn.',time:'14:30 19-10-2026',active:true},
    {title:'Đã xuất kho phân loại',desc:'Đơn hàng đã rời kho phân loại TP.HCM.',time:'08:15 19-10-2026',active:false},
    {title:'Đã đến kho phân loại',desc:'Đơn hàng đã đến trạm trung chuyển khu vực.',time:'22:10 18-10-2026',active:false},
    {title:'Lấy hàng thành công',desc:'Đơn vị vận chuyển đã lấy hàng từ người bán.',time:'15:00 18-10-2026',active:false},
    {title:'Đơn hàng đã tạo',desc:'Người bán đang chuẩn bị đơn hàng của bạn.',time:'09:00 18-10-2026',active:false},
  ];

  app.innerHTML = `
    <div class="page fade-in">
      <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Thông tin vận chuyển</span><span class="header__spacer"></span></div>
      <div class="scroll-content" style="padding:12px">
        <div class="tracking-info"><i class="ion-ios-car" style="font-size:40px;color:var(--primary)"></i><div><p class="tracking-info__carrier">Giao Hàng Nhanh</p><p class="tracking-info__no">Mã vận đơn: <b>GHN20260011</b></p><span class="tracking-info__copy" onclick="showToast('Đã sao chép mã vận đơn','success')">SAO CHÉP</span></div></div>
        <div class="card" style="padding:0"><div class="timeline">${data.map((item,i)=>`
          <div class="timeline__item"><div class="timeline__track"><div class="timeline__dot ${item.active?'timeline__dot--active':''}"></div>${i<data.length-1?`<div class="timeline__line ${item.active?'timeline__line--active':''}"></div>`:''}</div><div class="timeline__content"><p class="timeline__title ${item.active?'timeline__title--active':''}">${item.title}</p><p class="timeline__desc">${item.desc}</p><span class="timeline__time">${item.time}</span></div></div>
        `).join('')}</div></div>
      </div>
    </div>
  `;
}
window.ShipmentTrackingPage = ShipmentTrackingPage;
