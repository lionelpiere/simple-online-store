import { describe, expect, it } from 'vitest';
import type { CartItem, CartStorageItem, Product } from '../types/ecommerce';
import {
  addItemToCart,
  calculateCartTotals,
  FREE_SHIPPING_THRESHOLD_CENTS,
  isValidQuantity,
  removeItemFromCart,
  resolveCartItems,
  SHIPPING_FEE_CENTS,
  updateItemQuantityInCart,
} from './cartCalculations';

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

describe('cartCalculations', () => {
  describe('isValidQuantity', () => {
    it('accepts positive whole integers', () => {
      expect(isValidQuantity(1)).toBe(true);
      expect(isValidQuantity(5)).toBe(true);
      expect(isValidQuantity(100)).toBe(true);
    });

    it('rejects zero, negative numbers, fractions, and non-finite values', () => {
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(-1)).toBe(false);
      expect(isValidQuantity(-5)).toBe(false);
      expect(isValidQuantity(1.5)).toBe(false);
      expect(isValidQuantity(0.99)).toBe(false);
      expect(isValidQuantity(NaN)).toBe(false);
      expect(isValidQuantity(Infinity)).toBe(false);
    });
  });

  describe('calculateCartTotals', () => {
    it('returns zero totals for an empty cart', () => {
      const totals = calculateCartTotals([]);
      expect(totals.subtotalCents).toBe(0);
      expect(totals.shippingCents).toBe(0);
      expect(totals.totalCents).toBe(0);
      expect(totals.totalItemCount).toBe(0);
    });

    it('applies flat shipping fee when subtotal is below the free-shipping threshold', () => {
      const items: CartItem[] = [
        {
          product: MOCK_CATALOG[0],
          quantity: 2,
        },
      ];

      const totals = calculateCartTotals(items);
      expect(totals.subtotalCents).toBe(60000);
      expect(totals.subtotalCents).toBeLessThan(FREE_SHIPPING_THRESHOLD_CENTS);
      expect(totals.shippingCents).toBe(SHIPPING_FEE_CENTS);
      expect(totals.totalCents).toBe(60000 + SHIPPING_FEE_CENTS);
      expect(totals.totalItemCount).toBe(2);
    });

    it('gives free shipping when subtotal is exactly at the threshold', () => {
      const items: CartItem[] = [
        {
          product: {
            ...MOCK_CATALOG[0],
            priceCents: 100000,
          },
          quantity: 1,
        },
      ];

      const totals = calculateCartTotals(items);
      expect(totals.subtotalCents).toBe(100000);
      expect(totals.subtotalCents).toBe(FREE_SHIPPING_THRESHOLD_CENTS);
      expect(totals.shippingCents).toBe(0);
      expect(totals.totalCents).toBe(100000);
      expect(totals.totalItemCount).toBe(1);
    });

    it('gives free shipping when subtotal is above the threshold', () => {
      const items: CartItem[] = [
        {
          product: MOCK_CATALOG[0],
          quantity: 2,
        },
        {
          product: MOCK_CATALOG[1],
          quantity: 1,
        },
      ];

      const totals = calculateCartTotals(items);
      expect(totals.subtotalCents).toBe(130000);
      expect(totals.subtotalCents).toBeGreaterThan(FREE_SHIPPING_THRESHOLD_CENTS);
      expect(totals.shippingCents).toBe(0);
      expect(totals.totalCents).toBe(130000);
      expect(totals.totalItemCount).toBe(3);
    });
  });

  describe('addItemToCart', () => {
    it('adds a new item to an empty cart', () => {
      const result = addItemToCart([], 'prod-item-1', 2, MOCK_CATALOG);

      expect(result.success).toBe(true);
      expect(result.updatedItems).toEqual([
        {
          productId: 'prod-item-1',
          quantity: 2,
        },
      ]);
      expect(result.message).toContain('Added Sample Item One (x2)');
    });

    it('merges repeated additions for the same item into the existing line', () => {
      const initial: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 2 },
      ];

      const result = addItemToCart(initial, 'prod-item-1', 2, MOCK_CATALOG);

      expect(result.success).toBe(true);
      expect(result.updatedItems).toEqual([
        {
          productId: 'prod-item-1',
          quantity: 4,
        },
      ]);
    });

    it('rejects adding an unknown product ID', () => {
      const result = addItemToCart([], 'non-existent-id', 1, MOCK_CATALOG);

      expect(result.success).toBe(false);
      expect(result.updatedItems).toHaveLength(0);
      expect(result.message).toContain('Product could not be found');
    });

    it('rejects adding an out of stock product', () => {
      const result = addItemToCart([], 'prod-out-of-stock', 1, MOCK_CATALOG);

      expect(result.success).toBe(false);
      expect(result.updatedItems).toHaveLength(0);
      expect(result.message).toContain('currently out of stock');
    });

    it('rejects invalid quantity input', () => {
      const resultFraction = addItemToCart([], 'prod-item-1', 1.5, MOCK_CATALOG);
      expect(resultFraction.success).toBe(false);

      const resultZero = addItemToCart([], 'prod-item-1', 0, MOCK_CATALOG);
      expect(resultZero.success).toBe(false);

      const resultNegative = addItemToCart([], 'prod-item-1', -2, MOCK_CATALOG);
      expect(resultNegative.success).toBe(false);
    });

    it('prevents adding quantity that exceeds stock limit on a fresh item', () => {
      const result = addItemToCart([], 'prod-item-2', 3, MOCK_CATALOG);

      expect(result.success).toBe(false);
      expect(result.updatedItems).toHaveLength(0);
      expect(result.message).toContain('stock limit of 2 reached');
    });

    it('prevents exceeding stock limit when item already exists in cart', () => {
      const initial: CartStorageItem[] = [
        { productId: 'prod-item-2', quantity: 1 },
      ];

      const result = addItemToCart(initial, 'prod-item-2', 2, MOCK_CATALOG);

      expect(result.success).toBe(false);
      expect(result.updatedItems).toEqual(initial);
      expect(result.message).toContain('Only 1 more available');
    });

    it('allows adding up to the exact available stock', () => {
      const initial: CartStorageItem[] = [
        { productId: 'prod-item-2', quantity: 1 },
      ];

      const result = addItemToCart(initial, 'prod-item-2', 1, MOCK_CATALOG);

      expect(result.success).toBe(true);
      expect(result.updatedItems).toEqual([
        {
          productId: 'prod-item-2',
          quantity: 2,
        },
      ]);
    });
  });

  describe('updateItemQuantityInCart', () => {
    it('updates quantity within stock bounds', () => {
      const initial: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 1 },
      ];

      const result = updateItemQuantityInCart(
        initial,
        'prod-item-1',
        4,
        MOCK_CATALOG,
      );

      expect(result.success).toBe(true);
      expect(result.updatedItems[0].quantity).toBe(4);
    });

    it('caps quantity and provides explanation if new quantity exceeds stock', () => {
      const initial: CartStorageItem[] = [
        { productId: 'prod-item-2', quantity: 1 },
      ];

      const result = updateItemQuantityInCart(
        initial,
        'prod-item-2',
        10,
        MOCK_CATALOG,
      );

      expect(result.success).toBe(false);
      expect(result.updatedItems[0].quantity).toBe(2);
      expect(result.message).toContain('exceeds available stock');
    });

    it('rejects invalid quantities', () => {
      const initial: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 2 },
      ];

      const result = updateItemQuantityInCart(
        initial,
        'prod-item-1',
        -1,
        MOCK_CATALOG,
      );

      expect(result.success).toBe(false);
      expect(result.updatedItems).toEqual(initial);
    });
  });

  describe('removeItemFromCart', () => {
    it('removes the specified item without modifying other cart items', () => {
      const initial: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 2 },
        { productId: 'prod-item-2', quantity: 1 },
      ];

      const updated = removeItemFromCart(initial, 'prod-item-1');

      expect(updated).toEqual([{ productId: 'prod-item-2', quantity: 1 }]);
    });
  });

  describe('resolveCartItems', () => {
    it('joins stored items with catalog products and ignores deleted or out of stock items', () => {
      const stored: CartStorageItem[] = [
        { productId: 'prod-item-1', quantity: 2 },
        { productId: 'non-existent', quantity: 1 },
        { productId: 'prod-out-of-stock', quantity: 1 },
      ];

      const resolved = resolveCartItems(stored, MOCK_CATALOG);

      expect(resolved).toHaveLength(1);
      expect(resolved[0].product.id).toBe('prod-item-1');
      expect(resolved[0].quantity).toBe(2);
    });
  });
});
