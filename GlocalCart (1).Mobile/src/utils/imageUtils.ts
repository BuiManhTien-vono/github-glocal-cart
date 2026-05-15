import { Platform } from 'react-native';
import { BASE_URL } from '../services/api/config';

/**
 * Base URL của API server (không có /api ở cuối)
 */
const API_BASE = BASE_URL.endsWith('/api') 
  ? BASE_URL.replace('/api', '') 
  : BASE_URL;

/**
 * Resolve ảnh sản phẩm thành URL đầy đủ có thể hiển thị.
 * Xử lý các trường hợp:
 * - Ảnh lưu trong DB (ImageUrl = "/api/products/images/{id}/data") → ghép base URL
 * - Ảnh upload file system (URL tuyệt đối hoặc tương đối) → ghép base URL nếu cần
 * - Placeholder → trả null
 * - URL đầy đủ (https://...) → giữ nguyên
 */
export function resolveProductImageUrl(
  imageUrl?: string | null,
  mediaUrl?: string | null,
): string | null {
  const url = imageUrl || mediaUrl;
  if (!url) return null;
  if (url.includes('placeholder')) return null;

  // Nếu là URL đầy đủ → giữ nguyên
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  // Nếu là đường dẫn tương đối (/api/..., /uploads/...) → ghép base
  if (url.startsWith('/')) return `${API_BASE}${url}`;

  return url;
}

/**
 * Resolve ảnh từ product object (ưu tiên mediaUrl -> imageUrls[0] -> images[0] -> null)
 */
export function resolveProductImage(product: {
  images?: { id?: number; imageUrl?: string; isMain?: boolean; hasImageData?: boolean }[];
  mediaUrl?: string | null;
  imageUrls?: string[];
}): string | null {
  // 1. Ưu tiên mediaUrl (thường là ảnh bìa được lưu trực tiếp)
  if (product.mediaUrl && !product.mediaUrl.includes('placeholder')) {
    const resolved = resolveProductImageUrl(product.mediaUrl);
    if (resolved) return resolved;
  }

  // 2. Thử lấy ảnh đầu tiên từ mảng imageUrls (dạng string[])
  if (product.imageUrls && product.imageUrls.length > 0) {
    const first = product.imageUrls.find(url => !url.includes('placeholder'));
    if (first) {
        const resolved = resolveProductImageUrl(first);
        if (resolved) return resolved;
    }
  }

  // 3. Fallback: ảnh từ danh sách ProductImages (dạng object[])
  if (product.images?.length) {
    const mainImg = product.images.find(i => i.isMain) || product.images[0];
    const resolved = resolveProductImageUrl(mainImg.imageUrl);
    if (resolved) return resolved;
  }

  return null;
}

/**
 * Lấy danh sách toàn bộ URL ảnh hợp lệ của sản phẩm
 */
export function resolveProductImageUrls(product: any): string[] {
    const urls: string[] = [];
    
    if (product.imageUrls && Array.isArray(product.imageUrls)) {
        product.imageUrls.forEach((u: string) => {
            const res = resolveProductImageUrl(u);
            if (res) urls.push(res);
        });
    }

    if (urls.length === 0 && product.mediaUrl) {
        const res = resolveProductImageUrl(product.mediaUrl);
        if (res) urls.push(res);
    }

    if (urls.length === 0 && product.images?.length) {
        product.images.forEach((img: any) => {
            const res = resolveProductImageUrl(img.imageUrl || img.url);
            if (res) urls.push(res);
        });
    }

    return urls;
}
