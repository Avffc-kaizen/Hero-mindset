import { startStripeCheckout } from './stripeClient';
import { PRODUCTS, BACKEND_URL } from '../constants';
import { PaymentProvider } from '../types';

// Use relative path if BACKEND_URL is just /api, otherwise use full URL
const CREATE_CHECKOUT_ENDPOINT = `${BACKEND_URL.startsWith('http') ? BACKEND_URL : ''}/api/create-checkout-session`;

export const buyProduct = async (productId: string, userMetadata?: Record<string, string>) => {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) throw new Error('Produto não encontrado');

  if (product.provider === PaymentProvider.EDUZZ && product.eduzzId) {
    // Fallback Eduzz redirect while migrating
    window.location.href = `https://chk.eduzz.com/${product.eduzzId}`;
    return;
  }

  // Stripe Flow
  if (product.priceId) {
      await startStripeCheckout(CREATE_CHECKOUT_ENDPOINT, product.priceId, {
          ...userMetadata,
          internalProductId: productId
      });
  } else {
      throw new Error('Configuração de pagamento inválida.');
  }
};