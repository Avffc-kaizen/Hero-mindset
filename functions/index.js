const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const crypto = require("crypto");
const fetch = require("node-fetch");

// --- SECRET & CONFIG MANAGEMENT ---
// Secrets MUST be set in the environment (e.g., in Firebase function settings).
// Deprecated functions.config() has been removed for security and future-proofing.
const STRIPE_SECRET_KEY_VALUE = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET_VALUE = process.env.STRIPE_WEBHOOK_SECRET;
const FB_PIXEL_ID_VALUE = process.env.FB_PIXEL_ID || "1170213417867380";
const FB_CAPI_TOKEN_VALUE = process.env.FB_CONVERSIONS_API_ACCESS_TOKEN;

// --- CRITICAL ERROR MESSAGES ---
const STRIPE_CONFIG_ERROR_MSG = "CONFIGURAÇÃO INCOMPLETA: A chave secreta do Stripe (STRIPE_SECRET_KEY) não foi encontrada no ambiente do servidor. Configure-a nas variáveis de ambiente da sua Firebase Function para ativar os pagamentos.";
const STRIPE_WEBHOOK_SECRET_ERROR_MSG = "CONFIGURAÇÃO INCOMPLETA: O segredo do webhook do Stripe (STRIPE_WEBHOOK_SECRET) não foi encontrado no ambiente. O webhook é essencial para confirmar pagamentos de forma segura.";

const stripe = STRIPE_SECRET_KEY_VALUE
  ? require('stripe')(STRIPE_SECRET_KEY_VALUE, { apiVersion: '2024-04-10' })
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
        functions.logger.error("CRITICAL: createCheckoutSession failed. STRIPE_SECRET_KEY is missing from Firebase environment variables.");
        throw new functions.https.HttpsError("internal", STRIPE_CONFIG_ERROR_MSG);
      }

      const { priceId, internalProductId } = data;
      if (!priceId || !internalProductId) {
        throw new functions.https.HttpsError("invalid-argument", "priceId e internalProductId são obrigatórios.");
      }
      
      const isBaseProductPurchase = internalProductId === 'hero_vitalicio';
      const mode = ONE_TIME_PAYMENT_PRICE_IDS.includes(priceId) ? 'payment' : 'subscription';
      
      const frontendUrl = "https://hero-mindset.web.app";

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
          sessionParams.customer_email = data.email;
          sessionParams.billing_address_collection = 'required';
      } else {
          throw new functions.https.HttpsError("unauthenticated", "Ação requer autenticação.");
      }

      try {
        const session = await stripe.checkout.sessions.create(sessionParams);
        return { id: session.id };
      } catch(e) {
          functions.logger.error("Stripe Session Error:", e);
          throw new functions.https.HttpsError("internal", "Falha ao criar sessão de checkout.");
      }
    });

exports.verifyHeroPurchaseAndGetData = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!stripe) {
      functions.logger.error("CRITICAL: verifyHeroPurchaseAndGetData failed. STRIPE_SECRET_KEY is missing.");
      throw new functions.https.HttpsError("internal", STRIPE_CONFIG_ERROR_MSG);
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
        functions.logger.error("Verify New Purchase Error:", e);
        if (e instanceof functions.https.HttpsError) throw e;
        throw new functions.https.HttpsError("internal", "Falha ao verificar sua compra.");
    }
  });


exports.verifyCheckoutSession = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!stripe) {
      functions.logger.error("CRITICAL: verifyCheckoutSession failed. STRIPE_SECRET_KEY is missing.");
      throw new functions.https.HttpsError("internal", STRIPE_CONFIG_ERROR_MSG);
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
        functions.logger.info(`Purchase ${sessionId} already processed.`);
        return { success: true, message: "Pagamento já verificado." };
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        throw new functions.https.HttpsError("failed-precondition", "Pagamento não concluído.");
      }

      const { priceId, internalProductId } = session.metadata;

      if (session.metadata.uid !== uid) {
          functions.logger.error(`UID Mismatch: Auth UID ${uid} vs Metadata UID ${session.metadata.uid}`);
          throw new functions.https.HttpsError("permission-denied", "UID do checkout não corresponde ao usuário autenticado.");
      }

      const userRef = db.collection("users").doc(uid);
      const isSubscription = !ONE_TIME_PAYMENT_PRICE_IDS.includes(priceId);
      
      let updateData = {};
      if (isSubscription && session.customer) {
        updateData.stripeCustomerId = session.customer;
      }

      if (priceId === STRIPE_PRICES.IA_UPGRADE || internalProductId === 'mentor_ia') {
          updateData.hasSubscription = true;
      } else if (priceId === STRIPE_PRICES.PROTECAO_360 || internalProductId === 'protecao_360') {
          const allModules = ["soberano", "tita", "sabio", "monge", "lider"];
          updateData.hasSubscription = true;
          updateData.activeModules = admin.firestore.FieldValue.arrayUnion(...allModules);
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
      functions.logger.error("Verify Session Error:", e);
      if (e instanceof functions.https.HttpsError) throw e;
      throw new functions.https.HttpsError("internal", "Falha ao verificar sessão de pagamento.");
    }
  });


