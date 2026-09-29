export type ProductCategory = 'Electronics' | 'Apparel' | 'Home' | 'Books';

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  rating: number;
  category: ProductCategory;
  stock: number;
  imageUrl: string;
  isAvailable: boolean;
}

export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

export interface CartStorageItem {
  productId: string;
  quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartTotals {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  totalItemCount: number;
}

export interface CartFeedback {
  type: 'success' | 'warning' | 'error';
  message: string;
}

export interface CartContextValue {
  items: CartItem[];
  totals: CartTotals;
  feedback: CartFeedback | null;
  clearFeedback: () => void;
  addToCart: (productId: string, quantity: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

export type PaymentMethod = 'cash_on_delivery' | 'demo_card';

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone?: string;
}

export interface ShippingInfo {
  streetAddress: string;
  addressLine2?: string;
  city: string;
  stateOrProvince?: string;
  postalCode: string;
  country: string;
}

export interface CheckoutFormData {
  customer: CustomerInfo;
  shipping: ShippingInfo;
  paymentMethod: PaymentMethod | '';
}

export interface OrderConfirmationData {
  orderId: string;
  placedAt: string;
  items: CartItem[];
  totals: CartTotals;
  customer: CustomerInfo;
  shipping: ShippingInfo;
  paymentMethod: PaymentMethod;
}

export interface ValidationErrors {
  [fieldPath: string]: string;
}

export type ActiveView = 'products' | 'product_detail' | 'cart' | 'checkout' | 'order_confirmation';
