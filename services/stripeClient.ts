
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_PUBLIC_KEY, BACKEND_URL } from '../constants';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!STRIPE_PUBLIC_KEY) {
      console.error("Stripe public key is not set.");
      return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Use relative path if BACKEND_URL is just /api, otherwise use full URL
const CREATE_CHECKOUT_ENDPOINT = `${BACKEND_URL.startsWith('http') ? BACKEND_URL : ''}/create-checkout-session`;

export const startStripeCheckout = async (priceId: string, metadata?: Record<string, string>) => {
  try {
    const resp = await fetch(CREATE_CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, metadata }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Error creating checkout session: ${text}`);
    }

    const { sessionId, url } = await resp.json();

    if (url) {
      window.location.href = url;
      return;
    }

    if (!sessionId) {
      throw new Error('Invalid response from checkout server.');
    }

    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe could not be initialized. Check your publishable key.');

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw error;
  } catch (err: any) {
      console.error("Stripe Checkout failed:", err);
      throw new Error(err.message || "Could not start Stripe checkout.");
  }
};
