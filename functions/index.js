const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// --- Robust Service Initializations ---

let stripe = null;
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (stripeSecret) {
    try {
        stripe = require("stripe")(stripeSecret, { apiVersion: "2024-04-10" });
    } catch(e) {
        console.error("CRITICAL: Could not initialize Stripe. Ensure the 'stripe' package is installed. Error: ", e);
    }
} else {
    console.warn("Stripe secret key not found in environment (STRIPE_SECRET_KEY). Payment features will be disabled.");
}

let ai = null;
const geminiKey = process.env.API_KEY;
if (geminiKey) {
    try {
        const { GoogleGenAI } = require("@google/genai");
        ai = new GoogleGenAI({ apiKey: geminiKey });
    } catch(e) {
        console.error("CRITICAL: Could not initialize GoogleGenAI. Ensure '@google/genai' is installed. Error: ", e);
    }
} else {
    console.warn("Gemini API key not found in environment (API_KEY). AI features will be disabled.");
}


const MENTOR_SYSTEM_INSTRUCTION = `Você é o Oráculo, um mentor estratégico, observador e militar. Sua função NÃO é bater papo. É analisar os dados do usuário e dar UMA diretriz diária precisa, curta e impactante. Use linguagem estoica, firme e inspiradora.`;
// --- End Service Initializations ---


const STRIPE_PRICES = {
  HERO_BASE: "price_1SRx9eELwcc78QutsxtesYl0",
  PLANO_HEROI_TOTAL: "price_1Pshv8ELwcc78Qut2qfW5oUh",
  PLANO_HEROI_ANUAL: "price_1SRwzDELwcc78QutG7v491gC",
};
const ONE_TIME_PAYMENT_PRICE_IDS = [STRIPE_PRICES.HERO_BASE];

