
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_PUBLIC_KEY, BACKEND_URL } from '../constants';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export const redirectToCheckout = async (priceId: string, userEmail?: string) => {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe failed to load');

  try {
    // Call backend to create session
    const response = await fetch(`${BACKEND_URL}/createCheckoutSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email: userEmail })
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Backend Error: ${errText}`);
    }

    const { sessionId } = await response.json();
    
    if (!sessionId) {
        throw new Error('Session ID missing from response');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      console.error('Stripe redirect error:', error);
      alert('Erro ao redirecionar para o pagamento. Tente novamente.');
    }
  } catch (err) {
    console.error('Failed to initiate checkout:', err);
    alert('Erro ao iniciar pagamento. Verifique sua conexão ou contate o suporte.');
  }
};
