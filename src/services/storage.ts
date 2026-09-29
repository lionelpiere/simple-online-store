import type { CartStorageItem, Product } from '../types/ecommerce';
import { isValidQuantity } from '../utils/cartCalculations';

export const CART_STORAGE_KEY = 'modern_goods_cart_v1';
export const CART_STORAGE_VERSION = 1;

export interface CartStoragePayload {
  version: number;
  items: CartStorageItem[];
}

export interface LoadCartResult {
  items: CartStorageItem[];
  notice: string | null;
}

export interface SaveCartResult {
  success: boolean;
  error: string | null;
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const loadStoredCart = (catalog: readonly Product[]): LoadCartResult => {
  const storage = getLocalStorage();

  if (!storage) {
    return {
      items: [],
      notice: null,
    };
  }

  let rawData: string | null = null;
  try {
    rawData = storage.getItem(CART_STORAGE_KEY);
  } catch {
    return {
      items: [],
      notice: 'Unable to read from local storage. Starting with a fresh cart.',
    };
  }

  if (!rawData || rawData.trim().length === 0) {
    return {
      items: [],
      notice: null,
    };
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawData);
  } catch {
    return {
      items: [],
      notice: 'Previous saved cart data was corrupted and has been reset.',
    };
  }

  if (!isObjectRecord(parsed)) {
    return {
      items: [],
      notice: 'Saved cart data format was malformed and has been reset.',
    };
  }

  if (parsed.version !== CART_STORAGE_VERSION) {
    return {
      items: [],
      notice: 'Saved cart was created with an unsupported version and has been reset.',
    };
  }

  if (!Array.isArray(parsed.items)) {
    return {
      items: [],
      notice: 'Saved cart item list was malformed and has been reset.',
    };
  }

  const mergedQuantities = new Map<string, number>();
  let hadInvalidEntries = false;
  let hadDuplicates = false;
  let hadOutOfStock = false;
  let hadStockAdjustments = false;

  for (const rawItem of parsed.items) {
    if (!isObjectRecord(rawItem)) {
      hadInvalidEntries = true;
      continue;
    }

    const productId = rawItem.productId;
    const quantity = rawItem.quantity;

    if (typeof productId !== 'string' || productId.trim().length === 0) {
      hadInvalidEntries = true;
      continue;
    }

    if (typeof quantity !== 'number' || !isValidQuantity(quantity)) {
      hadInvalidEntries = true;
      continue;
    }

    const product = catalog.find((candidate) => candidate.id === productId);

    if (!product) {
      hadInvalidEntries = true;
      continue;
    }

    if (!product.isAvailable || product.stock <= 0) {
      hadOutOfStock = true;
      continue;
    }

    if (mergedQuantities.has(productId)) {
      hadDuplicates = true;
      const current = mergedQuantities.get(productId) ?? 0;
      mergedQuantities.set(productId, current + quantity);
    } else {
      mergedQuantities.set(productId, quantity);
    }
  }

  const sanitizedItems: CartStorageItem[] = [];

  for (const [productId, totalQuantity] of mergedQuantities.entries()) {
    const product = catalog.find((candidate) => candidate.id === productId);
    if (!product) {
      continue;
    }

    if (totalQuantity > product.stock) {
      hadStockAdjustments = true;
      sanitizedItems.push({
        productId,
        quantity: product.stock,
      });
    } else {
      sanitizedItems.push({
        productId,
        quantity: totalQuantity,
      });
    }
  }

  let notice: string | null = null;
  if (hadOutOfStock && hadStockAdjustments) {
    notice = 'Some saved items were out of stock or exceeded available stock, and your cart has been adjusted.';
  } else if (hadOutOfStock) {
    notice = 'Some saved items are no longer in stock and were removed from your cart.';
  } else if (hadStockAdjustments) {
    notice = 'Some saved item quantities were adjusted to match current available stock.';
  } else if (hadInvalidEntries || hadDuplicates) {
    notice = 'Saved cart contained invalid or duplicate entries which have been corrected.';
  }

  return {
    items: sanitizedItems,
    notice,
  };
};

export const saveStoredCart = (
  items: readonly CartStorageItem[],
): SaveCartResult => {
  const storage = getLocalStorage();

  if (!storage) {
    return {
      success: false,
      error: 'Local storage is not supported in this environment.',
    };
  }

  const payload: CartStoragePayload = {
    version: CART_STORAGE_VERSION,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  };

  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: 'Unable to save cart to local storage. Changes will remain in memory for this session.',
    };
  }
};

export const clearStoredCart = (): SaveCartResult => {
  const storage = getLocalStorage();

  if (!storage) {
    return {
      success: false,
      error: 'Local storage is not supported in this environment.',
    };
  }

  try {
    storage.removeItem(CART_STORAGE_KEY);
    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: 'Unable to clear local storage.',
    };
  }
};
