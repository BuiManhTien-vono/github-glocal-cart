/* ═══════════════════════════════════════════════════════
   GlocalCart API Client — Ported from apiClient.ts
   ═══════════════════════════════════════════════════════ */

const API = {
  BASE_URL: 'http://localhost:5100/api',

  /** Get auth token */
  getToken() {
    return localStorage.getItem('gc_token');
  },

  /** Build headers */
  _headers() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  /** Unwrap API response { success, data, message } */
  async _unwrap(response) {
    if (response.status === 401) {
      // Token expired — logout
      Auth.logout();
      router.navigate('/login');
      throw new Error('Phiên đăng nhập đã hết hạn');
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = json?.message || `HTTP ${response.status}`;
      throw new Error(msg);
    }

    // Envelope pattern: { success, data, message, statusCode }
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data;
    }
    return json;
  },

  /** GET */
  async get(path) {
    const res = await fetch(this.BASE_URL + path, {
      method: 'GET',
      headers: this._headers(),
    });
    return this._unwrap(res);
  },

  /** POST */
  async post(path, body = {}) {
    const res = await fetch(this.BASE_URL + path, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    return this._unwrap(res);
  },

  /** PUT */
  async put(path, body = {}) {
    const res = await fetch(this.BASE_URL + path, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    return this._unwrap(res);
  },

  /** DELETE */
  async delete(path) {
    const res = await fetch(this.BASE_URL + path, {
      method: 'DELETE',
      headers: this._headers(),
    });
    return this._unwrap(res);
  },
};

window.API = API;