exports.stripeWebhook = functions
    .region("southamerica-east1")
    .runWith({memory: "128MB"})
    .https.onRequest(async (req, res) => {
      if (!stripe) {
        functions.logger.error("CRITICAL: Stripe Webhook failed. STRIPE_SECRET_KEY is missing from environment variables.");
        return res.status(500).send("Webhook handler configuration error: Missing Stripe secret key.");
      }
      if (req.method !== "POST") {
        functions.logger.error("Webhook received non-POST request.");
        return res.status(400).send("Bad Request");
      }

      const sig = req.headers['stripe-signature'];
      const endpointSecret = STRIPE_WEBHOOK_SECRET_VALUE;

      if (!endpointSecret) {
        functions.logger.error(STRIPE_WEBHOOK_SECRET_ERROR_MSG);
        return res.status(500).send("Webhook handler configuration error: Missing secret.");
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
      } catch (err) {
        functions.logger.error(`Webhook Signature Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object;
            const { uid, priceId, internalProductId } = session.metadata;

            const purchaseRef = db.collection("purchases").doc(session.id);
            const purchaseDoc = await purchaseRef.get();
            if (purchaseDoc.exists) {
                functions.logger.info(`Webhook: Purchase ${session.id} already processed.`);
                return res.json({ received: true, message: "Already processed." });
            }

            const isSubscription = !ONE_TIME_PAYMENT_PRICE_IDS.includes(priceId);

            if (uid) {
                const userRef = db.collection("users").doc(uid);
                let logMsg = "";
                let updateData = {};

                if (isSubscription && session.customer) {
                  updateData.stripeCustomerId = session.customer;
                }

                if (priceId === STRIPE_PRICES.IA_UPGRADE || internalProductId === 'mentor_ia') {
                   updateData.hasSubscription = true;
                   logMsg = "Activated IA Mentor";
                } else if (priceId === STRIPE_PRICES.PROTECAO_360 || internalProductId === 'protecao_360') {
                   const allModules = ["soberano", "tita", "sabio", "monge", "lider"];
                   updateData.hasSubscription = true;
                   updateData.activeModules = admin.firestore.FieldValue.arrayUnion(...allModules);
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
                functions.logger.info(`Stripe Success (Upgrade): ${logMsg}`);

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
                  functions.logger.info(`Stripe Success (New User): Purchase ${session.id} logged for ${email}.`);
                } else {
                  functions.logger.error(`Webhook: Missing customer details for new user purchase ${session.id}.`);
                }
            }
            
            if(session.payment_status === 'paid') {
              await sendFbConversionApiEvent({
                  eventName: 'Purchase',
                  eventTime: session.created,
                  user: { email: session.customer_details?.email, name: session.customer_details?.name },
                  customData: {
                      value: session.amount_total / 100,
                      currency: session.currency.toUpperCase(),
                      content_ids: [internalProductId],
                      content_type: 'product',
                  },
                  eventSourceUrl: `https://hero-mindset.web.app/`,
                  ip: req.ip,
                  userAgent: req.headers['user-agent'],
              });
            }
            break;
          }
          
          case 'invoice.payment_failed': {
            const invoice = event.data.object;
            const customerId = invoice.customer;
            if (!customerId) {
                functions.logger.error("Webhook 'invoice.payment_failed': event missing customer ID.", { invoiceId: invoice.id });
                break;
            }
    
            const usersRef = db.collection('users');
            const q = usersRef.where('stripeCustomerId', '==', customerId).limit(1);
            const snapshot = await q.get();
    
            if (snapshot.empty) {
                functions.logger.warn(`Webhook 'invoice.payment_failed': No user found for Stripe customer ID: ${customerId}.`);
                break;
            }
    
            const userDoc = snapshot.docs[0];
            functions.logger.warn(`Recurring payment failed for user ${userDoc.id}. Subscription is now 'past_due'.`, {
                userId: userDoc.id,
                stripeCustomerId: customerId,
                invoiceId: invoice.id,
            });
            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            if (!customerId) {
              functions.logger.error("Webhook `customer.subscription.deleted`: event missing customer ID.");
              break;
            }

            const usersRef = db.collection('users');
            const q = usersRef.where('stripeCustomerId', '==', customerId).limit(1);
            const snapshot = await q.get();

            if (snapshot.empty) {
              functions.logger.warn(`Webhook: No user found for Stripe customer ID: ${customerId} on subscription cancellation.`);
              break;
            }

            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({
              hasSubscription: false,
              activeModules: []
            });

            functions.logger.info(`Subscription access revoked for user ${userDoc.id} (Stripe Customer: ${customerId}).`);
            break;
          }

          default:
            functions.logger.log(`Webhook: Unhandled event type ${event.type}`);
        }

        res.json({received: true});
      } catch (err) {
        functions.logger.error(`Stripe Processing Error: ${err.message}`);
        res.status(500).send("Server Error");
      }
    });

