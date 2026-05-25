import { Ionicons } from '@expo/vector-icons';

export type CategoryIconName = keyof typeof Ionicons.glyphMap;

const normalize = (value?: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export function getCategoryIcon(name?: string, fallback?: string): CategoryIconName {
  const value = normalize(name);
  const explicit = fallback as CategoryIconName | undefined;

  if (explicit && explicit in Ionicons.glyphMap) return explicit;
  if (value.includes('dien thoai') || value.includes('phone')) return 'phone-portrait-outline';
  if (value.includes('laptop') || value.includes('may tinh') || value.includes('computer')) return 'laptop-outline';
  if (value.includes('dien tu') || value.includes('cong nghe') || value.includes('tech')) return 'hardware-chip-outline';
  if (value.includes('thoi trang') || value.includes('ao') || value.includes('quan') || value.includes('giay')) return 'shirt-outline';
  if (value.includes('lam dep') || value.includes('my pham') || value.includes('beauty')) return 'sparkles-outline';
  if (value.includes('gia dung') || value.includes('nha') || value.includes('bep')) return 'home-outline';
  if (value.includes('sach') || value.includes('van phong') || value.includes('book')) return 'book-outline';
  if (value.includes('the thao') || value.includes('sport')) return 'football-outline';
  if (value.includes('me') || value.includes('be') || value.includes('baby')) return 'happy-outline';
  if (value.includes('thuc pham') || value.includes('do an') || value.includes('food')) return 'fast-food-outline';
  if (value.includes('suc khoe') || value.includes('health')) return 'medkit-outline';
  if (value.includes('xe') || value.includes('oto') || value.includes('car')) return 'car-outline';
  if (value.includes('thu cung') || value.includes('pet')) return 'paw-outline';
  if (value.includes('do choi') || value.includes('toy')) return 'game-controller-outline';
  if (value.includes('nhac') || value.includes('music')) return 'musical-notes-outline';
  if (value.includes('voucher') || value.includes('ma giam')) return 'ticket-outline';
  return 'grid-outline';
}
