import React from 'react';
import type { CartItem } from '../types/ecommerce';
import { formatCentsToPhp } from '../utils/currency';
import { useCart } from '../context/CartContext';
import '../styles/cart.css';

interface CartItemRowProps {
  item: CartItem;
  onSelectProduct: (productId: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onSelectProduct,
}) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  const handleIncrement = (): void => {
    if (quantity < product.stock) {
      updateQuantity(product.id, quantity + 1);
    }
  };

  const handleDecrement = (): void => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  const handleQuantityInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const parsed = parseInt(event.target.value, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(1, Math.min(parsed, product.stock));
      updateQuantity(product.id, clamped);
    }
  };

  const handleRemove = (): void => {
    removeFromCart(product.id);
  };

  const lineTotalCents = product.priceCents * quantity;
  const isMaxStockReached = quantity >= product.stock;

  return (
    <article className="cart-item-row">
      <div
        className="cart-item-image-wrap"
        onClick={(): void => onSelectProduct(product.id)}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="cart-item-image"
        />
      </div>

      <div className="cart-item-details">
        <span className="cart-item-category">{product.category}</span>
        <button
          type="button"
          className="cart-item-title-link"
          onClick={(): void => onSelectProduct(product.id)}
        >
          {product.name}
        </button>
        <span className="cart-item-unit-price">
          Unit price: {formatCentsToPhp(product.priceCents)}
        </span>
      </div>

      <div className="cart-item-quantity-column">
        <div className="quantity-stepper small">
          <button
            type="button"
            className="stepper-button"
            onClick={handleDecrement}
            disabled={quantity <= 1}
            aria-label={`Decrease quantity of ${product.name}`}
          >
            -
          </button>
          <input
            type="number"
            className="stepper-input"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={handleQuantityInputChange}
            aria-label={`Quantity of ${product.name}`}
          />
          <button
            type="button"
            className="stepper-button"
            onClick={handleIncrement}
            disabled={isMaxStockReached}
            aria-label={`Increase quantity of ${product.name}`}
          >
            +
          </button>
        </div>
        {isMaxStockReached && (
          <span className="stock-limit-note">Max stock reached</span>
        )}
      </div>

      <div className="cart-item-total-column">
        <span className="cart-item-line-total">
          {formatCentsToPhp(lineTotalCents)}
        </span>
        <button
          type="button"
          className="remove-item-button"
          onClick={handleRemove}
          aria-label={`Remove ${product.name} from cart`}
        >
          Remove
        </button>
      </div>
    </article>
  );
};
