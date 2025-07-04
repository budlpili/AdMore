import { Product } from '../types';

const RECENT_KEY = 'recentProducts';

export function addRecentProduct(product: Product) {
  let list: Product[] = [];
  try {
    list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    // 중복 제거
    list = list.filter((p) => p.id !== product.id);
    list.unshift(product);
    if (list.length > 10) list = list.slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}

export function getRecentProducts(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearRecentProducts() {
  localStorage.removeItem(RECENT_KEY);
} 