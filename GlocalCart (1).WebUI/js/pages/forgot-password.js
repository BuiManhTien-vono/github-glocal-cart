/* Forgot Password Page — ported from ForgotPasswordScreen.tsx */
function ForgotPasswordPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-page fade-in">
      <button class="auth-page__back" onclick="router.back()"><i class="ion-ios-arrow-back"></i></button>
      <div class="auth-page__content">
        <h1 class="auth-page__title">Quên mật khẩu?</h1>
        <p class="auth-page__subtitle">Đừng lo! Vui lòng nhập địa chỉ email liên kết với tài khoản của bạn để nhận mã khôi phục.</p>
        <form class="auth-page__form" id="forgotForm">
          <div class="input-group">
            <i class="ion-ios-mail"></i>
            <input type="email" id="forgotEmail" placeholder="Nhập địa chỉ Email" autocomplete="email" required />
          </div>
          <button type="submit" class="btn btn--primary btn--full btn--lg auth-page__submit">Gửi Yêu Cầu</button>
        </form>
      </div>
    </div>
  `;
  document.getElementById('forgotForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) return showToast('Vui lòng nhập email', 'error');
    showToast(`Đường dẫn khôi phục mật khẩu đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư.`, 'success');
    setTimeout(() => router.back(), 2000);
  });
}
window.ForgotPasswordPage = ForgotPasswordPage;
