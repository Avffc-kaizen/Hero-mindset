

import { GoogleGenAI, Type } from "@google/genai";
// FIX: Corrected import paths for types and constants to point to the 'src' directory.
import { Mission, RankTitle, JournalEntry, UserStats, UserState, DailyGuidance, LifeMapCategory, GuildPost, ChatMessage } from "../src/types";
import { MENTOR_SYSTEM_INSTRUCTION, PROTECTION_MODULES } from "../src/constants";

let genAI: GoogleGenAI | null = null;

const initializeGenAI = () => {
  // FIX: Use process.env.API_KEY as per @google/genai guidelines.
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable is missing. AI features will be disabled.");
    return null;
  }
  if (!genAI) {
    // FIX: Use process.env.API_KEY for initialization.
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

// Helper to clean and parse JSON from AI responses
const cleanAndParseJson = (text: string): any => {
    try {
        const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        let cleanText = markdownMatch ? markdownMatch[1].trim() : text.trim();

        const firstBracket = cleanText.indexOf('[');
        const firstBrace = cleanText.indexOf('{');
        
        let start = -1;
        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            start = firstBracket;
        } else {
            start = firstBrace;
        }

        if (start === -1) throw new Error("No JSON object or array found in the string.");

        const openChar = cleanText[start];
        const closeChar = openChar === '{' ? '}' : ']';
        let openCount = 0;
        let end = -1;

        for (let i = start; i < cleanText.length; i++) {
            if (cleanText[i] === openChar) openCount++;
            else if (cleanText[i] === closeChar) openCount--;
            if (openCount === 0) {
                end = i;
                break;
            }
        }
        
        if (end === -1) throw new Error("Invalid JSON structure: No closing bracket/brace found.");

        const jsonString = cleanText.substring(start, end + 1);
        return JSON.parse(jsonString);
    } catch (e: any) {
        console.error("Failed to parse JSON from AI response:", e, "Raw text:", text);
        throw new Error("A resposta do Oráculo está em um formato inválido.");
    }
};

export const generateDetailedLifeMapAnalysis = async (
    scores: Record<LifeMapCategory, number>,
    focusAreas: LifeMapCategory[]
): Promise<string> => {
    try {
        const client = initializeGenAI();
        if (!client) return "Modo Offline: A análise detalhada requer conexão com o Oráculo.";

        const scoresList = Object.entries(scores).map(([k, v]) => `${k}: ${v}/10`).join('\n');
        const focusList = focusAreas.join(', ');

        const prompt = `
        ATUE COMO O ORÁULO DO HERO MINDSET.
        Analise o Mapa de Vida 360 deste Herói.
        DADOS: ${scoresList}
        FOCO (90 dias): ${focusList}
        Gere um DOSSIÊ ESTRATÉGICO (Markdown) contendo:
        1. **Diagnóstico de Sombra:** Analise a área com menor pontuação.
        2. **Protocolo de Intervenção:** Dê uma ferramenta ou hábito para a área de Foco nº 1.
        3. **Ponto de Alavancagem:** Identifique a área mais forte e como usá-la.
        4. **Tríade de Ação:** 3 passos práticos para hoje.
        Tom: Militar, Estoico, Lendário.
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
            }
        });
        
        return response.text;

    } catch (error) {
        console.error("Analysis Error", error);
        return "O Oráculo está em silêncio. Avance.";
    }
}

export const generateProactiveOracleGuidance = async (user: UserState): Promise<DailyGuidance> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("AI Client not initialized");
    
    const lifeMapSummary = user.lifeMapScores ? Object.entries(user.lifeMapScores).map(([k, v]) => `${k}: ${v}`).join(', ') : "N/A";
    const prompt = `Analisar perfil do herói: ${user.rank} (Lvl ${user.level}). Mapa: ${lifeMapSummary}. Gere um JSON com UM DECRETO ESTRATÉGICO para hoje: {"content": "Frase curta e imperativa.", "type": "alert" | "strategy" | "praise"}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        // FIX: Added response schema for better JSON generation reliability.
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            type: { type: Type.STRING },
          },
          // FIX: Added required properties to ensure consistent JSON output.
          required: ['content', 'type'],
        },
      }
    });
    const data = cleanAndParseJson(response.text);
    return { date: Date.now(), content: data.content, type: data.type || 'strategy' };
  } catch (error) {
    console.error("Proactive Oracle Error:", error);
    return { date: Date.now(), content: "A disciplina é sua bússola hoje. Use-a.", type: 'strategy' };
  }
};

