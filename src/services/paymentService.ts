import { STRIPE_PUBLIC_KEY, PRODUCTS } from '../constants';
import { PaymentProvider } from '../types';
import { functions as firebaseFunctions, isFirebaseConfigured } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';

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

  if (product.provider === PaymentProvider.STRIPE && product.priceId) {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase não está configurado. Pagamento indisponível.');
    }
    const functions = firebaseFunctions;
    if (!functions) {
        throw new Error('Firebase Functions indisponível.');
    }

    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      
      const response = await createCheckoutSession({ 
          priceId: product.priceId,
          internalProductId: product.id,
          ...metadata,
      });

      const { id: sessionId } = response.data as { id?: string };
      
      if (sessionId) {
        const stripePublicKey = STRIPE_PUBLIC_KEY;
        if (!stripePublicKey || stripePublicKey.includes('REPLACE_WITH')) {
            throw new Error("A chave pública do Stripe não está configurada corretamente em src/constants.ts.");
        }
        const stripe = await loadStripe(stripePublicKey);
        if (!stripe) {
            throw new Error("Não foi possível carregar o sistema de pagamento.");
        }
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
            console.error("Stripe redirectToCheckout error:", error);
            throw new Error(error.message);
        }
      } else {
        throw new Error('ID da sessão de checkout não recebido.');
      }
    } catch (error: any) {
      console.error("Firebase Functions call or Stripe redirect failed:", error);
      throw new Error(error.message || 'Falha ao iniciar o processo de pagamento.');
    }
  } else {
    throw new Error('Configuração de pagamento inválida para este produto.');
  }
};
