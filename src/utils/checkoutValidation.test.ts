import { describe, expect, it } from 'vitest';
import type { CartItem, CheckoutFormData, Product } from '../types/ecommerce';
import { calculateCartTotals } from './cartCalculations';
import {
  validateCheckoutForm,
  validateEmail,
} from './checkoutValidation';

const MOCK_PRODUCT_A: Product = {
  id: 'prod-valid-1',
  name: 'Mechanical Keyboard',
  description: 'Test keyboard',
  priceCents: 285000,
  rating: 4.7,
  category: 'Electronics',
  stock: 10,
  imageUrl: '/products/keyboard.svg',
  isAvailable: true,
};

const MOCK_PRODUCT_B: Product = {
  id: 'prod-valid-2',
  name: 'Canvas Backpack',
  description: 'Test backpack',
  priceCents: 185000,
  rating: 4.6,
  category: 'Apparel',
  stock: 2,
  imageUrl: '/products/backpack.svg',
  isAvailable: true,
};

const VALID_FORM_DATA: CheckoutFormData = {
  customer: {
    fullName: 'Juan dela Cruz',
    email: 'juan.delacruz@example.com',
  },
  shipping: {
    streetAddress: '123 Rizal Street',
    addressLine2: 'Apt 4B',
    city: 'Makati',
    stateOrProvince: 'Metro Manila',
    postalCode: '1200',
    country: 'Philippines',
  },
  paymentMethod: 'cash_on_delivery',
};

const VALID_CART_ITEMS: CartItem[] = [
  {
    product: MOCK_PRODUCT_A,
    quantity: 1,
  },
];

describe('checkoutValidation', () => {
  describe('validateEmail', () => {
    it('accepts standard valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@sub.domain.org')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('plainaddress')).toBe(false);
      expect(validateEmail('@missingusername.com')).toBe(false);
      expect(validateEmail('missingdomain@')).toBe(false);
      expect(validateEmail('missingdot@domain')).toBe(false);
      expect(validateEmail('space in@domain.com')).toBe(false);
    });
  });

  describe('validateCheckoutForm', () => {
    it('passes for complete valid data and non-empty valid cart', () => {
      const result = validateCheckoutForm(VALID_FORM_DATA, VALID_CART_ITEMS);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.cartError).toBeNull();
    });

    it('accepts both cash_on_delivery and demo_card payment methods', () => {
      const codResult = validateCheckoutForm(
        { ...VALID_FORM_DATA, paymentMethod: 'cash_on_delivery' },
        VALID_CART_ITEMS,
      );
      expect(codResult.isValid).toBe(true);

      const demoCardResult = validateCheckoutForm(
        { ...VALID_FORM_DATA, paymentMethod: 'demo_card' },
        VALID_CART_ITEMS,
      );
      expect(demoCardResult.isValid).toBe(true);
    });

    it('rejects missing or empty payment method', () => {
      const result = validateCheckoutForm(
        { ...VALID_FORM_DATA, paymentMethod: '' },
        VALID_CART_ITEMS,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors['paymentMethod']).toContain('select a payment method');
    });

    it('rejects empty or whitespace-only required fields', () => {
      const emptyForm: CheckoutFormData = {
        customer: {
          fullName: '   ',
          email: '   ',
        },
        shipping: {
          streetAddress: '   ',
          city: '',
          postalCode: '  ',
          country: '',
        },
        paymentMethod: '',
      };

      const result = validateCheckoutForm(emptyForm, VALID_CART_ITEMS);

      expect(result.isValid).toBe(false);
      expect(result.errors['customer.fullName']).toContain('required');
      expect(result.errors['customer.email']).toContain('required');
      expect(result.errors['shipping.streetAddress']).toContain('required');
      expect(result.errors['shipping.city']).toContain('required');
      expect(result.errors['shipping.postalCode']).toContain('required');
      expect(result.errors['shipping.country']).toContain('required');
    });

    it('rejects malformed email in customer info', () => {
      const invalidEmailForm: CheckoutFormData = {
        ...VALID_FORM_DATA,
        customer: {
          ...VALID_FORM_DATA.customer,
          email: 'not-an-email',
        },
      };

      const result = validateCheckoutForm(invalidEmailForm, VALID_CART_ITEMS);

      expect(result.isValid).toBe(false);
      expect(result.errors['customer.email']).toContain('valid email address');
    });

    it('allows omitting optional address line 2 and region without error', () => {
      const minimalForm: CheckoutFormData = {
        customer: {
          fullName: 'Maria Santos',
          email: 'maria@example.com',
        },
        shipping: {
          streetAddress: '456 Ayala Avenue',
          city: 'Makati',
          postalCode: '1226',
          country: 'Philippines',
        },
        paymentMethod: 'demo_card',
      };

      const result = validateCheckoutForm(minimalForm, VALID_CART_ITEMS);

      expect(result.isValid).toBe(true);
      expect(result.errors['shipping.addressLine2']).toBeUndefined();
      expect(result.errors['shipping.stateOrProvince']).toBeUndefined();
    });

    it('rejects checkout when cart is empty', () => {
      const result = validateCheckoutForm(VALID_FORM_DATA, []);

      expect(result.isValid).toBe(false);
      expect(result.cartError).toContain('cart is empty');
    });

    it('rejects checkout when an item has become out of stock', () => {
      const cartWithOutOfStock: CartItem[] = [
        {
          product: {
            ...MOCK_PRODUCT_A,
            stock: 0,
            isAvailable: false,
          },
          quantity: 1,
        },
      ];

      const result = validateCheckoutForm(VALID_FORM_DATA, cartWithOutOfStock);

      expect(result.isValid).toBe(false);
      expect(result.cartError).toContain('currently out of stock');
    });

    it('rejects checkout when a cart item quantity exceeds available stock', () => {
      const cartExceedingStock: CartItem[] = [
        {
          product: MOCK_PRODUCT_B,
          quantity: 5,
        },
      ];

      const result = validateCheckoutForm(VALID_FORM_DATA, cartExceedingStock);

      expect(result.isValid).toBe(false);
      expect(result.cartError).toContain('exceeds available stock');
    });

    it('preserves exact agreement of totals between cart calculations and checkout summary', () => {
      const items: CartItem[] = [
        {
          product: MOCK_PRODUCT_A,
          quantity: 2,
        },
        {
          product: MOCK_PRODUCT_B,
          quantity: 1,
        },
      ];

      const cartTotals = calculateCartTotals(items);

      const expectedSubtotal =
        MOCK_PRODUCT_A.priceCents * 2 + MOCK_PRODUCT_B.priceCents * 1;
      expect(cartTotals.subtotalCents).toBe(expectedSubtotal);
      expect(cartTotals.totalCents).toBe(
        cartTotals.subtotalCents + cartTotals.shippingCents,
      );
    });
  });
});
