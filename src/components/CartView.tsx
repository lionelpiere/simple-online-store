import React from 'react';
import type { CartItem } from '../types/ecommerce';
import { formatCentsToPhp } from '../utils/currency';
import { FREE_SHIPPING_THRESHOLD_CENTS } from '../utils/cartCalculations';
import { useCart } from '../context/CartContext';
import { CartItemRow } from './CartItemRow';
import '../styles/cart.css';

interface CartViewProps {
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
  onSelectProduct: (productId: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({
  onContinueShopping,
  onProceedToCheckout,
  onSelectProduct,
}) => {
  const { items, totals, clearCart, feedback, clearFeedback } = useCart();

  const isFreeShipping = totals.shippingCents === 0 && totals.subtotalCents > 0;
  const centsToFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_CENTS - totals.subtotalCents,
  );

  if (items.length === 0) {
    return (
      <div className="empty-cart-card">
        <div className="empty-cart-icon-wrap">
          <svg
            className="empty-cart-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            width="64"
            height="64"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
        </div>
        <h2 className="empty-cart-title">Your shopping cart is empty</h2>
        <p className="empty-cart-text">
          You currently have no items in your cart. Explore our catalog to discover quality products.
        </p>
        <button
          type="button"
          className="back-button primary"
          onClick={onContinueShopping}
        >
          Return to shopping
        </button>
      </div>
    );
  }

  return (
    <div className="cart-view-container">
      {feedback && (
        <div
          className={`cart-feedback-banner feedback-${feedback.type}`}
          role="status"
        >
          <span className="feedback-message">{feedback.message}</span>
          <button
            type="button"
            className="feedback-dismiss-button"
            onClick={clearFeedback}
            aria-label="Dismiss feedback message"
          >
            &times;
          </button>
        </div>
      )}

      <div className="cart-view-header">
        <h1 className="page-title">
          Shopping Cart ({totals.totalItemCount}{' '}
          {totals.totalItemCount === 1 ? 'item' : 'items'})
        </h1>
        <button
          type="button"
          className="clear-cart-button"
          onClick={clearCart}
        >
          Clear all items
        </button>
      </div>

      <div className="cart-layout">
        <section className="cart-items-section" aria-label="Cart items">
          <div className="cart-items-list">
            {items.map((item: CartItem) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        </section>

        <aside className="cart-summary-sidebar" aria-label="Order summary">
          <div className="cart-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-row">
              <span className="summary-label">
                Subtotal ({totals.totalItemCount} items)
              </span>
              <span className="summary-value">
                {formatCentsToPhp(totals.subtotalCents)}
              </span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Estimated Shipping</span>
              <span className="summary-value">
                {isFreeShipping ? (
                  <span className="free-shipping-tag">FREE</span>
                ) : (
                  formatCentsToPhp(totals.shippingCents)
                )}
              </span>
            </div>

            <div className="shipping-progress-box">
              {isFreeShipping ? (
                <span className="shipping-qualify-message">
                  Free shipping unlocked for orders over ₱1,000.00
                </span>
              ) : (
                <span className="shipping-remaining-message">
                  Add {formatCentsToPhp(centsToFreeShipping)} more to qualify for FREE shipping.
                </span>
              )}
            </div>

            <div className="summary-divider" />

            <div className="summary-row total-row">
              <span className="total-label">Total</span>
              <span className="total-value">
                {formatCentsToPhp(totals.totalCents)}
              </span>
            </div>

            <button
              type="button"
              className="checkout-proceed-button"
              onClick={onProceedToCheckout}
            >
              Proceed to checkout
            </button>

            <button
              type="button"
              className="continue-shopping-button cart-continue-button"
              onClick={onContinueShopping}
            >
              Continue shopping
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