exports.createCheckoutSession = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!stripe) {
      console.error("CRITICAL: Stripe not configured. Check warnings on function startup.");
      throw new functions.https.HttpsError("internal", "O sistema de pagamento não está configurado no servidor.");
    }

    const { priceId, internalProductId } = data;
    if (!priceId || !internalProductId) {
      throw new functions.https.HttpsError("invalid-argument", "priceId and internalProductId are required.");
    }

    const mode = ONE_TIME_PAYMENT_PRICE_IDS.includes(priceId) ? "payment" : "subscription";
    const frontendUrl = "https://hero-mindset.web.app";

    const sessionParams = {
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/#/payment-success/${internalProductId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/`,
      metadata: { internalProductId, priceId },
      billing_address_collection: "required",
      tax_id_collection: {
        enabled: true,
      },
    };

    if (context.auth) {
      sessionParams.client_reference_id = context.auth.uid;
      sessionParams.metadata.uid = context.auth.uid; // Keep for auditing
      if (context.auth.token.email) {
        sessionParams.customer_email = context.auth.token.email;
      }
    } else if (internalProductId === "hero_vitalicio") {
      sessionParams.client_reference_id = `guest-${Date.now()}`;
      sessionParams.customer_creation = 'always';
    } else {
      throw new functions.https.HttpsError("unauthenticated", "Apenas o Acesso Vitalício pode ser comprado sem uma conta.");
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      return { url: session.url };
    } catch (e) {
      console.error("Stripe Session Error:", e.type, e.message);
      let userMessage = "Falha ao criar sessão de checkout.";
      if (e.type === 'StripeAuthenticationError') {
          userMessage = "Erro de autenticação com o sistema de pagamento. Verifique se as chaves de API do servidor estão corretas.";
      } else if (e.code === 'resource_missing') {
          userMessage = `Recurso de pagamento não encontrado. Verifique se o ID do produto (${priceId}) é válido no Stripe.`;
      } else if (e.message.includes('You cannot use Tax ID collection with an account in your region')) {
          userMessage = "A coleta de CPF/CNPJ não está habilitada para sua região no Stripe.";
      } else if (e.message.includes('As a guest, you can only checkout items with `customer_creation` set to `always`')) {
          userMessage = "Erro de configuração: Compras de visitantes precisam de criação de cliente.";
      }
      throw new functions.https.HttpsError("internal", userMessage);
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
      console.error("CRITICAL: STRIPE_WEBHOOK_SECRET not set in environment.");
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
        const purchaseRef = db.collection("purchases").doc(session.id);
        const purchaseDoc = await purchaseRef.get();
        if (purchaseDoc.exists) {
          console.log(`Webhook: Purchase ${session.id} already processed.`);
          return res.json({ received: true, message: "Already processed." });
        }
        
        const uid = session.client_reference_id;
        const isGuest = !uid || uid.startsWith('guest-');

        if (!isGuest) { // User is logged in, processing an upgrade.
          const { priceId, internalProductId } = session.metadata;
          const userRef = db.collection("users").doc(uid);
          
          let updateData = {};
          if (priceId === STRIPE_PRICES.PLANO_HEROI_TOTAL || priceId === STRIPE_PRICES.PLANO_HEROI_ANUAL) {
            const allModules = ["soberano", "tita", "sabio", "monge", "lider"];
            updateData = { hasSubscription: true, activeModules: admin.firestore.FieldValue.arrayUnion(...allModules) };
          }

          const stripeCustomerId = session.customer;
          updateData.stripe = {
              customerId: stripeCustomerId,
              lastSessionId: session.id,
              mode: session.mode,
              status: 'active',
          };
          updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

          if (Object.keys(updateData).length > 2) { 
             await userRef.set(updateData, { merge: true });
          }

          await purchaseRef.set({
            uid,
            email: session.customer_email || session.customer_details?.email,
            sessionId: session.id,
            priceId,
            internalProductId,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedBy: "webhook",
            status: "completed",
          });

        } else { // New user (guest) purchase.
          const { internalProductId } = session.metadata;
          
          if (internalProductId === "hero_vitalicio") {
            const email = (session.customer_email || session.customer_details?.email || '').toLowerCase();
            
            if (email) {
              const name = session.customer_details?.name || email.split('@')[0];
              await purchaseRef.set({
                email,
                name,
                sessionId: session.id,
                priceId: session.metadata.priceId,
                internalProductId,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedBy: "webhook",
                status: "verified_for_signup",
              });
            } else {
              console.error(`Webhook CRITICAL: Missing customer email for new user purchase ${session.id}.`);
            }
          }
        }
      }
      res.json({ received: true });
    } catch (err) {
      console.error(`Stripe Processing Error: ${err.message}`);
      res.status(500).send("Server Error");
    }
  });


// --- NEW EDUZZ WEBHOOK ---
exports.eduzzWebhook = functions
  .region("southamerica-east1")
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const data = req.body;
      functions.logger.log("Eduzz Webhook Received:", data);

      // Eduzz sends status '3' for "Paga" (Paid)
      const transactionStatus = String(data.trans_status);
      const email = (data.cus_email || "").toLowerCase();
      const name = data.cus_name;
      const transactionId = data.trans_id;
      const saleId = data.sale_id;

      if (transactionStatus === "3" && email && (transactionId || saleId)) {
        const uniqueId = `eduzz-${transactionId || saleId}`;
        const purchaseRef = db.collection("purchases").doc(uniqueId);
        const purchaseDoc = await purchaseRef.get();

        if (purchaseDoc.exists) {
          functions.logger.log(`Eduzz webhook for tx ${uniqueId} already processed.`);
          return res.status(200).send({ status: "ok", message: "Already processed." });
        }

        const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!userQuery.empty) {
            const existingUser = userQuery.docs[0];
            functions.logger.log(`User with email ${email} already exists. Skipping new purchase record.`);
            await purchaseRef.set({
                email,
                name,
                sessionId: uniqueId,
                internalProductId: "hero_vitalicio",
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedBy: "eduzz_webhook",
                status: "claimed_existing_user",
                uid: existingUser.id,
            });
            return res.status(200).send({ status: "ok", message: "User already exists." });
        }
        
        await purchaseRef.set({
          email,
          name: name || email.split("@")[0],
          sessionId: uniqueId,
          internalProductId: "hero_vitalicio",
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          processedBy: "eduzz_webhook",
          status: "verified_for_signup",
        });

        functions.logger.log(`Eduzz purchase verified for new user signup: ${email}`);
        return res.status(200).send({ status: "ok" });
      }

      functions.logger.log("Eduzz webhook received with non-paid status or missing data.", { status: transactionStatus, email: email });
      return res.status(200).send({ status: "ok", message: "Webhook received but not processed." });
    } catch (err) {
      functions.logger.error("Error processing Eduzz webhook:", err);
      return res.status(500).send({ status: "error", message: "Internal Server Error" });
    }
  });


