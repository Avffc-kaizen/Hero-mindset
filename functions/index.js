
// GUIA DE CONFIGURAÇÃO EDUZZ - LEITURA OBRIGATÓRIA
// --------------------------------------------------------------------
// 1. LINKS DE PAGAMENTO (CHECKOUT)
//    - Hero Mindset (Base): https://chk.eduzz.com/1725528
//    - Mentor IA (Upgrade): https://chk.eduzz.com/89AQD6Y8WD
//    - Sucesso 360 (Upgrade): https://chk.eduzz.com/9999999 (Substitua pelo ID real)

// 2. URL DE DESTINO (PÁGINA DE AGRADECIMENTO / OBRIGADO)
//    - Configure DENTRO do produto na Eduzz.
//    - Esta é a URL para onde o usuário é enviado APÓS a compra.
//    - Produto Base: https://consegvida.com/#/payment-success/1725528?name={customer_name}&email={customer_email}
//    - Upgrades: https://consegvida.com/#/payment-success/{ID_DO_PRODUTO} (Ex: 89AQD6Y8WD)
//    - IMPORTANTE: Certifique-se de que o domínio 'consegvida.com' esteja apontando para o seu deploy atual.

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const cors = require('cors')({origin: true});

// Only load stripe if key is present to prevent crashes in dev
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

admin.initializeApp();
const db = admin.firestore();

// --- STRIPE PRICE IDS MAPPING ---
// Ensure these match src/constants.ts
const STRIPE_PRICES = {
  HERO_BASE: "price_1SRx9eELwcc78QutsxtesYl0",
  IA_UPGRADE: "price_1SRxBwELwcc78QutnLm4OcVA",
  SUCESSO_360: "price_1SRxSucesso360Placeholder"
};

exports.createCheckoutSession = functions
    .region("southamerica-east1")
    .https.onRequest((req, res) => {
      cors(req, res, async () => {
        if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
        if (!stripe) return res.status(500).send("Stripe not configured");
        
        try {
            const { priceId, email } = req.body;
            
            if (!priceId) return res.status(400).send("Price ID required");

            // Determine mode based on price ID
            const isSubscription = priceId === STRIPE_PRICES.IA_UPGRADE || priceId === STRIPE_PRICES.SUCESSO_360;
            const mode = isSubscription ? 'subscription' : 'payment';
            
            const session = await stripe.checkout.sessions.create({
                mode: mode,
                payment_method_types: ['card'],
                line_items: [{
                    price: priceId,
                    quantity: 1,
                }],
                customer_email: email,
                success_url: `https://consegvida.com/#/payment-success/${priceId}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `https://consegvida.com/`,
            });
            
            res.json({ sessionId: session.id });
        } catch(e) {
            console.error("Stripe Session Error:", e);
            res.status(500).json({ error: e.message });
        }
      });
    });

exports.eduzzWebhook = functions
    .region("southamerica-east1")
    .runWith({memory: "128MB"})
    .https.onRequest(async (req, res) => {
      if (req.method !== "POST") {
        console.warn("Requisição não-POST recebida e ignorada.");
        return res.status(405).send("Método não permitido. Use POST.");
      }

      try {
        const data = req.body;
        console.log("Webhook Eduzz recebido:", JSON.stringify(data));

        const HERO_CONTENT_ID = "1725528";
        const IA_UPGRADE_PRODUCT_ID = "89AQD6Y8WD"; // Mentor IA ID correto
        const SUCESSO_360_ID = "9999999"; // Sucesso 360 ID (Exemplo/Placeholder)

        // Eduzz status 3 = Aprovado/Pago
        const isApproved = data.edz_fat_status === "3";
        const userEmail = data.edz_cli_email;
        const productId = data.edz_cnt_cod;

        console.log(
            `Dados: Aprovado=${isApproved}, Email=${userEmail}, ` +
            `ID=${productId}`,
        );

        if (!isApproved || !userEmail || !productId) {
          console.warn("Dados insuficientes ou pagamento não aprovado.");
          return res.status(200).send("Ação não necessária.");
        }

        console.log(
            `Pagamento aprovado para ${userEmail}, produto ${productId}`,
        );

        const userRef = db.collection("users").doc(userEmail);
        
        // Prepara objeto de atualização
        let updateData = { email: userEmail };
        let productName = "";

        if (productId.toString() === HERO_CONTENT_ID) {
          productName = "Hero Mindset Base";
          updateData.hasPaid = true;
          updateData.plan = "vitalicio";
        } else if (productId.toString() === IA_UPGRADE_PRODUCT_ID) {
          productName = "Mentor IA";
          updateData.hasSubscription = true; // Atualiza flag de subscrição (IA)
        } else if (productId.toString() === SUCESSO_360_ID) {
          productName = "Sucesso 360";
          // Desbloqueia módulo soberano e garante acesso IA
          updateData.hasSubscription = true;
          updateData.activeModules = admin.firestore.FieldValue.arrayUnion("soberano");
        } else {
          console.warn(`ID de produto ${productId} não reconhecido.`);
          return res.status(200).send("Produto não reconhecido.");
        }

        console.log(`Liberando acesso: ${productName} para ${userEmail}`);
        
        // Usa set com merge: true para criar se não existir ou atualizar
        await userRef.set(updateData, {merge: true});
        console.log("Banco de dados atualizado com sucesso.");

        return res.status(200).send("Recebido e processado com sucesso.");
      } catch (error) {
        console.error("ERRO CRÍTICO no webhook da Eduzz:", error);
        return res.status(500).send("Erro interno do servidor.");
      }
    });

exports.stripeWebhook = functions
    .region("southamerica-east1")
    .runWith({memory: "128MB"})
    .https.onRequest(async (req, res) => {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
      if (!stripe) return res.status(500).send("Stripe not configured");

      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      try {
        // Use rawBody for signature verification in Firebase Functions
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
      } catch (err) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const customerEmail = session.customer_details?.email || session.customer_email;
          
          // Retrieve line items to identify the product
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;

          if (!customerEmail || !priceId) {
             console.warn("Missing email or price ID in session");
             return res.status(200).send("Missing info");
          }

          const userRef = db.collection("users").doc(customerEmail);
          let updateData = { email: customerEmail };
          let logMsg = "";

          if (priceId === STRIPE_PRICES.HERO_BASE) {
             updateData.hasPaid = true;
             updateData.plan = "vitalicio";
             logMsg = "Activated Base Plan";
          } else if (priceId === STRIPE_PRICES.IA_UPGRADE) {
             updateData.hasSubscription = true;
             logMsg = "Activated IA Mentor";
          } else if (priceId === STRIPE_PRICES.SUCESSO_360) {
             updateData.hasSubscription = true;
             updateData.activeModules = admin.firestore.FieldValue.arrayUnion("soberano");
             logMsg = "Activated Sucesso 360";
          }

          await userRef.set(updateData, { merge: true });
          console.log(`Stripe Success: ${logMsg} for ${customerEmail}`);
        }

        res.json({received: true});
      } catch (err) {
        console.error(`Stripe Processing Error: ${err.message}`);
        res.status(500).send("Server Error");
      }
    });