exports.eduzzWebhook = functions
    .region("southamerica-east1")
    .https.onRequest(async (req, res) => {
        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

        const eduzzApiKey = process.env.EDUZZ_API_KEY;
        if (!eduzzApiKey) {
            functions.logger.error("CRITICAL: EDUZZ_API_KEY environment variable not set.");
            return res.status(500).send("Handler configuration error.");
        }

        try {
            const data = req.body;
            if (data.apikey !== eduzzApiKey) {
                functions.logger.warn("Eduzz Webhook: Invalid API key received.");
                return res.status(401).send("Unauthorized");
            }

            if (data.trans_status !== '3') {
                return res.status(200).send("OK (Not an approved sale)");
            }
            
            const email = data.cus_email;
            const name = data.cus_name;
            const transactionId = data.trans_cod;

            if (!email || !transactionId) {
                functions.logger.error("Eduzz Webhook: Missing email or transaction ID.");
                return res.status(400).send("Bad Request: Missing data");
            }

            const purchaseRef = db.collection("purchases").doc(`eduzz-${transactionId}`);
            const purchaseDoc = await purchaseRef.get();
            if (purchaseDoc.exists) {
                return res.status(200).send("OK (Already processed)");
            }
            
            await sendFbConversionApiEvent({
                eventName: 'Purchase',
                eventTime: Math.floor(Date.now() / 1000),
                user: { email: data.cus_email, name: data.cus_name },
                customData: {
                    value: parseFloat(data.trans_value),
                    currency: 'BRL',
                    content_ids: [data.content_cod],
                    content_type: 'product',
                },
                eventSourceUrl: `https://chk.eduzz.com/${data.content_cod}`,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            
            let uid = null;
            try {
                const userRecord = await admin.auth().getUserByEmail(email);
                uid = userRecord.uid;
            } catch (error) {
                if (error.code !== 'auth/user-not-found') throw error;
            }
            
            if (uid) {
                const userDocRef = db.collection("users").doc(uid);
                await userDocRef.update({ hasPaidBase: true });
                 await purchaseRef.set({
                    provider: 'eduzz', transactionId, email, uid, status: 'account_updated',
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            } else {
                await purchaseRef.set({
                    provider: 'eduzz', transactionId, email, name, status: 'verified_for_signup',
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            return res.status(200).send("OK");
        } catch (err) {
            functions.logger.error("Error processing Eduzz webhook:", err);
            return res.status(500).send("Internal Server Error");
        }
    });

exports.processSignUp = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
        const { name, email, password } = data;
        if (!name || !email || !password || password.length < 6) {
            throw new functions.https.HttpsError("invalid-argument", "Nome, email e senha (mínimo 6 caracteres) são obrigatórios.");
        }

        let purchaseDoc = null;

        if (email.toLowerCase() !== 'andreferraz@consegvida.com') {
            const purchaseRef = db.collection("purchases");
            const q = purchaseRef.where("email", "==", email).where("status", "==", "verified_for_signup").limit(1);
            const snapshot = await q.get();

            if (snapshot.empty) {
                throw new functions.https.HttpsError("not-found", "Compra não encontrada. Verifique se usou o mesmo email da compra ou aguarde alguns minutos para a confirmação do pagamento.");
            }
            purchaseDoc = snapshot.docs[0];
        }

        try {
            const userRecord = await admin.auth().createUser({
                email: email, password: password, displayName: name,
            });
            
            const initialUserData = {
                uid: userRecord.uid, name, email,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                hasPaidBase: true,
                onboardingCompleted: false,
                level: 1, currentXP: 0, rank: 'Iniciante', hasSubscription: false,
                lastBossAttacks: {}, isAscended: false, paragonPoints: 0,
                paragonPerks: {}, skillPoints: 0, unlockedSkills: [], journalEntries: [],
                stats: { mind: 0, body: 0, spirit: 0, wealth: 0 }, missions: [],
                lastDailyMissionRefresh: 0, lastWeeklyMissionRefresh: 0,
                lastMilestoneMissionRefresh: 0, lessonsCompletedToday: 0,
                lastLessonCompletionDate: 0, dailyGuidance: null, activeModules: [],
                company: null, businessRoadmap: [], bioData: { sleepHours: 0, workoutsThisWeek: 0, waterIntake: 0 },
                focusHistory: [], dailyIntention: null, keyConnections: [], joinedSquadIds: [],
                purchases: [],
            };

            const purchaseInfo = purchaseDoc ? {
                id: purchaseDoc.id,
                ...purchaseDoc.data()
            } : null;

            if (purchaseInfo) {
                initialUserData.purchases.push({
                    purchaseId: purchaseInfo.id,
                    provider: purchaseInfo.provider || 'stripe',
                    productId: purchaseInfo.priceId,
                    createdAt: purchaseInfo.processedAt || admin.firestore.FieldValue.serverTimestamp()
                });
            }

            const userDocRef = db.collection("users").doc(userRecord.uid);
            
            await db.runTransaction(async (transaction) => {
              const userDoc = await transaction.get(userDocRef);
              if (!userDoc.exists) {
                transaction.set(userDocRef, initialUserData);
              } else {
                functions.logger.warn(`processSignUp: User document for UID ${userRecord.uid} already exists. Merging purchase info.`);
                transaction.update(userDocRef, {
                    hasPaidBase: true,
                    purchases: admin.firestore.FieldValue.arrayUnion(...initialUserData.purchases)
                });
              }
            });

            if (purchaseDoc) {
                await purchaseDoc.ref.update({ status: 'account_created', uid: userRecord.uid });
            }
            
            return { success: true, uid: userRecord.uid };
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                 throw new functions.https.HttpsError("already-exists", "Uma conta com este email já existe. Tente fazer login.");
            }
            functions.logger.error("Error creating user from purchase:", error);
            throw new functions.https.HttpsError("internal", "Erro ao criar sua conta.");
        }
    });


const sendFbConversionApiEvent = async (eventData) => {
    const pixelId = FB_PIXEL_ID_VALUE;
    const accessToken = FB_CAPI_TOKEN_VALUE;

    if (!accessToken) {
        functions.logger.warn("FB_CONVERSIONS_API_ACCESS_TOKEN not set. Skipping CAPI event.");
        return;
    }

    const { eventName, eventTime, user, customData, eventSourceUrl, ip, userAgent } = eventData;
    
    const userData = {
        client_ip_address: ip,
        client_user_agent: userAgent,
    };
    if (user.email) {
        userData.em = [crypto.createHash('sha256').update(user.email.trim().toLowerCase()).digest('hex')];
    }
     if (user.name) {
        const nameParts = user.name.split(' ');
        if (nameParts.length > 0) {
            userData.fn = [crypto.createHash('sha256').update(nameParts[0].trim().toLowerCase()).digest('hex')];
        }
        if (nameParts.length > 1) {
            userData.ln = [crypto.createHash('sha256').update(nameParts.slice(-1)[0].trim().toLowerCase()).digest('hex')];
        }
    }

    const payload = {
        data: [{
            event_name: eventName,
            event_time: eventTime,
            action_source: "website",
            event_source_url: eventSourceUrl,
            user_data: userData,
            custom_data: customData,
        }],
    };

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        if (!response.ok) {
            functions.logger.error("Error sending FB CAPI event:", responseData);
        } else {
            functions.logger.info("Successfully sent FB CAPI event:", {eventName, fbtrace_id: responseData.fbtrace_id});
        }
    } catch (error) {
        functions.logger.error("Failed to send FB CAPI event:", error);
    }
};
