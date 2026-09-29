import { describe, expect, it } from 'vitest';
import type { CartItem, CheckoutFormData, Product } from '../types/ecommerce';
import {
  createOrderSnapshot,
  formatOrderTimestamp,
  generateOrderId,
} from './orderPlacement';

const MOCK_PRODUCT: Product = {
  id: 'prod-item-1',
  name: 'Wireless Headphones',
  description: 'Test headphones',
  priceCents: 499900,
  rating: 4.8,
  category: 'Electronics',
  stock: 10,
  imageUrl: '/products/headphones.svg',
  isAvailable: true,
};

const MOCK_FORM: CheckoutFormData = {
  customer: {
    fullName: 'Maria Dela Cruz',
    email: 'maria@example.com',
  },
  shipping: {
    streetAddress: '789 Makati Ave',
    addressLine2: 'Unit 12',
    city: 'Makati',
    stateOrProvince: 'Metro Manila',
    postalCode: '1200',
    country: 'Philippines',
  },
  paymentMethod: 'cash_on_delivery',
};

const MOCK_ITEMS: CartItem[] = [
  {
    product: MOCK_PRODUCT,
    quantity: 2,
  },
];

const MOCK_TOTALS = {
  subtotalCents: 999800,
  shippingCents: 0,
  totalCents: 999800,
  totalItemCount: 2,
};

describe('orderPlacement', () => {
  describe('generateOrderId', () => {
    it('creates unique uppercase order identifiers starting with ORD-', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();

      expect(id1).toMatch(/^ORD-[A-Z0-9]+-\d{4}$/);
      expect(id2).toMatch(/^ORD-[A-Z0-9]+-\d{4}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('formatOrderTimestamp', () => {
    it('formats a date into a readable string', () => {
      const fixedDate = new Date(2026, 8, 28, 14, 30);
      const formatted = formatOrderTimestamp(fixedDate);

      expect(formatted).toContain('September 28, 2026');
      expect(formatted).toContain('02:30 PM');
    });
  });

  describe('createOrderSnapshot', () => {
    it('captures full snapshot of customer, shipping, totals, and items', () => {
      const order = createOrderSnapshot(
        MOCK_FORM,
        MOCK_ITEMS,
        MOCK_TOTALS,
        'September 28, 2026 at 2:30 PM',
        'ORD-TEST-1234',
      );

      expect(order.orderId).toBe('ORD-TEST-1234');
      expect(order.placedAt).toBe('September 28, 2026 at 2:30 PM');
      expect(order.paymentMethod).toBe('cash_on_delivery');
      expect(order.customer.fullName).toBe('Maria Dela Cruz');
      expect(order.shipping.streetAddress).toBe('789 Makati Ave');
      expect(order.totals.totalCents).toBe(999800);
      expect(order.items).toHaveLength(1);
      expect(order.items[0].product.name).toBe('Wireless Headphones');
      expect(order.items[0].quantity).toBe(2);
    });

    it('keeps snapshot completely immutable when source objects are modified afterwards', () => {
      const mutableItems: CartItem[] = [
        {
          product: { ...MOCK_PRODUCT },
          quantity: 1,
        },
      ];

      const order = createOrderSnapshot(
        MOCK_FORM,
        mutableItems,
        MOCK_TOTALS,
      );

      mutableItems.length = 0;
      expect(order.items).toHaveLength(1);
      expect(order.items[0].product.name).toBe('Wireless Headphones');
    });

    it('creates demo card order snapshot with trimmed fields', () => {
      const formWithSpaces: CheckoutFormData = {
        customer: {
          fullName: '  Juan Luna  ',
          email: '  juan@example.com  ',
          phone: '  09171234567  ',
        },
        shipping: {
          streetAddress: '  123 Rizal St  ',
          addressLine2: '  Bldg 4  ',
          city: '  Quezon City  ',
          stateOrProvince: '  Metro Manila  ',
          postalCode: '  1100  ',
          country: '  Philippines  ',
        },
        paymentMethod: 'demo_card',
      };

      const order = createOrderSnapshot(
        formWithSpaces,
        MOCK_ITEMS,
        MOCK_TOTALS,
      );

      expect(order.paymentMethod).toBe('demo_card');
      expect(order.customer.fullName).toBe('Juan Luna');
      expect(order.customer.email).toBe('juan@example.com');
      expect(order.customer.phone).toBe('09171234567');
      expect(order.shipping.streetAddress).toBe('123 Rizal St');
      expect(order.shipping.addressLine2).toBe('Bldg 4');
      expect(order.shipping.city).toBe('Quezon City');
    });
  });

  describe('order placement flow constraints', () => {
    it('does not collect real payment credentials or external sensitive fields in snapshot', () => {
      const order = createOrderSnapshot(MOCK_FORM, MOCK_ITEMS, MOCK_TOTALS);

      expect('cardNumber' in order).toBe(false);
      expect('cvv' in order).toBe(false);
      expect('securityCode' in order).toBe(false);
      expect('expirationDate' in order).toBe(false);
    });
  });
});
