import React, { useState } from 'react';
import type {
  CheckoutFormData,
  OrderConfirmationData,
  PaymentMethod,
  ValidationErrors,
} from '../types/ecommerce';
import { useCart } from '../context/CartContext';
import { validateCheckoutForm } from '../utils/checkoutValidation';
import { createOrderSnapshot } from '../utils/orderPlacement';
import { CheckoutOrderSummary } from './CheckoutOrderSummary';
import '../styles/checkout.css';

interface CheckoutFormProps {
  onReturnToCart: () => void;
  onReturnToCatalog: () => void;
  onOrderPlaced: (order: OrderConfirmationData) => void;
}

const FIELD_INPUT_ID_MAP: Record<string, string> = {
  'customer.fullName': 'fullName',
  'customer.email': 'email',
  'shipping.streetAddress': 'streetAddress',
  'shipping.city': 'city',
  'shipping.postalCode': 'postalCode',
  'shipping.country': 'country',
  paymentMethod: 'payment-cod',
};

const FIELD_ORDER = [
  'customer.fullName',
  'customer.email',
  'shipping.streetAddress',
  'shipping.city',
  'shipping.postalCode',
  'shipping.country',
  'paymentMethod',
];

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  onReturnToCart,
  onReturnToCatalog,
  onOrderPlaced,
}) => {
  const { items, totals, clearCart } = useCart();

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer: {
      fullName: '',
      email: '',
    },
    shipping: {
      streetAddress: '',
      addressLine2: '',
      city: '',
      stateOrProvince: '',
      postalCode: '',
      country: 'Philippines',
    },
    paymentMethod: 'cash_on_delivery',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [cartError, setCartError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (items.length === 0) {
    return (
      <div className="empty-cart-card">
        <h2 className="empty-cart-title">Your shopping cart is empty</h2>
        <p className="empty-cart-text">
          Checkout cannot proceed without items. Please add products to your cart before checking out.
        </p>
        <button
          type="button"
          className="back-button primary"
          onClick={onReturnToCatalog}
        >
          Return to catalog
        </button>
      </div>
    );
  }

  const handleCustomerChange = (
    field: 'fullName' | 'email',
    value: string,
  ): void => {
    setFormData((previous) => ({
      ...previous,
      customer: {
        ...previous.customer,
        [field]: value,
      },
    }));
    if (errors[`customer.${field}`]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[`customer.${field}`];
        return next;
      });
    }
  };

  const handleShippingChange = (
    field:
      | 'streetAddress'
      | 'addressLine2'
      | 'city'
      | 'stateOrProvince'
      | 'postalCode'
      | 'country',
    value: string,
  ): void => {
    setFormData((previous) => ({
      ...previous,
      shipping: {
        ...previous.shipping,
        [field]: value,
      },
    }));
    if (errors[`shipping.${field}`]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[`shipping.${field}`];
        return next;
      });
    }
  };

  const handlePaymentChange = (method: PaymentMethod): void => {
    setFormData((previous) => ({
      ...previous,
      paymentMethod: method,
    }));
    if (errors.paymentMethod) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next.paymentMethod;
        return next;
      });
    }
  };

  const handleSubmitOrder = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const result = validateCheckoutForm(formData, items);

    if (!result.isValid) {
      setErrors(result.errors);
      setCartError(result.cartError);
      setIsSubmitting(false);

      for (const field of FIELD_ORDER) {
        if (result.errors[field]) {
          const elementId = FIELD_INPUT_ID_MAP[field];
          const element = document.getElementById(elementId);
          if (element) {
            element.focus();
          }
          break;
        }
      }
      return;
    }

    setErrors({});
    setCartError(null);

    const snapshot = createOrderSnapshot(formData, items, totals);
    clearCart();
    onOrderPlaced(snapshot);
    setIsSubmitting(false);
  };

  return (
    <div className="checkout-view-container">
      <div className="checkout-layout">
        <section className="checkout-form-section" aria-label="Customer and Shipping Details">
          <form className="checkout-form" onSubmit={handleSubmitOrder} noValidate>
            {cartError && (
              <div className="checkout-alert checkout-alert-error" role="alert">
                <span className="alert-message">{cartError}</span>
              </div>
            )}

            <div className="demo-checkout-badge-callout" role="note">
              <span className="demo-badge-title">Demonstration Checkout:</span>
              <span className="demo-badge-text">
                This store is a simulation. No real payment is required, and no credit card numbers or sensitive details will ever be requested.
              </span>
            </div>

            <fieldset className="form-fieldset">
              <legend className="fieldset-legend">1. Customer Information</legend>

              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name <span className="required-star">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className={`form-input ${errors['customer.fullName'] ? 'input-error' : ''}`}
                  value={formData.customer.fullName}
                  onChange={(e): void => handleCustomerChange('fullName', e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="name"
                  aria-required="true"
                  aria-invalid={Boolean(errors['customer.fullName'])}
                  aria-describedby={
                    errors['customer.fullName'] ? 'fullName-error' : undefined
                  }
                />
                {errors['customer.fullName'] && (
                  <span id="fullName-error" className="field-error-message">
                    {errors['customer.fullName']}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="required-star">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input ${errors['customer.email'] ? 'input-error' : ''}`}
                  value={formData.customer.email}
                  onChange={(e): void => handleCustomerChange('email', e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={Boolean(errors['customer.email'])}
                  aria-describedby={errors['customer.email'] ? 'email-error' : undefined}
                />
                {errors['customer.email'] && (
                  <span id="email-error" className="field-error-message">
                    {errors['customer.email']}
                  </span>
                )}
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <legend className="fieldset-legend">2. Shipping Address</legend>

              <div className="form-group">
                <label htmlFor="streetAddress" className="form-label">
                  Street Address <span className="required-star">*</span>
                </label>
                <input
                  id="streetAddress"
                  name="streetAddress"
                  type="text"
                  className={`form-input ${
                    errors['shipping.streetAddress'] ? 'input-error' : ''
                  }`}
                  value={formData.shipping.streetAddress}
                  onChange={(e): void =>
                    handleShippingChange('streetAddress', e.target.value)
                  }
                  disabled={isSubmitting}
                  autoComplete="street-address"
                  aria-required="true"
                  aria-invalid={Boolean(errors['shipping.streetAddress'])}
                  aria-describedby={
                    errors['shipping.streetAddress']
                      ? 'streetAddress-error'
                      : undefined
                  }
                />
                {errors['shipping.streetAddress'] && (
                  <span id="streetAddress-error" className="field-error-message">
                    {errors['shipping.streetAddress']}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="addressLine2" className="form-label">
                  Apartment, Suite, Unit (Optional)
                </label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  type="text"
                  className="form-input"
                  value={formData.shipping.addressLine2 ?? ''}
                  onChange={(e): void =>
                    handleShippingChange('addressLine2', e.target.value)
                  }
                  disabled={isSubmitting}
                  autoComplete="address-line2"
                />
              </div>

              <div className="form-row-two-col">
                <div className="form-group">
                  <label htmlFor="city" className="form-label">
                    City <span className="required-star">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className={`form-input ${errors['shipping.city'] ? 'input-error' : ''}`}
                    value={formData.shipping.city}
                    onChange={(e): void =>
                      handleShippingChange('city', e.target.value)
                    }
                    disabled={isSubmitting}
                    autoComplete="address-level2"
                    aria-required="true"
                    aria-invalid={Boolean(errors['shipping.city'])}
                    aria-describedby={
                      errors['shipping.city'] ? 'city-error' : undefined
                    }
                  />
                  {errors['shipping.city'] && (
                    <span id="city-error" className="field-error-message">
                      {errors['shipping.city']}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="stateOrProvince" className="form-label">
                    Region or Province (Optional)
                  </label>
                  <input
                    id="stateOrProvince"
                    name="stateOrProvince"
                    type="text"
                    className="form-input"
                    value={formData.shipping.stateOrProvince ?? ''}
                    onChange={(e): void =>
                      handleShippingChange('stateOrProvince', e.target.value)
                    }
                    disabled={isSubmitting}
                    autoComplete="address-level1"
                  />
                </div>
              </div>

              <div className="form-row-two-col">
                <div className="form-group">
                  <label htmlFor="postalCode" className="form-label">
                    Postal Code <span className="required-star">*</span>
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    className={`form-input ${
                      errors['shipping.postalCode'] ? 'input-error' : ''
                    }`}
                    value={formData.shipping.postalCode}
                    onChange={(e): void =>
                      handleShippingChange('postalCode', e.target.value)
                    }
                    disabled={isSubmitting}
                    autoComplete="postal-code"
                    aria-required="true"
                    aria-invalid={Boolean(errors['shipping.postalCode'])}
                    aria-describedby={
                      errors['shipping.postalCode']
                        ? 'postalCode-error'
                        : undefined
                    }
                  />
                  {errors['shipping.postalCode'] && (
                    <span id="postalCode-error" className="field-error-message">
                      {errors['shipping.postalCode']}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="country" className="form-label">
                    Country <span className="required-star">*</span>
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    className={`form-input ${
                      errors['shipping.country'] ? 'input-error' : ''
                    }`}
                    value={formData.shipping.country}
                    onChange={(e): void =>
                      handleShippingChange('country', e.target.value)
                    }
                    disabled={isSubmitting}
                    autoComplete="country-name"
                    aria-required="true"
                    aria-invalid={Boolean(errors['shipping.country'])}
                    aria-describedby={
                      errors['shipping.country'] ? 'country-error' : undefined
                    }
                  />
                  {errors['shipping.country'] && (
                    <span id="country-error" className="field-error-message">
                      {errors['shipping.country']}
                    </span>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <legend className="fieldset-legend">3. Payment Method</legend>

              <div className="payment-options-group" role="radiogroup" aria-label="Payment method">
                <label
                  htmlFor="payment-cod"
                  className={`payment-option-card ${
                    formData.paymentMethod === 'cash_on_delivery' ? 'selected' : ''
                  }`}
                >
                  <input
                    id="payment-cod"
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={formData.paymentMethod === 'cash_on_delivery'}
                    onChange={(): void => handlePaymentChange('cash_on_delivery')}
                    disabled={isSubmitting}
                  />
                  <div className="payment-option-text">
                    <span className="payment-title">Cash on delivery</span>
                    <span className="payment-description">
                      Pay with cash upon package receipt. No advance payment required.
                    </span>
                  </div>
                </label>

                <label
                  htmlFor="payment-demo-card"
                  className={`payment-option-card ${
                    formData.paymentMethod === 'demo_card' ? 'selected' : ''
                  }`}
                >
                  <input
                    id="payment-demo-card"
                    type="radio"
                    name="paymentMethod"
                    value="demo_card"
                    checked={formData.paymentMethod === 'demo_card'}
                    onChange={(): void => handlePaymentChange('demo_card')}
                    disabled={isSubmitting}
                  />
                  <div className="payment-option-text">
                    <span className="payment-title">Demo card</span>
                    <span className="payment-description">
                      Simulated test payment. No real credit card details are needed.
                    </span>
                  </div>
                </label>
              </div>

              {errors.paymentMethod && (
                <span className="field-error-message">{errors.paymentMethod}</span>
              )}
            </fieldset>

            <div className="checkout-action-row">
              <button
                type="submit"
                className="place-order-button"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Processing order...' : 'Place demonstration order'}
              </button>
              <p className="order-placement-note">
                By placing this demonstration order, no payment will be collected and no physical items will be shipped.
              </p>
            </div>
          </form>
        </section>

        <CheckoutOrderSummary
          items={items}
          totals={totals}
          onReturnToCart={onReturnToCart}
        />
      </div>
    </div>
  );
};
