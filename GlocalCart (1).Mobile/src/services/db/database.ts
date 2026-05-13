import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Interfaces ---
export interface DbCartItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  sellerName?: string;
  priceSnapshot: number;
  currentPrice: number;
  quantity: number;
  availableStock: number;
  subtotal: number;
}

const isWeb = Platform.OS === 'web';
const GUEST_CART_KEY = '@cart_guest';
const SEARCH_HISTORY_KEY = '@search_history';

let db: SQLite.SQLiteDatabase | null = null;

if (!isWeb) {
  try {
    db = SQLite.openDatabaseSync('glocalcart.db');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS GuestCart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER UNIQUE,
        productName TEXT,
        productImage TEXT,
        sellerName TEXT,
        priceSnapshot REAL,
        currentPrice REAL,
        quantity INTEGER,
        availableStock INTEGER,
        subtotal REAL
      );
      CREATE TABLE IF NOT EXISTS SearchHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      -- Ensure sellerName column exists for older installations
      PRAGMA table_info(GuestCart);
    `);
    
    // Check if sellerName exists and add it if not
    const tableInfo = db.getAllSync<{ name: string }>('PRAGMA table_info(GuestCart)');
    const columnExists = tableInfo.some(col => col.name === 'sellerName');
    if (!columnExists) {
      db.execSync('ALTER TABLE GuestCart ADD COLUMN sellerName TEXT');
    }
  } catch (error) {
    console.error('SQLite Init Error:', error);
  }
}

// ============================================
// GUEST CART DAO
// ============================================

export const getGuestCartItems = async (): Promise<DbCartItem[]> => {
  if (isWeb) {
    const data = await AsyncStorage.getItem(GUEST_CART_KEY);
    return data ? JSON.parse(data) : [];
  }
  if (!db) return [];
  return db.getAllSync<DbCartItem>('SELECT * FROM GuestCart');
};

export const addOrUpdateGuestCartItem = async (item: DbCartItem): Promise<void> => {
  if (isWeb) {
    const items = await getGuestCartItems();
    const index = items.findIndex(i => i.productId === item.productId);
    if (index >= 0) {
      items[index].quantity += item.quantity;
      items[index].subtotal = items[index].quantity * items[index].priceSnapshot;
    } else {
      items.push(item);
    }
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    return;
  }
  
  if (!db) return;
  const existing = db.getFirstSync<{ quantity: number, priceSnapshot: number }>('SELECT quantity, priceSnapshot FROM GuestCart WHERE productId = ?', [item.productId]);
  
  if (existing) {
    const newQuantity = existing.quantity + item.quantity;
    const newSubtotal = newQuantity * existing.priceSnapshot;
    db.runSync('UPDATE GuestCart SET quantity = ?, subtotal = ? WHERE productId = ?', [newQuantity, newSubtotal, item.productId]);
  } else {
    db.runSync(
      'INSERT INTO GuestCart (id, productId, productName, productImage, sellerName, priceSnapshot, currentPrice, quantity, availableStock, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [item.id, item.productId, item.productName, item.productImage || '', item.sellerName || '', item.priceSnapshot, item.currentPrice, item.quantity, item.availableStock, item.subtotal]
    );
  }
};

export const updateGuestCartItemQuantity = async (itemId: number, quantity: number): Promise<void> => {
  if (isWeb) {
    const items = await getGuestCartItems();
    const index = items.findIndex(i => i.id === itemId);
    if (index >= 0) {
      items[index].quantity = quantity;
      items[index].subtotal = quantity * items[index].priceSnapshot;
      await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
    return;
  }
  
  if (!db) return;
  const existing = db.getFirstSync<{ priceSnapshot: number }>('SELECT priceSnapshot FROM GuestCart WHERE id = ?', [itemId]);
  if (existing) {
    const newSubtotal = quantity * existing.priceSnapshot;
    db.runSync('UPDATE GuestCart SET quantity = ?, subtotal = ? WHERE id = ?', [quantity, newSubtotal, itemId]);
  }
};

export const removeGuestCartItem = async (itemId: number): Promise<void> => {
  if (isWeb) {
    const items = await getGuestCartItems();
    const newItems = items.filter(i => i.id !== itemId);
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(newItems));
    return;
  }
  if (!db) return;
  db.runSync('DELETE FROM GuestCart WHERE id = ?', [itemId]);
};

export const clearGuestCart = async (): Promise<void> => {
  if (isWeb) {
    await AsyncStorage.removeItem(GUEST_CART_KEY);
    return;
  }
  if (!db) return;
  db.runSync('DELETE FROM GuestCart');
};

// ============================================
// SEARCH HISTORY DAO
// ============================================

export const getSearchHistory = async (): Promise<string[]> => {
  if (isWeb) {
    const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  }
  if (!db) return [];
  const rows = db.getAllSync<{query: string}>('SELECT query FROM SearchHistory ORDER BY createdAt DESC LIMIT 10');
  return rows.map(r => r.query);
};

export const addSearchHistory = async (query: string): Promise<void> => {
  if (!query.trim()) return;
  
  if (isWeb) {
    let items = await getSearchHistory();
    items = [query, ...items.filter(q => q !== query)].slice(0, 10);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items));
    return;
  }
  
  if (!db) return;
  db.runSync('INSERT OR IGNORE INTO SearchHistory (query) VALUES (?)', [query]);
  db.runSync('UPDATE SearchHistory SET createdAt = CURRENT_TIMESTAMP WHERE query = ?', [query]);
  db.runSync('DELETE FROM SearchHistory WHERE id NOT IN (SELECT id FROM SearchHistory ORDER BY createdAt DESC LIMIT 10)');
};

export const clearSearchHistory = async (): Promise<void> => {
  if (isWeb) {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    return;
  }
  if (!db) return;
  db.runSync('DELETE FROM SearchHistory');
};
