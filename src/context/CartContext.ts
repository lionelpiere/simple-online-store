import { createContext, useContext } from 'react';
import type { CartContextValue } from '../types/ecommerce';

export const CartContext = createContext<CartContextValue | null>(null);

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
