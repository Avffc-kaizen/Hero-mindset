import { PRODUCTS } from '../constants';
import { PaymentProvider } from '../types';
import { functions as firebaseFunctions, isFirebaseConfigured } from '../firebase';
import { httpsCallable } from 'firebase/functions';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

export const createCheckoutSession = async (productId: string): Promise<{ sessionUrl: string }> => {
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
    if (!isFirebaseConfigured || !firebaseFunctions) {
      throw new Error('Firebase não está configurado. Pagamento indisponível.');
    }

    try {
      const createCheckoutSessionFunc = httpsCallable(firebaseFunctions, 'createCheckoutSession');
      
      const response = await createCheckoutSessionFunc({ 
          priceId: product.priceId,
          internalProductId: product.id,
      });

      const { url: sessionUrl } = response.data as { url?: string };
      
      if (sessionUrl) {
        return { sessionUrl };
      } else {
        throw new Error('O servidor não retornou uma URL de checkout.');
      }
    } catch (error: any) {
      console.error("Firebase Functions call failed:", error);
      throw new Error(error.message || 'Falha ao criar a sessão de pagamento.');
    }
  } else {
    throw new Error('Configuração de pagamento inválida para este produto.');
  }
};
