import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartStorageItem, Product } from '../types/ecommerce';
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  clearStoredCart,
  loadStoredCart,
  saveStoredCart,
} from './storage';

const MOCK_CATALOG: readonly Product[] = [
  {
    id: 'prod-item-1',
    name: 'Sample Item One',
    description: 'First sample test item.',
    priceCents: 30000,
    rating: 4.5,
    category: 'Electronics',
    stock: 5,
    imageUrl: '/products/sample1.svg',
    isAvailable: true,
  },
  {
    id: 'prod-item-2',
    name: 'Sample Item Two',
    description: 'Second sample test item.',
    priceCents: 70000,
    rating: 4.8,
    category: 'Apparel',
    stock: 2,
    imageUrl: '/products/sample2.svg',
    isAvailable: true,
  },
  {
    id: 'prod-out-of-stock',
    name: 'Out of Stock Item',
    description: 'Unavailable sample item.',
    priceCents: 50000,
    rating: 4.0,
    category: 'Home',
    stock: 0,
    imageUrl: '/products/sample3.svg',
    isAvailable: false,
  },
];

describe('storage service', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveStoredCart', () => {
    it('saves only product IDs and whole-number quantities in versioned payload', () => {
      const items: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 3 },
      ];

      const result = saveStoredCart(items);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const storedRaw = window.localStorage.getItem(CART_STORAGE_KEY);
      expect(storedRaw).not.toBeNull();

      const parsed = JSON.parse(storedRaw ?? '{}');
      expect(parsed.version).toBe(CART_STORAGE_VERSION);
      expect(parsed.items).toEqual([{ productId: 'prod-item-1', quantity: 3 }]);
    });

    it('returns error result without crashing when setItem throws an error', () => {
      const setItemSpy = vi
        .spyOn(window.localStorage, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

      const items: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 1 },
      ];

      const result = saveStoredCart(items);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unable to save cart to local storage');

      setItemSpy.mockRestore();
    });
  });

  describe('loadStoredCart', () => {
    it('returns empty cart when storage is empty', () => {
      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toHaveLength(0);
      expect(result.notice).toBeNull();
    });

    it('restores valid saved items', () => {
      const payload = {
        version: CART_STORAGE_VERSION,
        items: [
          { productId: 'prod-item-1', quantity: 2 },
          { productId: 'prod-item-2', quantity: 1 },
        ],
      };
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));

      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toEqual([
        { productId: 'prod-item-1', quantity: 2 },
        { productId: 'prod-item-2', quantity: 1 },
      ]);
      expect(result.notice).toBeNull();
    });

    it('handles corrupted JSON without throwing and returns notification', () => {
      window.localStorage.setItem(CART_STORAGE_KEY, '{invalidJson:::');

      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toHaveLength(0);
      expect(result.notice).toContain('corrupted');
    });

    it('discards data with unsupported version', () => {
      const payload = {
        version: 99,
        items: [{ productId: 'prod-item-1', quantity: 1 }],
      };
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));

      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toHaveLength(0);
      expect(result.notice).toContain('unsupported version');
    });

    it('discards invalid product IDs and malformed item records', () => {
      const payload = {
        version: CART_STORAGE_VERSION,
        items: [
          { productId: 'non-existent-product', quantity: 2 },
          { productId: 'prod-item-1', quantity: -3 },
          { productId: 'prod-item-1', quantity: 2.5 },
          { invalidField: 'test' },
          { productId: 'prod-item-1', quantity: 1 },
        ],
      };
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));

      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toEqual([{ productId: 'prod-item-1', quantity: 1 }]);
      expect(result.notice).toContain('invalid or duplicate entries');
    });

    it('removes products that are now out of stock', () => {
      const payload = {
        version: CART_STORAGE_VERSION,
        items: [{ productId: 'prod-out-of-stock', quantity: 1 }],
      };
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));

      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toHaveLength(0);
      expect(result.notice).toContain('no longer in stock');
    });

    it('merges duplicate product IDs and caps at current stock', () => {
      const payload = {
        version: CART_STORAGE_VERSION,
        items: [
          { productId: 'prod-item-2', quantity: 1 },
          { productId: 'prod-item-2', quantity: 3 },
        ],
      };
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));

      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toEqual([{ productId: 'prod-item-2', quantity: 2 }]);
      expect(result.notice).toContain('adjusted to match current available stock');
    });

    it('caps single item quantity exceeding stock', () => {
      const payload = {
        version: CART_STORAGE_VERSION,
        items: [{ productId: 'prod-item-2', quantity: 10 }],
      };
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));

      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toEqual([{ productId: 'prod-item-2', quantity: 2 }]);
      expect(result.notice).toContain('adjusted to match current available stock');
    });

    it('handles localStorage read failure gracefully', () => {
      const getItemSpy = vi
        .spyOn(window.localStorage, 'getItem')
        .mockImplementation(() => {
          throw new Error('SecurityError');
        });

      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toHaveLength(0);
      expect(result.notice).toContain('Unable to read from local storage');

      getItemSpy.mockRestore();
    });
  });

  describe('clearStoredCart', () => {
    it('removes only this application storage key', () => {
      window.localStorage.setItem(CART_STORAGE_KEY, '{"version":1,"items":[]}');
      window.localStorage.setItem('other_app_key', 'persisted_value');

      const result = clearStoredCart();

      expect(result.success).toBe(true);
      expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
      expect(window.localStorage.getItem('other_app_key')).toBe('persisted_value');
    });
  });

  describe('throwing localStorage property getter', () => {
    it('loadStoredCart returns empty cart without crashing when localStorage getter throws', () => {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
      Object.defineProperty(window, 'localStorage', {
        get: () => { throw new Error('SecurityError: access denied'); },
        configurable: true,
      });

      const result = loadStoredCart(MOCK_CATALOG);

      expect(result.items).toHaveLength(0);
      expect(result.notice).toBeNull();

      if (descriptor) {
        Object.defineProperty(window, 'localStorage', descriptor);
      }
    });

    it('saveStoredCart returns failure without crashing when localStorage getter throws', () => {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
      Object.defineProperty(window, 'localStorage', {
        get: () => { throw new Error('SecurityError: access denied'); },
        configurable: true,
      });

      const items: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 1 },
      ];

      const result = saveStoredCart(items);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported');

      if (descriptor) {
        Object.defineProperty(window, 'localStorage', descriptor);
      }
    });

    it('clearStoredCart returns failure without crashing when localStorage getter throws', () => {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
      Object.defineProperty(window, 'localStorage', {
        get: () => { throw new Error('SecurityError: access denied'); },
        configurable: true,
      });

      const result = clearStoredCart();

      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported');

      if (descriptor) {
        Object.defineProperty(window, 'localStorage', descriptor);
      }
    });
  });

  describe('failed save during item removal', () => {
    it('saveStoredCart reports failure but does not throw when setItem throws after removal', () => {
      const items: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 2 },
        { productId: 'prod-item-2', quantity: 1 },
      ];

      saveStoredCart(items);

      const setItemSpy = vi
        .spyOn(window.localStorage, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

      const updatedItems: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 2 },
      ];

      const result = saveStoredCart(updatedItems);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unable to save cart to local storage');

      setItemSpy.mockRestore();
    });
  });
});
