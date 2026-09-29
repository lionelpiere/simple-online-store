import React, { useState } from 'react';
import type { Product } from '../types/ecommerce';
import { formatCentsToPhp } from '../utils/currency';
import { useCart } from '../context/CartContext';
import '../styles/catalog.css';

interface ProductDetailProps {
  product: Product | null;
  onBackToProducts: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onBackToProducts,
}) => {
  const { addToCart, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState<number>(1);

  if (!product) {
    return (
      <div className="product-not-found-card">
        <h2 className="not-found-title">Product not found</h2>
        <p className="not-found-text">
          The requested product could not be found in our current catalog.
        </p>
        <button
          type="button"
          className="back-button primary"
          onClick={onBackToProducts}
        >
          Back to catalog
        </button>
      </div>
    );
  }

  const inCartQuantity = getItemQuantity(product.id);
  const remainingStock = Math.max(0, product.stock - inCartQuantity);
  const isOutOfStock = !product.isAvailable || product.stock <= 0;
  const isStockExhaustedInCart = !isOutOfStock && remainingStock === 0;
  const isLimitedStock = !isOutOfStock && remainingStock > 0 && remainingStock <= 3;

  const handleIncrement = (): void => {
    if (quantity < remainingStock) {
      setQuantity((previous) => previous + 1);
    }
  };

  const handleDecrement = (): void => {
    if (quantity > 1) {
      setQuantity((previous) => previous - 1);
    }
  };

  const handleQuantityInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const parsed = parseInt(event.target.value, 10);
    if (Number.isNaN(parsed)) {
      setQuantity(1);
      return;
    }
    const clamped = Math.max(1, Math.min(parsed, remainingStock));
    setQuantity(clamped);
  };

  const handleAddToCart = (): void => {
    if (remainingStock <= 0) {
      return;
    }
    const success = addToCart(product.id, quantity);
    if (success) {
      setQuantity(1);
    }
  };

  return (
    <div className="product-detail-container">
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <button
          type="button"
          className="back-link-button"
          onClick={onBackToProducts}
        >
          &larr; Back to catalog
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-category">{product.category}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <div className="product-detail-layout">
        <div className="product-detail-media">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-detail-image"
          />
        </div>

        <div className="product-detail-info">
          <span className="product-detail-category">{product.category}</span>
          <h1 className="product-detail-title">{product.name}</h1>

          <div className="product-detail-meta">
            <div className="product-detail-rating">
              <svg
                className="rating-icon"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                width="18"
                height="18"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="rating-score-text">
                {product.rating.toFixed(1)} / 5.0
              </span>
            </div>

            <span className="meta-divider">|</span>

            <span className="product-id-label">Item ID: {product.id}</span>
          </div>

          <div className="product-detail-price-box">
            <span className="product-detail-price">
              {formatCentsToPhp(product.priceCents)}
            </span>
          </div>

          <div className="product-detail-stock-status">
            {isOutOfStock && (
              <div className="stock-alert stock-alert-out">
                <span className="stock-badge stock-out">Out of stock</span>
                <span className="stock-alert-text">
                  This item is currently unavailable for order.
                </span>
              </div>
            )}
            {isStockExhaustedInCart && (
              <div className="stock-alert stock-alert-limited">
                <span className="stock-badge stock-limited">
                  Maximum stock in cart
                </span>
                <span className="stock-alert-text">
                  You already have all {product.stock} available unit(s) in your cart.
                </span>
              </div>
            )}
            {isLimitedStock && (
              <div className="stock-alert stock-alert-limited">
                <span className="stock-badge stock-limited">
                  Limited stock: Only {remainingStock} remaining
                </span>
                <span className="stock-alert-text">
                  {inCartQuantity > 0 && `(${inCartQuantity} already in your cart)`}
                </span>
              </div>
            )}
            {!isOutOfStock && !isStockExhaustedInCart && !isLimitedStock && (
              <div className="stock-alert stock-alert-available">
                <span className="stock-badge stock-available">
                  In stock: {remainingStock} available to add
                </span>
                <span className="stock-alert-text">
                  {inCartQuantity > 0 && `(${inCartQuantity} already in your cart)`}
                </span>
              </div>
            )}
          </div>

          <div className="product-detail-description">
            <h2 className="section-subtitle">Description</h2>
            <p className="description-text">{product.description}</p>
          </div>

          <div className="product-detail-actions">
            <div className="quantity-control-group">
              <label htmlFor="detail-quantity-input" className="quantity-label">
                Quantity:
              </label>
              <div className="quantity-stepper">
                <button
                  type="button"
                  className="stepper-button"
                  onClick={handleDecrement}
                  disabled={remainingStock <= 0 || quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  id="detail-quantity-input"
                  type="number"
                  className="stepper-input"
                  min="1"
                  max={remainingStock}
                  value={remainingStock <= 0 ? 0 : quantity}
                  onChange={handleQuantityInputChange}
                  disabled={remainingStock <= 0}
                  aria-label="Product quantity"
                />
                <button
                  type="button"
                  className="stepper-button"
                  onClick={handleIncrement}
                  disabled={remainingStock <= 0 || quantity >= remainingStock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="cart-action-group">
              <button
                type="button"
                className={`add-to-cart-button ${
                  remainingStock <= 0 ? 'disabled' : 'primary'
                }`}
                onClick={handleAddToCart}
                disabled={remainingStock <= 0}
                aria-disabled={remainingStock <= 0}
              >
                {isOutOfStock
                  ? 'Out of stock'
                  : isStockExhaustedInCart
                  ? 'All units in cart'
                  : 'Add to cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
