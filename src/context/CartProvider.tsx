import React, { useMemo, useState } from 'react';
import type {
  CartContextValue,
  CartFeedback,
  CartItem,
  CartStorageItem,
  CartTotals,
} from '../types/ecommerce';
import { PRODUCTS } from '../data/products';
import {
  addItemToCart,
  calculateCartTotals,
  removeItemFromCart,
  resolveCartItems,
  updateItemQuantityInCart,
} from '../utils/cartCalculations';
import {
  clearStoredCart,
  loadStoredCart,
  saveStoredCart,
} from '../services/storage';
import { CartContext } from './CartContext';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialLoadResult = useMemo(() => loadStoredCart(PRODUCTS), []);

  const [storedItems, setStoredItems] = useState<CartStorageItem[]>(
    initialLoadResult.items,
  );

  const [feedback, setFeedback] = useState<CartFeedback | null>(
    initialLoadResult.notice
      ? { type: 'warning', message: initialLoadResult.notice }
      : null,
  );

  const clearFeedback = (): void => {
    setFeedback(null);
  };

  const items: CartItem[] = useMemo(() => {
    return resolveCartItems(storedItems, PRODUCTS);
  }, [storedItems]);

  const totals: CartTotals = useMemo(() => {
    return calculateCartTotals(items);
  }, [items]);

  const addToCart = (productId: string, quantity: number): boolean => {
    const result = addItemToCart(storedItems, productId, quantity, PRODUCTS);

    setStoredItems(result.updatedItems);

    if (result.success) {
      const saveResult = saveStoredCart(result.updatedItems);
      if (!saveResult.success && saveResult.error) {
        setFeedback({
          type: 'warning',
          message: `${result.message} (${saveResult.error})`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: result.message,
        });
      }
    } else {
      setFeedback({
        type: 'error',
        message: result.message,
      });
    }

    return result.success;
  };

  const updateQuantity = (productId: string, quantity: number): void => {
    const result = updateItemQuantityInCart(
      storedItems,
      productId,
      quantity,
      PRODUCTS,
    );

    setStoredItems(result.updatedItems);

    const saveResult = saveStoredCart(result.updatedItems);

    if (!result.success) {
      setFeedback({
        type: 'warning',
        message: result.message,
      });
    } else if (!saveResult.success && saveResult.error) {
      setFeedback({
        type: 'warning',
        message: saveResult.error,
      });
    }
  };

  const removeFromCart = (productId: string): void => {
    const product = PRODUCTS.find((item) => item.id === productId);
    const updated = removeItemFromCart(storedItems, productId);

    setStoredItems(updated);

    const saveResult = saveStoredCart(updated);
    const removedName = product ? product.name : 'Item';

    if (!saveResult.success && saveResult.error) {
      setFeedback({
        type: 'warning',
        message: `Removed ${removedName} from cart. (${saveResult.error})`,
      });
    } else {
      setFeedback({
        type: 'success',
        message: `Removed ${removedName} from cart.`,
      });
    }
  };

  const clearCart = (): void => {
    const clearResult = clearStoredCart();
    setStoredItems([]);
    if (!clearResult.success) {
      setFeedback({
        type: 'warning',
        message: 'The saved cart could not be cleared from local storage.',
      });
    } else {
      setFeedback(null);
    }
  };

  const getItemQuantity = (productId: string): number => {
    const match = storedItems.find((item) => item.productId === productId);
    return match ? match.quantity : 0;
  };

  const contextValue: CartContextValue = {
    items,
    totals,
    feedback,
    clearFeedback,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};
