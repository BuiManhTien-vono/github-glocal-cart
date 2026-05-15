export const API_HOST = 'http://localhost:5100';
const API_BASE_URL = `${API_HOST}/api`;

import productsData from '../data/products.json';

export const getFileUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_HOST}${path.startsWith('/') ? '' : '/'}${path}`;
};

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  availableItemCount: number;
  categoryId: number;
  categoryName: string;
  sellerId: number;
  sellerName: string;
  images: { id: number; imageUrl: string }[];
  rating?: number;
  soldCount?: string;
  oldPrice?: number;
}

const getLocalProducts = (): Product[] => {
  return (productsData as any[]).map((p, index) => ({
    id: index + 1,
    name: p.Name,
    description: p.Description,
    price: p.Price,
    oldPrice: p.OldPrice,
    availableItemCount: p.AvailableItemCount,
    categoryId: p.CategoryId,
    categoryName: "Danh mục",
    sellerId: 1,
    sellerName: "Glocal Store",
    images: [{ id: index + 1, imageUrl: p.ImageUrl.replace('Global_Cart/GlocalCart (1).API/wwwroot/', '/') }],
    rating: 5,
    soldCount: "100+"
  }));
};

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  const token = typeof window !== 'undefined' ? localStorage.getItem('glocal_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper to unwrap ApiResponse from the backend
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${res.status}`);
  }
  const result = await res.json();
  // Backend returns { success, message, data, statusCode }
  return result.data;
};

