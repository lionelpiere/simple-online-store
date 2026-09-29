import React from 'react';
import type { CartItem, CartTotals } from '../types/ecommerce';
import { formatCentsToPhp } from '../utils/currency';
import '../styles/checkout.css';

interface CheckoutOrderSummaryProps {
  items: readonly CartItem[];
  totals: CartTotals;
  onReturnToCart: () => void;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  items,
  totals,
  onReturnToCart,
}) => {
  const isFreeShipping = totals.shippingCents === 0 && totals.subtotalCents > 0;

  return (
    <aside className="checkout-summary-sidebar" aria-label="Checkout order summary">
      <div className="checkout-summary-card">
        <div className="checkout-summary-header">
          <h2 className="summary-title">
            Order Review ({totals.totalItemCount}{' '}
            {totals.totalItemCount === 1 ? 'item' : 'items'})
          </h2>
          <button
            type="button"
            className="edit-cart-link"
            onClick={onReturnToCart}
          >
            Edit cart
          </button>
        </div>

        <ul className="checkout-items-list" aria-label="Items in order">
          {items.map((item) => (
            <li key={item.product.id} className="checkout-item-row">
              <div className="checkout-item-thumbnail">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="checkout-item-img"
                />
              </div>
              <div className="checkout-item-info">
                <span className="checkout-item-name">{item.product.name}</span>
                <span className="checkout-item-qty">
                  Qty: {item.quantity} &times;{' '}
                  {formatCentsToPhp(item.product.priceCents)}
                </span>
              </div>
              <div className="checkout-item-price">
                {formatCentsToPhp(item.product.priceCents * item.quantity)}
              </div>
            </li>
          ))}
        </ul>

        <div className="summary-divider" />

        <div className="summary-row">
          <span className="summary-label">Subtotal</span>
          <span className="summary-value">
            {formatCentsToPhp(totals.subtotalCents)}
          </span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Shipping</span>
          <span className="summary-value">
            {isFreeShipping ? (
              <span className="free-shipping-tag">FREE</span>
            ) : (
              formatCentsToPhp(totals.shippingCents)
            )}
          </span>
        </div>

        <div className="summary-divider" />

        <div className="summary-row total-row">
          <span className="total-label">Total to Pay</span>
          <span className="total-value">
            {formatCentsToPhp(totals.totalCents)}
          </span>
        </div>

        <button
          type="button"
          className="back-to-cart-button"
          onClick={onReturnToCart}
        >
          &larr; Return to shopping cart
        </button>
      </div>
    </aside>
  );
};