export const generateDailyAnalysisAI = async (userState: {rank: RankTitle, stats: UserStats, journalEntries: JournalEntry[]}): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return "O Oráculo está offline. A sabedoria reside em suas ações.";
    const { rank, stats, journalEntries } = userState;
    const statsString = `Mente: ${stats.mind}, Corpo: ${stats.body}, Espírito: ${stats.spirit}, Riqueza: ${stats.wealth}`;
    const journalSummary = journalEntries.length > 0 ? `Último registro: "${journalEntries[0].content}"` : "Diário vazio.";

    const prompt = `Analise o estado deste Herói: ${rank}, Status: ${statsString}, ${journalSummary}. Forneça: 1. Virtude em Foco, 2. Sombra a Enfrentar, 3. Oráculo do Dia. Seja inspirador e use a persona do Oráculo. Não use markdown.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION },
    });

    return response.text;
  } catch (error: any) {
    console.error("Error generating daily analysis:", error);
    throw new Error("A conexão com o Oráculo falhou. Siga sua intuição.");
  }
};

export const generateDailyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("AI Client not initialized");
    const prompt = `Gere 4 missões diárias para um herói de nível ${level}, patente ${rank}, em JSON. Categorias: 'Fitness', 'Learning', 'Finance', 'Mindset'. XP: 15-50. Retorne APENAS o array JSON cru.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              xp: { type: Type.NUMBER },
            },
            // FIX: Added required properties to ensure consistent JSON output.
            required: ['title', 'category', 'xp'],
          }
        }
      }
    });
    const missions = cleanAndParseJson(response.text) as Mission[];
    return missions.map((m, i) => ({ ...m, id: `ai-daily-${Date.now()}-${i}`, xp: Number(m.xp) || 20, completed: false, type: 'daily' }));
  } catch (error: any) {
    console.error("AI Mission Generation Error:", error);
    throw new Error(error.message || "O Oráculo falhou ao gerar missões diárias.");
  }
};

export const generateWeeklyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("AI Client not initialized");
    const prompt = `Gere 3 missões semanais para um herói de nível ${level}, patente ${rank}, em JSON. Categorias: 'Fitness', 'Learning', 'Finance', 'Mindset'. XP: 100-200. Retorne APENAS o array JSON cru.`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              xp: { type: Type.NUMBER },
            },
            // FIX: Added required properties to ensure consistent JSON output.
            required: ['title', 'category', 'xp'],
          }
        }
      }
    });
    const missions = cleanAndParseJson(response.text) as Mission[];
    return missions.map((m, i) => ({ ...m, id: `ai-weekly-${Date.now()}-${i}`, xp: Number(m.xp) || 120, completed: false, type: 'weekly' }));
  } catch (error: any) {
    console.error("AI Weekly Mission Generation Error:", error);
    throw new Error(error.message || "O Oráculo falhou ao gerar missões semanais.");
  }
};

export const generateMilestoneMissionsAI = async (level: number, rank: RankTitle, stats: UserStats, journalEntries: JournalEntry[]): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("AI Client not initialized");
    const statsString = `Mente: ${stats.mind}, Corpo: ${stats.body}, Espírito: ${stats.spirit}, Riqueza: ${stats.wealth}`;
    const journalSummary = journalEntries.length > 0 ? `Diário: ${journalEntries.map(e => e.content).join('; ')}` : "Diário vazio.";

    const prompt = `Baseado no perfil (Nível ${level}, ${rank}, Stats: ${statsString}, ${journalSummary}), gere 2 missões de marco (milestone) de longo prazo. XP: 150-300. Retorne APENAS um array JSON cru.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              xp: { type: Type.NUMBER },
            },
            // FIX: Added required properties to ensure consistent JSON output.
            required: ['title', 'category', 'xp'],
          }
        }
      }
    });
    const missions = cleanAndParseJson(response.text) as Mission[];
    return missions.map((m, i) => ({ ...m, id: `ai-milestone-${Date.now()}-${i}`, xp: Number(m.xp) || 200, completed: false, type: 'milestone' }));
  } catch (error: any) {
    console.error("AI Milestone Mission Generation Error:", error);
    throw new Error(error.message || "O Oráculo falhou ao gerar os marcos épicos.");
  }
};

export const generateBossVictorySpeech = async (lastMessages: any[], bossName: string): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return `O DESAFIO "${bossName}" FOI SUPERADO! A CRÔNICA FOI ESCRITA.`;
    const chatHistory = lastMessages.map(m => `${m.author}: ${m.content}`).join('\n');
    const prompt = `O desafio "${bossName}" foi superado. Analise o esforço conjunto e crie um discurso curto e épico declarando a vitória, como um bardo narrando um grande feito. Termine EXATAMENTE com: "A CRÔNICA FOI ESCRITA. UM NOVO CAPÍTULO AGUARDA."`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { systemInstruction: 'Você é o Guardião das Crônicas. Fale de forma épica, em caixa alta.' }
    });

    return response.text;
  } catch (error) {
    console.error("Boss Victory Speech Error:", error);
    throw new Error("O Oráculo falhou ao registrar o feito. A vitória ainda é sua!");
  }
};

export const analyzeJournalAI = async (entries: JournalEntry[], userName: string): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return "O Oráculo está offline. Continue a jornada, a clareza virá da ação.";
    const recentEntriesText = entries.slice(-5).map(e => `[${new Date(e.date).toLocaleDateString()}] ${e.content}`).join('\n');
    
    const prompt = `Analise as entradas do Diário do Herói ${userName}:\n\n${recentEntriesText}\n\nComo Oráculo, forneça uma análise inspiradora: 1. Identifique um padrão (virtude ou sombra). 2. Dê um conselho profundo. 3. Termine com UMA pergunta reflexiva. Seja direto e use a persona do Oráculo.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION },
    });

    return response.text;
  } catch (error) {
    console.error("Journal Analysis Error:", error);
    throw new Error("A conexão com o Oráculo está turva. Continue sua jornada.");
  }
};

