/* Search Page — ported from SearchScreen.tsx */
const SEARCH_HISTORY_KEY = 'gc_search_history';
const HOT_SEARCHES = ['iPhone 15','Giày thể thao','Áo thun nam','Tai nghe bluetooth','Váy nữ','Sạc dự phòng'];

function SearchPage(params) {
  const app = document.getElementById('app');
  const initQuery = params?.q || '';
  app.innerHTML = `
    <div class="page page--white fade-in">
      <div class="search-bar">
        <button class="header__btn" onclick="router.back()"><i class="ion-ios-arrow-back" style="font-size:24px;color:var(--primary)"></i></button>
        <div class="search-bar__box">
          <i class="ion-ios-search" style="font-size:20px;color:var(--text-secondary)"></i>
          <input id="searchInput" placeholder="Glocal Cart Mall | Tìm gì cũng có..." value="${initQuery}" autofocus />
          <i class="ion-ios-close-circle" id="clearSearch" style="display:none;font-size:18px;color:var(--text-muted);cursor:pointer"></i>
        </div>
        <span class="search-bar__btn" id="searchBtn">Tìm</span>
      </div>
      <div class="scroll-content" id="searchContent"></div>
    </div>
  `;
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  let isSearching = false;
  const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');

  function renderDefault() {
    isSearching = false;
    const content = document.getElementById('searchContent');
    content.innerHTML = `
      ${history.length ? `<div class="section"><div class="section__header"><span style="font-size:14px;font-weight:600;color:var(--text-secondary);text-transform:uppercase">Lịch sử tìm kiếm</span><i class="ion-ios-trash" style="font-size:18px;color:var(--text-secondary);cursor:pointer" onclick="clearSearchHistory()"></i></div><div class="history-grid">${history.map(h=>`<span class="chip" onclick="doSearch('${h}')">${h}</span>`).join('')}</div></div>` : ''}
      <div class="section"><span style="font-size:14px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;display:block;margin-bottom:12px">Tìm kiếm phổ biến</span><div class="history-grid">${HOT_SEARCHES.map(h=>`<span class="chip" onclick="doSearch('${h}')">${h}</span>`).join('')}</div></div>
    `;
  }

  async function doSearch(query) {
    if (!query.trim()) return;
    input.value = query;
    clearBtn.style.display = 'block';
    isSearching = true;
    // Save to history
    const newH = [query, ...history.filter(h=>h!==query)].slice(0,10);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newH));
    const content = document.getElementById('searchContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div><span class="text-secondary">Đang tìm sản phẩm...</span></div>';
    try {
      const res = await API.get(`/products/search?name=${encodeURIComponent(query)}`);
      const products = res?.items || (Array.isArray(res) ? res : []);
      if (products.length === 0) {
        content.innerHTML = `<div class="empty-state" style="margin-top:40px"><i class="ion-ios-search"></i><span class="empty-state__text">Không tìm thấy sản phẩm nào cho "${query}"</span><button class="btn btn--outline-primary btn--sm" onclick="renderDefault()">Thử từ khóa khác</button></div>`;
      } else {
        content.innerHTML = `<div class="product-grid" style="padding:8px;background:#f5f5f5">${products.map(p=>{const img=p.images?.[0]?.imageUrl||'https://via.placeholder.com/150';return `<div class="product-card" onclick="router.navigate('/product/${p.id}')" style="cursor:pointer;background:var(--white);border-radius:8px;overflow:hidden"><img src="${img}" style="width:100%;height:140px;object-fit:cover" onerror="this.src='https://via.placeholder.com/150'" /><div style="padding:8px"><p style="font-size:13px;height:36px;overflow:hidden">${p.name}</p><p style="font-size:15px;font-weight:700;color:var(--primary);margin-top:4px">₫${(p.price||0).toLocaleString('vi-VN')}</p></div></div>`;}).join('')}</div>`;
      }
    } catch(e) {
      content.innerHTML = '<div class="empty-state"><i class="ion-ios-alert"></i><span class="empty-state__text">Lỗi khi tải kết quả</span></div>';
    }
  }

  window.doSearch = doSearch;
  window.clearSearchHistory = () => { localStorage.removeItem(SEARCH_HISTORY_KEY); history.length = 0; renderDefault(); };

  input.addEventListener('input', () => { clearBtn.style.display = input.value ? 'block' : 'none'; if (!input.value) renderDefault(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(input.value); });
  clearBtn.addEventListener('click', () => { input.value = ''; clearBtn.style.display = 'none'; renderDefault(); input.focus(); });
  document.getElementById('searchBtn').addEventListener('click', () => doSearch(input.value));

  if (initQuery) doSearch(initQuery); else renderDefault();
}
window.SearchPage = SearchPage;
