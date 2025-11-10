
import { startStripeCheckout } from './stripeClient';
import { PRODUCTS } from '../constants';
import { PaymentProvider } from '../types';

export const buyProduct = async (productId: string, userMetadata?: Record<string, string>) => {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) throw new Error('Produto não encontrado');

  // Use Eduzz as a fallback or for specific products if needed
  if (product.provider === PaymentProvider.EDUZZ && product.eduzzId) {
    // For Eduzz, we still need to construct the URL with user info for post-purchase flow
    let url = `https://chk.eduzz.com/${product.eduzzId}`;
    if (userMetadata?.userId) {
        // This is a simplified example; a robust solution might involve a backend to pre-fill Eduzz checkout
    }
    window.location.href = url;
    return;
  }

  // Primary Flow: Stripe
  if (product.provider === PaymentProvider.STRIPE && product.priceId) {
      await startStripeCheckout(product.priceId, {
          ...userMetadata,
          internalProductId: productId
      });
  } else {
      throw new Error('Configuração de pagamento inválida para este produto.');
  }
};
