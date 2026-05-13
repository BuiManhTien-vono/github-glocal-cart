/* ═══════════════════════════════════════════════════════
   GlocalCart SPA Router — Hash-based routing
   ═══════════════════════════════════════════════════════ */

class Router {
  constructor() {
    this.routes = {};
    this.currentPage = null;
    this.appEl = document.getElementById('app');
    window.addEventListener('hashchange', () => this.resolve());
  }

  /** Register a route */
  register(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  /** Navigate to a route */
  navigate(path, params = {}) {
    const query = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    window.location.hash = '#' + path + query;
  }

  /** Go back */
  back() {
    window.history.back();
  }

  /** Resolve the current hash */
  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryString || ''));

    // Try exact match first
    if (this.routes[path]) {
      this._render(path, params);
      return;
    }

    // Try parameterized routes (e.g. /product/:id)
    for (const routePath of Object.keys(this.routes)) {
      const match = this._matchRoute(routePath, path);
      if (match) {
        this._render(routePath, { ...match, ...params });
        return;
      }
    }

    // 404 — redirect to home or login
    if (window.Auth && window.Auth.isLoggedIn()) {
      this.navigate('/');
    } else {
      this.navigate('/login');
    }
  }

  /** Match a parameterized route like /product/:id */
  _matchRoute(routePattern, actualPath) {
    const routeParts = routePattern.split('/');
    const pathParts = actualPath.split('/');

    if (routeParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (routeParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  /** Render a page */
  _render(path, params) {
    const handler = this.routes[path];
    if (!handler) return;

    // Clear content (keep tab bar if present)
    const tabBar = this.appEl.querySelector('.tab-bar');
    this.appEl.innerHTML = '';

    // Call handler
    const content = handler(params);
    if (typeof content === 'string') {
      this.appEl.innerHTML = content;
    }

    // Re-add tab bar for main pages
    const mainPages = ['/', '/cart', '/notifications', '/profile'];
    if (mainPages.includes(path) || path === '/') {
      this._renderTabBar(path);
    }

    // Scroll to top
    window.scrollTo(0, 0);

    // Add fade-in
    this.appEl.firstElementChild?.classList.add('fade-in');
  }

  /** Render bottom tab bar */
  _renderTabBar(activePath) {
    const tabs = [
      { path: '/', icon: 'ion-ios-home', activeIcon: 'ion-ios-home', label: 'Trang chủ' },
      { path: '/cart', icon: 'ion-ios-cart', activeIcon: 'ion-ios-cart', label: 'Giỏ hàng' },
      { path: '/notifications', icon: 'ion-ios-notifications-outline', activeIcon: 'ion-ios-notifications', label: 'Thông báo' },
      { path: '/profile', icon: 'ion-ios-person-outline', activeIcon: 'ion-ios-person', label: 'Tôi' },
    ];

    const tabBarEl = document.createElement('div');
    tabBarEl.className = 'tab-bar';
    tabBarEl.innerHTML = tabs.map(tab => `
      <a class="tab-bar__item ${activePath === tab.path ? 'active' : ''}"
         href="#${tab.path}" onclick="event.preventDefault(); router.navigate('${tab.path}')">
        <i class="${activePath === tab.path ? tab.activeIcon : tab.icon}"></i>
        <span>${tab.label}</span>
      </a>
    `).join('');

    this.appEl.appendChild(tabBarEl);
  }
}

// Global instance
window.router = new Router();
