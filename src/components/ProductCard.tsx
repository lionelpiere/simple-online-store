import React from 'react';
import type { Product } from '../types/ecommerce';
import { formatCentsToPhp } from '../utils/currency';
import '../styles/catalog.css';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
}) => {
  const handleCardClick = (): void => {
    onSelectProduct(product.id);
  };

  const isOutOfStock = !product.isAvailable || product.stock <= 0;
  const isLimitedStock = !isOutOfStock && product.stock <= 3;

  return (
    <article className="product-card" onClick={handleCardClick}>
      <div className="product-card-image-wrap">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-card-image"
          loading="lazy"
        />
        <span className="product-card-category">{product.category}</span>
      </div>

      <div className="product-card-body">
        <div className="product-card-header">
          <h2 className="product-card-title">{product.name}</h2>
          <div className="product-card-rating">
            <svg
              className="rating-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              width="16"
              height="16"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="rating-value">{product.rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="product-card-description">{product.description}</p>

        <div className="product-card-footer">
          <div className="product-card-price-wrap">
            <span className="product-card-price">
              {formatCentsToPhp(product.priceCents)}
            </span>
          </div>

          <div className="product-card-stock-wrap">
            {isOutOfStock && (
              <span className="stock-badge stock-out">Out of stock</span>
            )}
            {isLimitedStock && (
              <span className="stock-badge stock-limited">
                Only {product.stock} left
              </span>
            )}
            {!isOutOfStock && !isLimitedStock && (
              <span className="stock-badge stock-available">In stock</span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="product-card-button"
          onClick={(event: React.MouseEvent<HTMLButtonElement>): void => {
            event.stopPropagation();
            onSelectProduct(product.id);
          }}
        >
          View details
        </button>
      </div>
    </article>
  );
};