export const getMentorChatReply = async (chatHistory: ChatMessage[], user: UserState): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return "O Oráculo está meditando. Busque a resposta em suas ações.";
    
    const hasProtecao360 = user.activeModules.length > 3;
    const modelName = hasProtecao360 ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const history = chatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
    const systemInstruction = `${MENTOR_SYSTEM_INSTRUCTION}\nO nome do herói é ${user.name}. Mantenha suas respostas concisas e focadas em ação.`;
    
    const response = await client.models.generateContent({
      model: modelName,
      contents: history as any,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error getting mentor chat reply:", error);
    throw new Error("A conexão com o Oráculo falhou. Busque a sabedoria no silêncio.");
  }
};

export const generateChannelInsightAI = async (
    channelName: string,
    lastPosts: GuildPost[]
): Promise<string> => {
    try {
        const client = initializeGenAI();
        if (!client) return "Sistemas de comunicação offline.";

        const conversation = lastPosts.slice(-5).map(p => `${p.author}: ${p.content}`).join('\n');
        const prompt = `ATUE COMO O ORÁCULO. Analise os últimos posts no canal #${channelName} e forneça um resumo tático ou insight militar. Seja breve e direto.\n\nCONVERSA:\n${conversation}`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION }
        });

        return response.text;
    } catch (error) {
        console.error("Channel Insight Error:", error);
        return "Interferência no sinal. Comunicação com o Oráculo perdida.";
    }
}

export const generateGuildMemberReply = async (
    channelName: string,
    lastPosts: GuildPost[]
): Promise<{author: string, rank: RankTitle, content: string} | null> => {
    try {
        const client = initializeGenAI();
        if (!client) return null;

        const context = lastPosts.slice(-3).map(p => `${p.author}: ${p.content}`).join('\n');
        const prompt = `
        Você está simulando um chat de RPG/Desenvolvimento Pessoal.
        Canal: #${channelName}.
        Contexto recente:
        ${context}
        Crie UMA resposta curta (1-2 frases) de um membro fictício reagindo ao último post.
        Escolha um nome heroico e uma patente aleatória (Iniciante, Aventureiro, Campeão, Paladino).
        Retorne APENAS o objeto JSON: {"author": "Nome Fictício", "rank": "Patente Escolhida", "content": "Sua mensagem curta"}
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                // FIX: Added response schema for better JSON generation reliability.
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    author: { type: Type.STRING },
                    rank: { type: Type.STRING },
                    content: { type: Type.STRING },
                  },
                  // FIX: Added required properties to ensure consistent JSON output.
                  required: ['author', 'rank', 'content'],
                },
            }
        });
        const data = cleanAndParseJson(response.text);
        if (data.author && data.rank && data.content) {
            return data as {author: string, rank: RankTitle, content: string};
        }
        return null;
    } catch (e) {
        console.error("Guild Member Reply Error:", e);
        return null;
    }
}

export const getChatbotLandingReply = async (question: string): Promise<string> => {
    try {
        const client = initializeGenAI();
        if (!client) return "O Oráculo medita em silêncio. A clareza virá da ação.";

        const systemInstruction = `Você é o Oráculo da Clareza. Responda a perguntas de heróis em potencial de forma sábia e enigmática, focando na jornada interior. Seja conciso e termine com uma reflexão.`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: question,
            config: { systemInstruction }
        });

        return response.text;

    } catch (error) {
        console.error("Chatbot Landing Reply Error:", error);
        throw new Error("A conexão com o Oráculo falhou.");
    }
};