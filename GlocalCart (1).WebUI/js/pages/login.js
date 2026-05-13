/* Login Page */
function LoginPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-page fade-in">
      <div class="auth-page__content">
        <div class="auth-page__logo"><span>GC</span></div>
        <h1 class="auth-page__title">Chào mừng trở lại!</h1>
        <p class="auth-page__subtitle">Đăng nhập để tiếp tục mua sắm trên GlocalCart</p>
        <form class="auth-page__form" id="loginForm">
          <div class="input-group">
            <i class="ion-ios-person"></i>
            <input type="text" id="loginId" placeholder="Email hoặc Tên đăng nhập" autocomplete="username" />
          </div>
          <div class="input-group">
            <i class="ion-ios-lock"></i>
            <input type="password" id="loginPw" placeholder="Mật khẩu" autocomplete="current-password" />
            <i class="ion-ios-eye toggle-pw" onclick="togglePw(this)"></i>
          </div>
          <a class="auth-page__forgot-link" onclick="router.navigate('/forgot-password')">Quên mật khẩu?</a>
          <button type="submit" class="btn btn--primary btn--full btn--lg auth-page__submit" id="loginBtn">Đăng Nhập</button>
        </form>
        <div class="auth-page__divider">hoặc tiếp tục với</div>
        <div class="auth-page__social-row">
          <button class="auth-page__social-btn">G</button>
          <button class="auth-page__social-btn">f</button>
          <button class="auth-page__social-btn">🍎</button>
        </div>
      </div>
      <div class="auth-page__footer">Chưa có tài khoản? <a onclick="router.navigate('/register')">Đăng ký ngay</a></div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const id = document.getElementById('loginId').value.trim();
    const pw = document.getElementById('loginPw').value;
    if (!id || !pw) return showToast('Vui lòng nhập đầy đủ thông tin', 'error');
    btn.textContent = 'Đang đăng nhập...';
    btn.classList.add('btn--disabled');
    try {
      await Auth.login(id, pw);
      showToast('Đăng nhập thành công!', 'success');
      setTimeout(() => router.navigate('/'), 500);
    } catch (err) {
      showToast(err.message || 'Đăng nhập thất bại', 'error');
      btn.textContent = 'Đăng Nhập';
      btn.classList.remove('btn--disabled');
    }
  });
}

function togglePw(el) {
  const input = el.previousElementSibling;
  if (input.type === 'password') { input.type = 'text'; el.className = 'ion-ios-eye-off toggle-pw'; }
  else { input.type = 'password'; el.className = 'ion-ios-eye toggle-pw'; }
}

function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

window.LoginPage = LoginPage;
window.togglePw = togglePw;
window.showToast = showToast;
