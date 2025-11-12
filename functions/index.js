
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// Initialize Stripe with API version for consistency and stability.
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
  : null;

admin.initializeApp();
const db = admin.firestore();

// UPDATED: Replaced placeholder Price IDs with the ones from the client-side constants.ts for consistency.
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
        throw new functions.https.HttpsError("internal", "Stripe não está configurado.");
      }

      const { priceId, internalProductId } = data;
      if (!priceId || !internalProductId) {
        throw new functions.https.HttpsError("invalid-argument", "priceId e internalProductId são obrigatórios.");
      }
      
      const isBaseProductPurchase = internalProductId === 'hero_vitalicio';
      const mode = ONE_TIME_PAYMENT_PRICE_IDS.includes(priceId) ? 'payment' : 'subscription';
      const frontendUrl = "https://aistudio.google.com/app/project/66a858e5f3c09f3c78f8";

      const sessionParams = {
          mode: mode,
          payment_method_types: ['card'],
          line_items: [{
              price: priceId,
              quantity: 1,
          }],
          success_url: `${frontendUrl}/#/payment-success/${internalProductId}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${frontendUrl}/`,
          metadata: {
            internalProductId: internalProductId,
            priceId: priceId,
          }
      };

      if (context.auth) {
          sessionParams.customer_email = context.auth.token.email;
          sessionParams.metadata.uid = context.auth.uid;
      } else if (isBaseProductPurchase) {
          // Let Stripe collect customer details for new signups
          sessionParams.billing_address_collection = 'required';
      } else {
          // Any other purchase requires authentication.
          throw new functions.https.HttpsError("unauthenticated", "Ação requer autenticação.");
      }

      try {
        const session = await stripe.checkout.sessions.create(sessionParams);
        return { url: session.url };
      } catch(e) {
          console.error("Stripe Session Error:", e);
          throw new functions.https.HttpsError("internal", "Falha ao criar sessão de checkout.");
      }
    });

exports.verifyHeroPurchaseAndGetData = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!stripe) {
      throw new functions.https.HttpsError("internal", "Stripe não está configurado.");
    }
    const { sessionId } = data;
    if (!sessionId) {
      throw new functions.https.HttpsError("invalid-argument", "sessionId é obrigatório.");
    }

    try {
      const purchaseRef = db.collection("purchases").doc(sessionId);
      const purchaseDoc = await purchaseRef.get();
      if (purchaseDoc.exists && purchaseDoc.data().status === 'account_created') {
        throw new functions.https.HttpsError("already-exists", "Este pagamento já foi usado para criar uma conta.");
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        throw new functions.https.HttpsError("failed-precondition", "Pagamento não concluído.");
      }

      if (session.metadata.internalProductId !== 'hero_vitalicio') {
        throw new functions.https.HttpsError("permission-denied", "Rota inválida para este produto.");
      }
      
      const name = session.customer_details?.name;
      const email = session.customer_details?.email;
      
      if (!name || !email) {
        throw new functions.https.HttpsError("internal", "Não foi possível recuperar os dados do cliente do Stripe.");
      }
      
      if (!purchaseDoc.exists()) {
          await purchaseRef.set({
            email: email,
            name: name,
            sessionId: sessionId,
            priceId: session.metadata.priceId,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'verified_for_signup'
          });
      }

      return { success: true, name, email };
    } catch (e) {
        console.error("Verify New Purchase Error:", e);
        if (e instanceof functions.https.HttpsError) throw e;
        throw new functions.https.HttpsError("internal", "Falha ao verificar sua compra.");
    }
  });


