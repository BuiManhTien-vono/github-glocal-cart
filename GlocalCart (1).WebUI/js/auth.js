/* ═══════════════════════════════════════════════════════
   GlocalCart Auth Manager — Ported from AuthContext.tsx
   ═══════════════════════════════════════════════════════ */

const Auth = {
  TOKEN_KEY: 'gc_token',
  USER_KEY: 'gc_user',

  /** Check if user is logged in */
  isLoggedIn() {
    return !!localStorage.getItem(this.TOKEN_KEY);
  },

  /** Get stored user profile */
  getUser() {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /** Get user role */
  getRole() {
    const user = this.getUser();
    return user?.role || 'Member';
  },

  /** Login — store token + user */
  async login(identifier, password) {
    const data = await API.post('/auth/login', {
      emailOrUserName: identifier,
      password,
    });

    if (data?.token) {
      localStorage.setItem(this.TOKEN_KEY, data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user || data));
      return data;
    }
    throw new Error('Đăng nhập thất bại');
  },

  /** Register */
  async register(payload) {
    const data = await API.post('/auth/register', payload);
    if (data?.token) {
      localStorage.setItem(this.TOKEN_KEY, data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user || data));
    }
    return data;
  },

  /** Logout */
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  /** Require auth — redirects to login if not authenticated */
  requireAuth() {
    if (!this.isLoggedIn()) {
      router.navigate('/login');
      return false;
    }
    return true;
  },
};

window.Auth = Auth;
