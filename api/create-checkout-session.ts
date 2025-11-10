
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// These should ideally be in env vars, but for this exercise, we'll define them here
// to determine the checkout mode. They MUST match the frontend constants.
const ONE_TIME_PAYMENT_PRICE_IDS = [
  'price_1PshrWELwcc78QutdK8hB29k', // STRIPE_HERO_PRICE_ID
];

// Initialize Stripe with Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or specific domain
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { priceId, metadata } = req.body;

    if (!priceId) {
      res.status(400).json({ error: 'Price ID is required' });
      return;
    }

    const mode = ONE_TIME_PAYMENT_PRICE_IDS.includes(priceId) ? 'payment' : 'subscription';
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://aistudio.google.com/app/project/66a858e5f3c09f3c78f8';
    const internalProductId = metadata?.internalProductId || 'unknown_product';
    
    const session = await stripe.checkout.sessions.create({
      mode: mode,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${frontendUrl}/#/payment-success/${internalProductId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/?canceled=true`,
      metadata: {
          ...metadata,
          priceId: priceId
      }
    });

    res.json({ 
        sessionId: session.id, 
        url: session.url
    });
  } catch (err: any) {
    console.error('Stripe Session Creation Error:', err);
    res.status(500).json({ error: `Internal Server Error: ${err.message}` });
  }
}