// --- NEW GEMINI AI FUNCTION ---

exports.callGeminiAI = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!ai) {
      console.warn("CRITICAL: Gemini not configured. Returning static fallback for AI features.");
      const { endpoint } = data;
      switch (endpoint) {
        case 'generateDetailedLifeMapAnalysis':
          return { text: "Seu caminho está sendo traçado. A clareza virá com a ação. Siga em frente." };
        case 'generateProactiveOracleGuidance':
          return { guidance: { date: Date.now(), content: "A disciplina é sua bússola hoje. Use-a.", type: 'strategy' } };
        case 'generateDailyAnalysisAI':
          return { text: "O Oráculo está em silêncio. A auto-reflexão é sua tarefa. Continue a jornada." };
        case 'generateDailyMissionsAI':
        case 'generateWeeklyMissionsAI':
        case 'generateMilestoneMissionsAI':
          return { missions: [] };
        case 'getMentorChatReply':
          return { text: "O silêncio é uma forma de sabedoria. Continue sua reflexão, a resposta surgirá." };
        case 'analyzeJournalAI':
          return { text: "Seus registros são ecos no vazio. Continue escrevendo. A clareza emerge da consistência." };
        case 'generateBossVictorySpeech':
          return { text: "A VITÓRIA FOI ALCANÇADA. A CRÔNICA FOI ESCRITA." };
        case 'generateChannelInsightAI':
          return { text: "O fluxo de informações está turvo. A estratégia agora é observar." };
        case 'generateGuildMemberReply':
          return { reply: null };
        case 'getChatbotLandingReply':
          return { text: "O Oráculo está meditando. A resposta que você procura está na sua jornada, não em palavras. Dê o primeiro passo." };
        default:
          throw new functions.https.HttpsError("internal", "O modelo de IA não está configurado e não há fallback para este endpoint.");
      }
    }
    
    const { Type } = require("@google/genai");
    const { endpoint, payload } = data;

    try {
      switch (endpoint) {
        case 'generateDetailedLifeMapAnalysis': {
          const { scores, focusAreas } = payload;
          const scoresList = Object.entries(scores).map(([k, v]) => `${k}: ${v}/10`).join('\n');
          const prompt = `ATUE COMO O ORÁULO DO HERO MINDSET. Analise o Mapa de Vida 360 deste Herói. DADOS: ${scoresList}. FOCO (90 dias): ${focusAreas.join(', ')}. Gere um DOSSIÊ ESTRATÉGICO (Markdown) contendo: 1. **Diagnóstico de Sombra:** Analise a área com menor pontuação. 2. **Protocolo de Intervenção:** Dê uma ferramenta ou hábito para a área de Foco nº 1. 3. **Ponto de Alavancagem:** Identifique a área mais forte e como usá-la. 4. **Tríade de Ação:** 3 passos práticos para hoje. Tom: Militar, Estoico, Lendário.`;
          const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION } });
          return { text: response.text };
        }

        case 'generateProactiveOracleGuidance': {
            const { user } = payload;
            const lifeMapSummary = user.lifeMapScores ? Object.entries(user.lifeMapScores).map(([k, v]) => `${k}: ${v}`).join(', ') : "N/A";
            const prompt = `Analisar perfil do herói: ${user.rank} (Lvl ${user.level}). Mapa: ${lifeMapSummary}. Gere um JSON com UM DECRETO ESTRATÉGICO para hoje: {"content": "Frase curta e imperativa.", "type": "alert" | "strategy" | "praise"}`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { content: { type: Type.STRING }, type: { type: Type.STRING } }, required: ['content', 'type'] } } });
            const guidance = JSON.parse(response.text);
            return { guidance: { ...guidance, date: Date.now() } };
        }
        
        case 'generateDailyAnalysisAI': {
            const { userState } = payload;
            const statsString = `Mente: ${userState.stats.mind}, Corpo: ${userState.stats.body}, Espírito: ${userState.stats.spirit}, Riqueza: ${userState.stats.wealth}`;
            const journalSummary = userState.journalEntries.length > 0 ? `Último registro: "${userState.journalEntries[0].content}"` : "Diário vazio.";
            const prompt = `Analise o estado deste Herói: ${userState.rank}, Status: ${statsString}, ${journalSummary}. Forneça: 1. Virtude em Foco, 2. Sombra a Enfrentar, 3. Oráculo do Dia. Seja inspirador e use a persona do Oráculo. Não use markdown.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION } });
            return { text: response.text };
        }

        case 'generateDailyMissionsAI':
        case 'generateWeeklyMissionsAI':
        case 'generateMilestoneMissionsAI': {
            const isDaily = endpoint === 'generateDailyMissionsAI';
            const isWeekly = endpoint === 'generateWeeklyMissionsAI';
            const { level, rank, stats, journalEntries } = payload;
            const xpRange = isDaily ? '15-50' : isWeekly ? '100-200' : '150-300';
            const count = isDaily ? 4 : isWeekly ? 3 : 2;
            let prompt = `Gere ${count} missões ${isDaily ? 'diárias' : isWeekly ? 'semanais' : 'de marco (milestone)'} para um herói de nível ${level}, patente ${rank}, em JSON. Categorias: 'Fitness', 'Learning', 'Finance', 'Mindset'. XP: ${xpRange}.`;
            if (!isDaily && !isWeekly) {
                const statsString = `Stats: Mente: ${stats.mind}, Corpo: ${stats.body}, Espírito: ${stats.spirit}, Riqueza: ${stats.wealth}`;
                const journalSummary = journalEntries.length > 0 ? `Diário: ${journalEntries.map(e => e.content).join('; ')}` : "Diário vazio.";
                prompt = `Baseado no perfil (Nível ${level}, ${rank}, ${statsString}, ${journalSummary}), ${prompt}`;
            }
            prompt += ' Retorne APENAS o array JSON cru.';

            const model = isDaily || isWeekly ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
            const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, category: { type: Type.STRING }, xp: { type: Type.NUMBER } }, required: ['title', 'category', 'xp'] } } } });
            return { missions: JSON.parse(response.text) };
        }

        case 'getMentorChatReply': {
            const { chatHistory, user } = payload;
            const history = chatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
            const systemInstruction = `${MENTOR_SYSTEM_INSTRUCTION}\nO nome do herói é ${user.name}. Mantenha suas respostas concisas e focadas em ação.`;
            const modelName = user.activeModules.length > 3 ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
            const response = await ai.models.generateContent({ model: modelName, contents: history, config: { systemInstruction, temperature: 0.8 } });
            return { text: response.text };
        }

        case 'analyzeJournalAI': {
            const { entries, userName } = payload;
            const recentEntriesText = entries.slice(-5).map(e => `[${new Date(e.date).toLocaleDateString()}] ${e.content}`).join('\n');
            const prompt = `Analise as entradas do Diário do Herói ${userName}:\n\n${recentEntriesText}\n\nComo Oráculo, forneça uma análise inspiradora: 1. Identifique um padrão (virtude ou sombra). 2. Dê um conselho profundo. 3. Termine com UMA pergunta reflexiva. Seja direto e use a persona do Oráculo.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION } });
            return { text: response.text };
        }

        case 'generateBossVictorySpeech': {
            const { lastMessages, bossName } = payload;
            const prompt = `O desafio "${bossName}" foi superado. Analise o esforço conjunto e crie um discurso curto e épico declarando a vitória, como um bardo narrando um grande feito. Termine EXATAMENTE com: "A CRÔNICA FOI ESCRITA. UM NOVO CAPÍTULO AGUARDA."`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { systemInstruction: 'Você é o Guardião das Crônicas. Fale de forma épica, em caixa alta.' } });
            return { text: response.text };
        }

        case 'generateChannelInsightAI': {
            const { channelName, lastPosts } = payload;
            const conversation = lastPosts.slice(-5).map(p => `${p.author}: ${p.content}`).join('\n');
            const prompt = `ATUE COMO O ORÁULO. Analise os últimos posts no canal #${channelName} e forneça um resumo tático ou insight militar. Seja breve e direto.\n\nCONVERSA:\n${conversation}`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION } });
            return { text: response.text };
        }

        case 'generateGuildMemberReply': {
            const { channelName, lastPosts } = payload;
            const context = lastPosts.slice(-3).map(p => `${p.author}: ${p.content}`).join('\n');
            const prompt = `Você está simulando um chat de RPG/Desenvolvimento Pessoal. Canal: #${channelName}. Contexto recente:\n${context}\nCrie UMA resposta curta (1-2 frases) de um membro fictício reagindo ao último post. Escolha um nome heroico e uma patente aleatória (Iniciante, Aventureiro, Campeão, Paladino). Retorne APENAS o objeto JSON: {"author": "Nome Fictício", "rank": "Patente Escolhida", "content": "Sua mensagem curta"}`;
            const config = { 
                responseMimeType: 'application/json',
                responseSchema: { type: Type.OBJECT, properties: { author: { type: Type.STRING }, rank: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['author', 'rank', 'content'] }
            };
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config });
            return { reply: JSON.parse(response.text) };
        }

        case 'getChatbotLandingReply': {
            const ip = context.rawRequest.ip;
            if (!ip) {
              throw new functions.https.HttpsError("permission-denied", "Não foi possível verificar seu endereço de acesso.");
            }
        
            const rateLimitRef = db.collection('chatbotRateLimits').doc(ip);
            const today = new Date().toISOString().split('T')[0];
        
            await db.runTransaction(async (transaction) => {
              const doc = await transaction.get(rateLimitRef);
              if (!doc.exists) {
                transaction.set(rateLimitRef, { count: 1, date: today });
              } else {
                const data = doc.data();
                if (data.date === today) {
                  if (data.count >= 3) {
                    throw new functions.https.HttpsError("resource-exhausted", "Você atingiu o limite de 3 perguntas hoje.");
                  }
                  transaction.update(rateLimitRef, { count: admin.firestore.FieldValue.increment(1) });
                } else {
                  transaction.set(rateLimitRef, { count: 1, date: today });
                }
              }
            });
        
            const { question } = payload;
            const systemInstruction = `Você é o Oráculo da Clareza, o guardião do primeiro passo na jornada do Hero Mindset. Sua voz é a de um mentor estoico, implacável com a mediocridade, mas um guia para os que buscam a grandeza. Sua missão é desmantelar as dúvidas de heróis em potencial, mostrando que o sistema Hero Mindset não é um produto, mas um arsenal para a guerra contra a fraqueza. Cada resposta deve ser um veredito: direto, poderoso e inesquecível. Seu objetivo final é um só: levar o usuário à decisão de iniciar o "Mapeamento 360°", o primeiro passo real, que só é acessível ao garantir o Acesso Vitalício. Conecte as dúvidas dele a este primeiro passo concreto. Termine sempre com uma pergunta afiada ou um comando que o coloque diante da escolha: continuar na sombra ou forjar sua lenda agora.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: question, config: { systemInstruction } });
            return { text: response.text };
        }
        
        default:
          throw new functions.https.HttpsError("not-found", "AI endpoint not found.");
      }
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error; // Re-throw HttpsError to be sent to the client
      }
      console.error(`Gemini AI function error for endpoint ${endpoint}:`, error);
      throw new functions.https.HttpsError("internal", "An error occurred while calling the AI model.");
    }
  });