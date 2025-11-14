
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" })
  : null;

admin.initializeApp();
const db = admin.firestore();

const STRIPE_PRICES = {
  HERO_BASE: "price_1PshrWELwcc78QutdK8hB29k",
  IA_UPGRADE: "price_1PshtPELwcc78QutMvFlf3wR",
  PROTECAO_360: "price_1Pshv8ELwcc78Qut2qfW5oUh",
};
const ONE_TIME_PAYMENT_PRICE_IDS = [STRIPE_PRICES.HERO_BASE];

exports.createCheckoutSession = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!stripe) {
      console.error("CRITICAL: Stripe not configured. STRIPE_SECRET_KEY missing.");
      throw new functions.https.HttpsError("internal", "Stripe not configured.");
    }

    const { priceId, internalProductId } = data;
    if (!priceId || !internalProductId) {
      throw new functions.https.HttpsError("invalid-argument", "priceId and internalProductId are required.");
    }

    const isBaseProductPurchase = internalProductId === "hero_vitalicio";
    const mode = ONE_TIME_PAYMENT_PRICE_IDS.includes(priceId) ? "payment" : "subscription";
    const frontendUrl = "https://hero-mindset.web.app";

    const sessionParams = {
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/#/payment-success/${internalProductId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/`,
      metadata: { internalProductId, priceId },
    };

    if (context.auth) {
      sessionParams.customer_email = context.auth.token.email;
      sessionParams.metadata.uid = context.auth.uid;
    } else if (isBaseProductPurchase) {
      sessionParams.customer_email = data.email || undefined;
      sessionParams.billing_address_collection = "required";
    } else {
      throw new functions.https.HttpsError("unauthenticated", "Action requires authentication.");
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      return { id: session.id };
    } catch (e) {
      console.error("Stripe Session Error:", e);
      throw new functions.https.HttpsError("internal", "Failed to create checkout session.");
    }
  });

exports.stripeWebhook = functions
  .region("southamerica-east1")
  .runWith({ memory: "128MB" })
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST" || !stripe) {
      console.error("Webhook received non-POST request or Stripe is not initialized.");
      return res.status(400).send("Bad Request");
    }

    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error("CRITICAL: STRIPE_WEBHOOK_SECRET not set.");
      return res.status(500).send("Webhook handler configuration error: Missing secret.");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook Signature Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { uid, priceId, internalProductId } = session.metadata;

        const purchaseRef = db.collection("purchases").doc(session.id);
        const purchaseDoc = await purchaseRef.get();
        if (purchaseDoc.exists) {
          console.log(`Webhook: Purchase ${session.id} already processed.`);
          return res.json({ received: true, message: "Already processed." });
        }

        if (uid) {
          const userRef = db.collection("users").doc(uid);
          let updateData = {};
          if (priceId === STRIPE_PRICES.IA_UPGRADE || internalProductId === "mentor_ia") {
            updateData = { hasSubscription: true };
          } else if (priceId === STRIPE_PRICES.PROTECAO_360 || internalProductId === "protecao_360") {
            const allModules = ["soberano", "tita", "sabio", "monge", "lider"];
            updateData = { hasSubscription: true, activeModules: admin.firestore.FieldValue.arrayUnion(...allModules) };
          }
          if (Object.keys(updateData).length > 0) await userRef.update(updateData);

          await purchaseRef.set({
            uid,
            email: session.customer_email,
            sessionId: session.id,
            priceId,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedBy: "webhook",
          });
        } else if (internalProductId === "hero_vitalicio") {
          const name = session.customer_details?.name;
          const email = session.customer_details?.email;
          if (name && email) {
            await purchaseRef.set({
              email,
              name,
              sessionId: session.id,
              priceId,
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
              processedBy: "webhook",
              status: "verified_for_signup",
            });
          } else {
            console.error(`Webhook: Missing customer details for new user purchase ${session.id}.`);
          }
        }
      }
      res.json({ received: true });
    } catch (err) {
      console.error(`Stripe Processing Error: ${err.message}`);
      res.status(500).send("Server Error");
    }
  });
