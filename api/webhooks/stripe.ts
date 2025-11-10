
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { buffer } from 'micro';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-04-10' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) throw new Error('Missing Stripe signature or webhook secret');
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Signature Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
      if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerEmail = session.customer_details?.email || session.customer_email;
          const priceId = session.metadata?.priceId;

          if (customerEmail) {
              console.log(`Processing successful payment for ${customerEmail}, Price ID: ${priceId}`);
              
              const internalUrl = process.env.INTERNAL_API_BASE 
                ? `${process.env.INTERNAL_API_BASE}/api/internal/activate-subscription`
                : `https://${req.headers.host}/api/internal/activate-subscription`;

              const response = await fetch(internalUrl, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'x-internal-key': process.env.INTERNAL_API_KEY || '',
                  },
                  body: JSON.stringify({
                      email: customerEmail,
                      priceId: priceId,
                      sessionId: session.id,
                      metadata: session.metadata
                  })
              });

              if (!response.ok) {
                  console.error('Failed to activate subscription via internal endpoint', await response.text());
              } else {
                  console.log('Subscription activation requested successfully.');
              }
          } else {
              console.warn('Webhook received for session without customer email:', session.id);
          }
      }
      
      res.json({ received: true });
  } catch (err: any) {
      console.error('Error processing Stripe webhook:', err.message);
      res.status(500).send('Server Error while processing webhook.');
  }
}
