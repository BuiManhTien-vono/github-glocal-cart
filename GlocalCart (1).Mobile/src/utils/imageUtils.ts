import { Platform } from 'react-native';

/**
 * Base URL của API server (không có /api ở cuối)
 */
const API_BASE = Platform.OS === 'web'
  ? 'http://localhost:5100'
  : 'http://10.117.243.62:5100';

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
 * Resolve ảnh từ product object (ưu tiên ảnh DB → mediaUrl → null)
 */
export function resolveProductImage(product: {
  images?: { id?: number; imageUrl?: string; isMain?: boolean; hasImageData?: boolean }[];
  mediaUrl?: string | null;
}): string | null {
  // Ưu tiên mediaUrl (được cập nhật khi sửa sản phẩm)
  const mediaResolved = resolveProductImageUrl(product.mediaUrl);
  if (mediaResolved) return mediaResolved;

  // Fallback: ảnh từ danh sách ProductImages
  if (product.images?.length) {
    const mainImg = product.images.find(i => i.isMain) || product.images[0];
    const resolved = resolveProductImageUrl(mainImg.imageUrl);
    if (resolved) return resolved;
  }
  return null;
}
