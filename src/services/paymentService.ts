import { PRODUCTS } from '../constants';
import { PaymentProvider } from '../types';
import { functions, isFirebaseConfigured } from '../firebase';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

export const buyProduct = async (productId: string, metadata?: Record<string, any>) => {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) throw new Error('Produto não encontrado');

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      value: product.price / 100,
      currency: 'BRL',
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
    });
  }

  if (product.provider === PaymentProvider.EDUZZ && product.eduzzId) {
    // Fallback Eduzz
    window.location.href = `https://chk.eduzz.com/${product.eduzzId}`;
    return;
  }

  // Primary Flow: Stripe via Firebase Functions
  if (product.provider === PaymentProvider.STRIPE && product.priceId) {
    if (!isFirebaseConfigured || !functions) {
      throw new Error('Firebase não está configurado. Pagamento indisponível.');
    }
    try {
      const createCheckoutSession = functions.httpsCallable('createCheckoutSession');
      
      const response = await createCheckoutSession({ 
          priceId: product.priceId,
          internalProductId: product.id,
          metadata: metadata,
      });

      const { url } = response.data as { url?: string };
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('URL de checkout não recebida.');
      }
    } catch (error) {
      console.error("Firebase Functions call failed:", error);
      throw new Error('Falha ao iniciar o processo de pagamento.');
    }
  } else {
    throw new Error('Configuração de pagamento inválida para este produto.');
  }
};
