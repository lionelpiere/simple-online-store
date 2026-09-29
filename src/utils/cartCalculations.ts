import type {
  CartItem,
  CartStorageItem,
  CartTotals,
  Product,
} from '../types/ecommerce';

export const SHIPPING_FEE_CENTS = 5000;
export const FREE_SHIPPING_THRESHOLD_CENTS = 100000;

export interface CartOperationResult {
  updatedItems: CartStorageItem[];
  success: boolean;
  message: string;
}

export const isValidQuantity = (quantity: number): boolean => {
  return (
    typeof quantity === 'number' &&
    Number.isFinite(quantity) &&
    Number.isInteger(quantity) &&
    quantity > 0
  );
};

export const calculateCartTotals = (items: readonly CartItem[]): CartTotals => {
  if (items.length === 0) {
    return {
      subtotalCents: 0,
      shippingCents: 0,
      totalCents: 0,
      totalItemCount: 0,
    };
  }

  const totalItemCount = items.reduce(
    (accumulated, item) => accumulated + item.quantity,
    0,
  );

  const subtotalCents = items.reduce(
    (accumulated, item) =>
      accumulated + item.product.priceCents * item.quantity,
    0,
  );

  const shippingCents =
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FEE_CENTS;

  const totalCents = subtotalCents + shippingCents;

  return {
    subtotalCents,
    shippingCents,
    totalCents,
    totalItemCount,
  };
};

export const resolveCartItems = (
  storedItems: readonly CartStorageItem[],
  catalog: readonly Product[],
): CartItem[] => {
  const resolved: CartItem[] = [];

  for (const stored of storedItems) {
    const product = catalog.find((item) => item.id === stored.productId);
    if (!product || !product.isAvailable || product.stock <= 0) {
      continue;
    }

    if (!isValidQuantity(stored.quantity)) {
      continue;
    }

    const safeQuantity = Math.min(stored.quantity, product.stock);

    resolved.push({
      product,
      quantity: safeQuantity,
    });
  }

  return resolved;
};

export const addItemToCart = (
  currentItems: readonly CartStorageItem[],
  productId: string,
  quantityToAdd: number,
  catalog: readonly Product[],
): CartOperationResult => {
  if (!productId || typeof productId !== 'string') {
    return {
      updatedItems: [...currentItems],
      success: false,
      message: 'Invalid product identification.',
    };
  }

  const product = catalog.find((item) => item.id === productId);

  if (!product) {
    return {
      updatedItems: [...currentItems],
      success: false,
      message: 'Product could not be found in the catalog.',
    };
  }

  if (!product.isAvailable || product.stock <= 0) {
    return {
      updatedItems: [...currentItems],
      success: false,
      message: `Cannot add ${product.name}. This product is currently out of stock.`,
    };
  }

  if (!isValidQuantity(quantityToAdd)) {
    return {
      updatedItems: [...currentItems],
      success: false,
      message: 'Requested quantity must be a whole positive number.',
    };
  }

  const existingItem = currentItems.find((item) => item.productId === productId);
  const currentQuantity = existingItem ? existingItem.quantity : 0;
  const targetQuantity = currentQuantity + quantityToAdd;

  if (targetQuantity > product.stock) {
    const remainingStock = Math.max(0, product.stock - currentQuantity);
    return {
      updatedItems: [...currentItems],
      success: false,
      message: `Cannot add ${quantityToAdd} unit(s). Only ${remainingStock} more available (stock limit of ${product.stock} reached).`,
    };
  }

  const updatedItems = existingItem
    ? currentItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: targetQuantity }
          : item,
      )
    : [...currentItems, { productId, quantity: quantityToAdd }];

  return {
    updatedItems,
    success: true,
    message: `Added ${product.name} (x${quantityToAdd}) to cart.`,
  };
};

export const updateItemQuantityInCart = (
  currentItems: readonly CartStorageItem[],
  productId: string,
  newQuantity: number,
  catalog: readonly Product[],
): CartOperationResult => {
  if (!productId || typeof productId !== 'string') {
    return {
      updatedItems: [...currentItems],
      success: false,
      message: 'Invalid product identification.',
    };
  }

  const product = catalog.find((item) => item.id === productId);

  if (!product) {
    return {
      updatedItems: [...currentItems],
      success: false,
      message: 'Product could not be found in the catalog.',
    };
  }

  if (!isValidQuantity(newQuantity)) {
    return {
      updatedItems: [...currentItems],
      success: false,
      message: 'Quantity must be a positive whole number.',
    };
  }

  if (newQuantity < 1) {
    return {
      updatedItems: [...currentItems],
      success: false,
      message: 'Quantity cannot be less than 1. Use the remove button to delete the item.',
    };
  }

  if (newQuantity > product.stock) {
    const updatedItems = currentItems.map((item) =>
      item.productId === productId ? { ...item, quantity: product.stock } : item,
    );
    return {
      updatedItems,
      success: false,
      message: `Requested quantity exceeds available stock. Adjusted to maximum available (${product.stock}).`,
    };
  }

  const updatedItems = currentItems.map((item) =>
    item.productId === productId ? { ...item, quantity: newQuantity } : item,
  );

  return {
    updatedItems,
    success: true,
    message: `Updated quantity for ${product.name} to ${newQuantity}.`,
  };
};

export const removeItemFromCart = (
  currentItems: readonly CartStorageItem[],
  productId: string,
): CartStorageItem[] => {
  return currentItems.filter((item) => item.productId !== productId);
};
