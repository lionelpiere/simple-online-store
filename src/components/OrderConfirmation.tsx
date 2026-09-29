import React from 'react';
import type { OrderConfirmationData } from '../types/ecommerce';
import { formatCentsToPhp } from '../utils/currency';
import '../styles/confirmation.css';

interface OrderConfirmationProps {
  order: OrderConfirmationData | null;
  onContinueShopping: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  onContinueShopping,
}) => {
  if (!order) {
    return (
      <div className="empty-cart-card">
        <h2 className="empty-cart-title">No Active Order Found</h2>
        <p className="empty-cart-text">
          Order details are kept securely in memory during checkout and are not stored permanently.
          Because this page was refreshed or no order was placed in this session, the confirmation details are no longer available.
        </p>
        <button
          type="button"
          className="back-button primary"
          onClick={onContinueShopping}
        >
          Return to catalog
        </button>
      </div>
    );
  }

  const paymentLabel =
    order.paymentMethod === 'cash_on_delivery'
      ? 'Cash on delivery (Pay when received)'
      : 'Demo card (Simulated test payment - no charge)';

  return (
    <div className="order-confirmation-container">
      <div className="confirmation-banner">
        <h1 className="confirmation-title">Order Confirmed</h1>
        <p className="confirmation-subtitle">
          Thank you for your order, {order.customer.fullName}.
        </p>
        <div className="demo-notice-callout" role="note">
          <span className="demo-notice-heading">Demonstration Notice:</span>
          <span className="demo-notice-text">
            This order is a demonstration simulation. No actual payment was collected, no real card charges were made, and no physical items will be shipped.
          </span>
        </div>
      </div>

      <div className="confirmation-meta-bar">
        <div className="meta-bar-item">
          <span className="meta-bar-label">Order Identifier</span>
          <strong className="meta-bar-value id-code">{order.orderId}</strong>
        </div>
        <div className="meta-bar-item">
          <span className="meta-bar-label">Date and Time</span>
          <span className="meta-bar-value">{order.placedAt}</span>
        </div>
        <div className="meta-bar-item">
          <span className="meta-bar-label">Payment Method</span>
          <span className="meta-bar-value">{paymentLabel}</span>
        </div>
      </div>

      <div className="confirmation-grid">
        <section
          className="confirmation-section customer-shipping-section"
          aria-label="Customer and Delivery Details"
        >
          <div className="confirmation-card">
            <h2 className="confirmation-section-title">Delivery Details</h2>

            <div className="detail-group">
              <span className="detail-label">Recipient</span>
              <span className="detail-value">{order.customer.fullName}</span>
            </div>

            <div className="detail-group">
              <span className="detail-label">Email Address</span>
              <span className="detail-value">{order.customer.email}</span>
            </div>

            {order.customer.phone && (
              <div className="detail-group">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{order.customer.phone}</span>
              </div>
            )}

            <div className="detail-group">
              <span className="detail-label">Shipping Address</span>
              <address className="detail-address">
                <div>{order.shipping.streetAddress}</div>
                {order.shipping.addressLine2 && (
                  <div>{order.shipping.addressLine2}</div>
                )}
                <div>
                  {order.shipping.city}
                  {order.shipping.stateOrProvince
                    ? `, ${order.shipping.stateOrProvince}`
                    : ''}{' '}
                  {order.shipping.postalCode}
                </div>
                <div>{order.shipping.country}</div>
              </address>
            </div>

            <div className="memory-session-note">
              <span>
                Session memory: This confirmation exists in memory for this session and will be cleared upon page refresh.
              </span>
            </div>
          </div>
        </section>

        <section
          className="confirmation-section summary-items-section"
          aria-label="Purchased Items Snapshot"
        >
          <div className="confirmation-card">
            <h2 className="confirmation-section-title">
              Purchased Items ({order.totals.totalItemCount})
            </h2>

            <ul className="confirmation-items-list" aria-label="Purchased items">
              {order.items.map((item) => {
                const lineTotal = item.product.priceCents * item.quantity;
                return (
                  <li key={item.product.id} className="confirmation-item-row">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="confirmation-item-image"
                    />
                    <div className="confirmation-item-info">
                      <span className="confirmation-item-name">
                        {item.product.name}
                      </span>
                      <span className="confirmation-item-category">
                        {item.product.category}
                      </span>
                      <span className="confirmation-item-pricing">
                        {formatCentsToPhp(item.product.priceCents)} &times;{' '}
                        {item.quantity}
                      </span>
                    </div>
                    <div className="confirmation-item-total">
                      {formatCentsToPhp(lineTotal)}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="confirmation-totals-table">
              <div className="confirmation-total-row">
                <span>Subtotal</span>
                <span>{formatCentsToPhp(order.totals.subtotalCents)}</span>
              </div>
              <div className="confirmation-total-row">
                <span>Shipping Fee</span>
                <span>
                  {order.totals.shippingCents === 0
                    ? 'Free'
                    : formatCentsToPhp(order.totals.shippingCents)}
                </span>
              </div>
              <div className="confirmation-total-row total-highlight">
                <span>Total Amount</span>
                <span>{formatCentsToPhp(order.totals.totalCents)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="confirmation-actions">
        <button
          type="button"
          className="continue-shopping-button confirmation-continue-button"
          onClick={onContinueShopping}
        >
          Continue shopping
        </button>
      </div>
    </div>
  );
};