export const api = {
  products: {
    getAll: async (search: string = '', categoryId?: number, sellerId?: number, categoryIds?: number[], minPrice?: number, maxPrice?: number): Promise<Product[]> => {
      const filterLocal = (products: Product[]) => {
        let filtered = products;
        if (search) {
          const lowerSearch = search.toLowerCase();
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(lowerSearch) ||
            p.description.toLowerCase().includes(lowerSearch)
          );
        }
        if (categoryId) {
          filtered = filtered.filter(p => p.categoryId === categoryId);
        }
        if (categoryIds && categoryIds.length > 0) {
          filtered = filtered.filter(p => categoryIds.includes(p.categoryId));
        }
        if (minPrice !== undefined) {
          filtered = filtered.filter(p => p.price >= minPrice);
        }
        if (maxPrice !== undefined) {
          filtered = filtered.filter(p => p.price <= maxPrice);
        }
        return filtered;
      };

      try {
        const url = new URL(`${API_BASE_URL}/products`);
        if (search) url.searchParams.append('name', search);
        if (categoryId) url.searchParams.append('categoryId', categoryId.toString());
        if (sellerId) url.searchParams.append('sellerId', sellerId.toString());
        if (minPrice !== undefined) url.searchParams.append('minPrice', minPrice.toString());
        if (maxPrice !== undefined) url.searchParams.append('maxPrice', maxPrice.toString());
        url.searchParams.append('page', '1');
        url.searchParams.append('pageSize', '50');

        const res = await fetch(url.toString(), { cache: 'no-store' });
        const data = await handleResponse(res);
        const items: Product[] = data?.items || data || [];
        if (categoryIds && categoryIds.length > 0) {
          return items.filter(p => categoryIds.includes(p.categoryId));
        }
        return items;
      } catch (error) {
        console.error('API fetch failed, falling back to local data:', error);
        return filterLocal(getLocalProducts());
      }
    },

    getById: async (id: number): Promise<Product | null> => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`, { cache: 'no-store' });
        return await handleResponse(res);
      } catch (error) {
        console.error(`Failed to fetch product ${id}, falling back to local data:`, error);
        const products = getLocalProducts();
        return products.find(p => p.id === id) || null;
      }
    }
  },
  
  categories: {
    getAll: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`, { cache: 'no-store' });
        return await handleResponse(res);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }

      // Fallback categories
      return [
        { id: 6, name: "Công Nghệ" },
        { id: 9, name: "Thời Trang" },
        { id: 12, name: "Gia Dụng" },
        { id: 13, name: "Nội Thất" },
        { id: 1, name: "Làm Đẹp" },
        { id: 2, name: "Thể Thao" },
        { id: 8, name: "Điện Tử" },
        { id: 10, name: "Trang Sức" }
      ];
    }
  },

  auth: {
    login: async (credentials: any) => {
      const res = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return await handleResponse(res);
    }
  },

  users: {
    getProfile: async () => {
      const res = await fetch(`${API_BASE_URL}/Users/profile`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    },
    updateProfile: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/Users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    },
    changePassword: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/Users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    },
    getAddresses: async () => {
      const res = await fetch(`${API_BASE_URL}/Users/addresses`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    createAddress: async (addressData: any) => {
      const res = await fetch(`${API_BASE_URL}/Users/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(addressData)
      });
      return await handleResponse(res);
    },
    activateSeller: async () => {
      const res = await fetch(`${API_BASE_URL}/Users/activate-seller`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    getCoinHistory: async () => {
      const res = await fetch(`${API_BASE_URL}/Users/coins/history`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    }
  },

  orders: {
    getMyOrders: async (page: number = 1) => {
      const res = await fetch(`${API_BASE_URL}/Orders?page=${page}`, { headers: getAuthHeaders() });
      const data = await handleResponse(res);
      return data?.items || data || [];
    },
    getOrderLogs: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/Orders/${id}/logs`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    },
    cancelOrder: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/Orders/${id}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    create: async (orderData: any) => {
      const res = await fetch(`${API_BASE_URL}/Orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(orderData)
      });
      return await handleResponse(res);
    }
  },

  cart: {
    get: async () => {
      const res = await fetch(`${API_BASE_URL}/Cart`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    },
    addItem: async (productId: number, quantity: number) => {
      const res = await fetch(`${API_BASE_URL}/Cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ productId, quantity })
      });
      return await handleResponse(res);
    },
    updateItem: async (itemId: number, quantity: number) => {
      const res = await fetch(`${API_BASE_URL}/Cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ quantity })
      });
      return await handleResponse(res);
    },
    removeItem: async (itemId: number) => {
      const res = await fetch(`${API_BASE_URL}/Cart/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    clear: async () => {
      const res = await fetch(`${API_BASE_URL}/Cart/clear`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    sync: async (items: { productId: number, quantity: number }[]) => {
      const res = await fetch(`${API_BASE_URL}/Cart/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ items })
      });
      return await handleResponse(res);
    }
  },

  payments: {
    initiate: async (orderId: number) => {
      try {
        const res = await fetch(`${API_BASE_URL}/Payments/${orderId}/initiate`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
        return await handleResponse(res);
      } catch (error) {
        console.error('API payment initiation failed, using mock QR for demo...', error);
      }

      // Mock QR for testing
      return {
        vietQrUrl: `https://img.vietqr.io/image/970422-123456789-compact2.jpg?amount=1030000&addInfo=Order%20${orderId}`
      };
    },
    confirmTransfer: async (orderId: number) => {
      const res = await fetch(`${API_BASE_URL}/Payments/${orderId}/confirm-transfer`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    getStatus: async (orderId: number) => {
      const res = await fetch(`${API_BASE_URL}/Payments/${orderId}/status`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    }
  },

  admin: {
    getDashboard: async () => {
      const res = await fetch(`${API_BASE_URL}/Admin/dashboard`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    },
    getUsers: async (page: number = 1) => {
      const res = await fetch(`${API_BASE_URL}/Admin/users?page=${page}`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    },
    getOrders: async (page: number = 1) => {
      const res = await fetch(`${API_BASE_URL}/Admin/orders?page=${page}`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    },
    updateUserStatus: async (id: number, status: string) => {
      const res = await fetch(`${API_BASE_URL}/Admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status })
      });
      return await handleResponse(res);
    },
    updateOrderStatus: async (id: number, status: string) => {
      const res = await fetch(`${API_BASE_URL}/Admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status })
      });
      return await handleResponse(res);
    },
    toggleSeller: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/Admin/users/${id}/seller`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    toggleProductLock: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/Admin/products/${id}/lock`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    createCategory: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/Admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    },
    updateCategory: async (id: number, data: any) => {
      const res = await fetch(`${API_BASE_URL}/Admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    },
    deleteCategory: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/Admin/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    }
  },

  follows: {
    follow: async (sellerId: number) => {
      const res = await fetch(`${API_BASE_URL}/Follows/${sellerId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    unfollow: async (sellerId: number) => {
      const res = await fetch(`${API_BASE_URL}/Follows/${sellerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    getStatus: async (sellerId: number) => {
      const res = await fetch(`${API_BASE_URL}/Follows/${sellerId}/status`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    },
    getCount: async (sellerId: number) => {
      const res = await fetch(`${API_BASE_URL}/Follows/${sellerId}/count`);
      return await handleResponse(res);
    }
  }
};
