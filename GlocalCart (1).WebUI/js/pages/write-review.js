/* Write Review Page — ported from WriteReviewScreen.tsx */
function WriteReviewPage(params) {
  const app = document.getElementById('app');
  const productName = params?.productName || 'MacBook Pro M2 2023 - Gray 512GB';
  let rating = 0;
  const hints = ['','Tệ','Không hài lòng','Bình thường','Hài lòng','Tuyệt vời'];

  function renderStars() {
    return [1,2,3,4,5].map(s=>`<i class="ion-ios-star${s<=rating?'':'-outline'} ${s<=rating?'active':''}" style="font-size:44px;color:${s<=rating?'var(--warning)':'var(--disabled)'};cursor:pointer" onclick="setReviewRating(${s})"></i>`).join('');
  }

  function render() {
    app.innerHTML = `
      <div class="page fade-in">
        <div class="header"><button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button><span class="header__title">Đánh giá sản phẩm</span><span class="header__spacer"></span></div>
        <div class="scroll-content" style="padding:var(--sp-md)">
          <div class="card" style="display:flex;align-items:center;padding:12px;margin-bottom:20px"><div style="width:48px;height:48px;background:var(--border-light);border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:12px;font-size:24px">💻</div><p style="flex:1;font-size:14px;font-weight:600;line-height:1.4">${productName}</p></div>
          <div class="card" style="text-align:center;padding:16px;margin-bottom:24px"><p style="font-size:16px;font-weight:700;margin-bottom:16px">Chất lượng sản phẩm tuyệt vời?</p><div class="review-stars" id="starsContainer">${renderStars()}</div><p class="review-hint" id="ratingHint">${rating?hints[rating]:'Vui lòng chọn sao'}</p></div>
          <div class="card" style="padding:12px"><textarea class="review-textarea" id="reviewText" placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé."></textarea><button class="add-media-btn"><i class="ion-ios-camera" style="font-size:20px"></i> Thêm Hình/Video</button></div>
        </div>
        <div class="bottom-bar"><button class="btn btn--primary btn--full btn--lg" onclick="submitReview()">Gửi Đánh Giá</button></div>
      </div>
    `;
  }

  window.setReviewRating = (r) => { rating=r; render(); };
  window.submitReview = () => {
    if (rating===0) return showToast('Vui lòng chọn số sao đánh giá!','error');
    showToast('✅ Đã gửi đánh giá thành công. Cảm ơn phản hồi của bạn!','success');
    setTimeout(()=>router.back(),1500);
  };
  render();
}
window.WriteReviewPage = WriteReviewPage;
