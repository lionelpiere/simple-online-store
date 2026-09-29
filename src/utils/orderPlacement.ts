import type {
  CartItem,
  CartTotals,
  CheckoutFormData,
  OrderConfirmationData,
  PaymentMethod,
} from '../types/ecommerce';

export const generateOrderId = (): string => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  return `ORD-${timePart}-${randomPart}`;
};

export const formatOrderTimestamp = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const createOrderSnapshot = (
  formData: CheckoutFormData,
  cartItems: readonly CartItem[],
  cartTotals: CartTotals,
  customTimestamp?: string,
  customOrderId?: string,
): OrderConfirmationData => {
  const paymentMethod: PaymentMethod =
    formData.paymentMethod === 'demo_card'
      ? 'demo_card'
      : 'cash_on_delivery';

  const snapshotItems: CartItem[] = cartItems.map((item) => ({
    product: {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      priceCents: item.product.priceCents,
      rating: item.product.rating,
      category: item.product.category,
      stock: item.product.stock,
      imageUrl: item.product.imageUrl,
      isAvailable: item.product.isAvailable,
    },
    quantity: item.quantity,
  }));

  const snapshotTotals: CartTotals = {
    subtotalCents: cartTotals.subtotalCents,
    shippingCents: cartTotals.shippingCents,
    totalCents: cartTotals.totalCents,
    totalItemCount: cartTotals.totalItemCount,
  };

  const snapshotCustomer = {
    fullName: formData.customer.fullName.trim(),
    email: formData.customer.email.trim(),
    phone: formData.customer.phone?.trim(),
  };

  const snapshotShipping = {
    streetAddress: formData.shipping.streetAddress.trim(),
    addressLine2: formData.shipping.addressLine2?.trim() || undefined,
    city: formData.shipping.city.trim(),
    stateOrProvince: formData.shipping.stateOrProvince?.trim() || undefined,
    postalCode: formData.shipping.postalCode.trim(),
    country: formData.shipping.country.trim(),
  };

  return {
    orderId: customOrderId ?? generateOrderId(),
    placedAt: customTimestamp ?? formatOrderTimestamp(new Date()),
    items: snapshotItems,
    totals: snapshotTotals,
    customer: snapshotCustomer,
    shipping: snapshotShipping,
    paymentMethod,
  };
};