exports.verifyCheckoutSession = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!stripe) {
      throw new functions.https.HttpsError("internal", "Stripe não está configurado.");
    }
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Ação requer autenticação.");
    }
    const { sessionId } = data;
    const uid = context.auth.uid;

    if (!sessionId) {
      throw new functions.https.HttpsError("invalid-argument", "sessionId é obrigatório.");
    }

    try {
      const purchaseRef = db.collection("purchases").doc(sessionId);
      const purchaseDoc = await purchaseRef.get();
      if (purchaseDoc.exists) {
        console.log(`Purchase ${sessionId} já processada.`);
        return { success: true, message: "Pagamento já verificado." };
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        throw new functions.https.HttpsError("failed-precondition", "Pagamento não concluído.");
      }

      const { priceId, internalProductId } = session.metadata;

      if (session.metadata.uid !== uid) {
          console.error(`UID Mismatch: Auth UID ${uid} vs Metadata UID ${session.metadata.uid}`);
          throw new functions.https.HttpsError("permission-denied", "UID do checkout não corresponde ao usuário autenticado.");
      }

      const userRef = db.collection("users").doc(uid);
      
      let updateData = {};
      if (priceId === STRIPE_PRICES.IA_UPGRADE || internalProductId === 'mentor_ia') {
          updateData = { hasSubscription: true };
      } else if (priceId === STRIPE_PRICES.PROTECAO_360 || internalProductId === 'protecao_360') {
          const allModules = ["soberano", "tita", "sabio", "monge", "lider"];
          updateData = { hasSubscription: true, activeModules: admin.firestore.FieldValue.arrayUnion(...allModules) };
      }
      if (Object.keys(updateData).length > 0) {
          await userRef.update(updateData);
      }
      
      await purchaseRef.set({
        uid: uid,
        email: session.customer_email,
        sessionId: sessionId,
        priceId: priceId,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: 'client_verification'
      });
      
      return { success: true };
    } catch (e) {
      console.error("Verify Session Error:", e);
      if (e instanceof functions.https.HttpsError) throw e;
      throw new functions.https.HttpsError("internal", "Falha ao verificar sessão de pagamento.");
    }
  });


exports.stripeWebhook = functions
    .region("southamerica-east1")
    .runWith({memory: "128MB"})
    .https.onRequest(async (req, res) => {
      if (req.method !== "POST" || !stripe) {
        return res.status(400).send("Bad Request");
      }

      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
      } catch (err) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const { uid, priceId, internalProductId } = session.metadata;

          const purchaseRef = db.collection("purchases").doc(session.id);
          const purchaseDoc = await purchaseRef.get();
          if (purchaseDoc.exists) {
              console.log(`Webhook: Purchase ${session.id} já processada.`);
              return res.json({ received: true, message: "Already processed." });
          }

          if (uid) {
              const userRef = db.collection("users").doc(uid);
              let logMsg = "";
              let updateData = {};
              if (priceId === STRIPE_PRICES.IA_UPGRADE || internalProductId === 'mentor_ia') {
                 updateData = { hasSubscription: true };
                 logMsg = "Activated IA Mentor";
              } else if (priceId === STRIPE_PRICES.PROTECAO_360 || internalProductId === 'protecao_360') {
                 const allModules = ["soberano", "tita", "sabio", "monge", "lider"];
                 updateData = { hasSubscription: true, activeModules: admin.firestore.FieldValue.arrayUnion(...allModules) };
                 logMsg = "Activated Proteção 360";
              }

              if (Object.keys(updateData).length > 0) {
                  await userRef.update(updateData);
                  logMsg += ` for user ${uid}`;
              }
              
              await purchaseRef.set({
                uid: uid,
                email: session.customer_email,
                sessionId: session.id,
                priceId: priceId,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedBy: 'webhook'
              });
              console.log(`Stripe Success (Upgrade): ${logMsg}`);

          } else if (internalProductId === 'hero_vitalicio') {
              const name = session.customer_details?.name;
              const email = session.customer_details?.email;

              if (name && email) {
                await purchaseRef.set({
                  email: email,
                  name: name,
                  sessionId: session.id,
                  priceId: priceId,
                  processedAt: admin.firestore.FieldValue.serverTimestamp(),
                  processedBy: 'webhook',
                  status: 'verified_for_signup'
                });
                console.log(`Stripe Success (New User): Purchase ${session.id} logged for ${email}.`);
              } else {
                console.error(`Webhook: Missing customer details for new user purchase ${session.id}.`);
              }
          }
        }

        res.json({received: true});
      } catch (err) {
        console.error(`Stripe Processing Error: ${err.message}`);
        res.status(500).send("Server Error");
      }
    });
