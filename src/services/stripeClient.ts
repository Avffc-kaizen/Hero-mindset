import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null> | null = null;

export const getStripe = (publishableKey: string) => {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export const startStripeCheckout = async (backendEndpoint: string, priceId: string, metadata?: Record<string, string>) => {
  const resp = await fetch(backendEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, metadata }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Erro criando sessão de checkout: ${text}`);
  }

  const { sessionId, publishableKey, url } = await resp.json();

  if (url) {
    window.location.href = url;
    return;
  }

  if (!sessionId || !publishableKey) {
    throw new Error('Resposta inválida do servidor de checkout.');
  }

  const stripe = await getStripe(publishableKey);
  if (!stripe) throw new Error('Stripe não inicializado');

  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) throw error;
};