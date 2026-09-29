import React, { useState } from 'react';
import type { ActiveView, OrderConfirmationData, Product } from './types/ecommerce';
import { PRODUCTS } from './data/products';
import { CartProvider } from './context/CartProvider';
import { useCart } from './context/CartContext';
import { ProductList } from './components/ProductList';
import { ProductDetail } from './components/ProductDetail';
import { CartView } from './components/CartView';
import { CheckoutForm } from './components/CheckoutForm';
import { OrderConfirmation } from './components/OrderConfirmation';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ActiveView>('products');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmationData | null>(null);

  const { totals, feedback, clearFeedback } = useCart();

  const handleNavigateToProducts = (): void => {
    setSelectedProductId(null);
    setCurrentView('products');
  };

  const handleNavigateToCart = (): void => {
    setSelectedProductId(null);
    setCurrentView('cart');
  };

  const handleNavigateToCheckout = (): void => {
    setSelectedProductId(null);
    setCurrentView('checkout');
  };

  const handleSelectProduct = (productId: string): void => {
    setSelectedProductId(productId);
    setCurrentView('product_detail');
  };

  const handleBackToProducts = (): void => {
    setSelectedProductId(null);
    setCurrentView('products');
  };

  const handleOrderPlaced = (order: OrderConfirmationData): void => {
    setConfirmedOrder(order);
    setSelectedProductId(null);
    setCurrentView('order_confirmation');
  };

  const selectedProduct: Product | null = selectedProductId
    ? PRODUCTS.find((product: Product) => product.id === selectedProductId) ?? null
    : null;

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-container">
          <button
            type="button"
            className="brand-link"
            onClick={handleNavigateToProducts}
          >
            <span>Modern Goods</span>
            <span className="brand-badge">Store</span>
          </button>

          <nav className="main-nav" aria-label="Main Navigation">
            <button
              type="button"
              className={`nav-button ${
                currentView === 'products' || currentView === 'product_detail'
                  ? 'active'
                  : ''
              }`}
              onClick={handleNavigateToProducts}
            >
              Products
            </button>
            <button
              type="button"
              className={`nav-button ${currentView === 'cart' ? 'active' : ''}`}
              onClick={handleNavigateToCart}
            >
              Cart
              <span className="cart-counter-badge">
                {totals.totalItemCount}
              </span>
            </button>
            <button
              type="button"
              className={`nav-button ${
                currentView === 'checkout' ? 'active' : ''
              }`}
              onClick={handleNavigateToCheckout}
            >
              Checkout
            </button>
          </nav>
        </div>
      </header>

      {feedback && (
        <aside
          className={`global-feedback-banner feedback-${feedback.type}`}
          role="status"
        >
          <div className="feedback-content-wrap">
            <span className="feedback-message">{feedback.message}</span>
            <button
              type="button"
              className="feedback-dismiss-button"
              onClick={clearFeedback}
              aria-label="Dismiss message"
            >
              &times;
            </button>
          </div>
        </aside>
      )}

      <main className="main-content">
        <div className="page-container">
          {currentView === 'products' && (
            <>
              <div className="page-header">
                <h1 className="page-title">Curated Collection</h1>
                <p className="page-description">
                  Explore our selection of quality goods across electronics, apparel, home, and books.
                </p>
              </div>
              <ProductList
                products={PRODUCTS}
                onSelectProduct={handleSelectProduct}
              />
            </>
          )}

          {currentView === 'product_detail' && (
            <ProductDetail
              product={selectedProduct}
              onBackToProducts={handleBackToProducts}
            />
          )}

          {currentView === 'cart' && (
            <CartView
              onContinueShopping={handleNavigateToProducts}
              onProceedToCheckout={handleNavigateToCheckout}
              onSelectProduct={handleSelectProduct}
            />
          )}

          {currentView === 'checkout' && (
            <div className="checkout-page-wrap">
              <div className="page-header">
                <h1 className="page-title">Checkout</h1>
                <p className="page-description">
                  Provide your customer and delivery details to prepare your order.
                </p>
              </div>
              <CheckoutForm
                onReturnToCart={handleNavigateToCart}
                onReturnToCatalog={handleNavigateToProducts}
                onOrderPlaced={handleOrderPlaced}
              />
            </div>
          )}

          {currentView === 'order_confirmation' && (
            <OrderConfirmation
              order={confirmedOrder}
              onContinueShopping={handleNavigateToProducts}
            />
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-container">
          <span>Modern Goods E-Commerce (Philippines)</span>
          <span>Currency: Philippine Peso (PHP / ₱)</span>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
};

export default App;
