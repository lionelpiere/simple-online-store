import type {
  CartItem,
  CheckoutFormData,
  ValidationErrors,
} from '../types/ecommerce';

export interface CheckoutValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
  cartError: string | null;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email.trim());
};

export const validateCheckoutForm = (
  formData: CheckoutFormData,
  cartItems: readonly CartItem[],
): CheckoutValidationResult => {
  const errors: ValidationErrors = {};
  let cartError: string | null = null;

  if (
    !formData.customer.fullName ||
    formData.customer.fullName.trim().length === 0
  ) {
    errors['customer.fullName'] = 'Full name is required.';
  }

  if (!formData.customer.email || formData.customer.email.trim().length === 0) {
    errors['customer.email'] = 'Email address is required.';
  } else if (!validateEmail(formData.customer.email)) {
    errors['customer.email'] = 'Please enter a valid email address.';
  }

  if (
    !formData.shipping.streetAddress ||
    formData.shipping.streetAddress.trim().length === 0
  ) {
    errors['shipping.streetAddress'] = 'Street address is required.';
  }

  if (!formData.shipping.city || formData.shipping.city.trim().length === 0) {
    errors['shipping.city'] = 'City is required.';
  }

  if (
    !formData.shipping.postalCode ||
    formData.shipping.postalCode.trim().length === 0
  ) {
    errors['shipping.postalCode'] = 'Postal code is required.';
  }

  if (
    !formData.shipping.country ||
    formData.shipping.country.trim().length === 0
  ) {
    errors['shipping.country'] = 'Country is required.';
  }

  if (
    formData.paymentMethod !== 'cash_on_delivery' &&
    formData.paymentMethod !== 'demo_card'
  ) {
    errors['paymentMethod'] = 'Please select a payment method.';
  }

  if (cartItems.length === 0) {
    cartError = 'Your shopping cart is empty. Add products before proceeding to checkout.';
  } else {
    for (const item of cartItems) {
      if (!item.product.isAvailable || item.product.stock <= 0) {
        cartError = `${item.product.name} is currently out of stock. Please remove it from your cart.`;
        break;
      }
      if (item.quantity > item.product.stock) {
        cartError = `Quantity for ${item.product.name} (${item.quantity}) exceeds available stock (${item.product.stock}). Please adjust your cart.`;
        break;
      }
    }
  }

  const isValid = Object.keys(errors).length === 0 && cartError === null;

  return {
    isValid,
    errors,
    cartError,
  };
};
