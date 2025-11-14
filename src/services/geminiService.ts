import { GoogleGenAI, Type } from "@google/genai";
import { Mission, RankTitle, JournalEntry, UserStats, UserState, DailyGuidance, LifeMapCategory, GuildPost, ChatMessage } from "../types";
import { MENTOR_SYSTEM_INSTRUCTION, PROTECTION_MODULES, GEMINI_API_KEY } from "../constants";

let genAI: GoogleGenAI | null = null;

const initializeGenAI = () => {
  if (!GEMINI_API_KEY) {
    console.error("VITE_GEMINI_API_KEY is missing. AI features will be disabled.");
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return genAI;
};

const cleanAndParseJson = (text: string): any => {
    try {
        const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        let cleanText = markdownMatch ? markdownMatch[1].trim() : text.trim();

        // Find the first '{' or '['
        const firstBracket = cleanText.indexOf('[');
        const firstBrace = cleanText.indexOf('{');
        
        let start = -1;
        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            start = firstBracket;
        } else {
            start = firstBrace;
        }

        if (start === -1) {
            throw new Error("No JSON object or array found in the string.");
        }

        // Find the matching '}' or ']'
        const openChar = cleanText[start];
        const closeChar = openChar === '{' ? '}' : ']';
        let openCount = 0;
        let end = -1;

        for (let i = start; i < cleanText.length; i++) {
            if (cleanText[i] === openChar) {
                openCount++;
            } else if (cleanText[i] === closeChar) {
                openCount--;
            }
            if (openCount === 0) {
                end = i;
                break;
            }
        }
        
        if (end === -1) {
           throw new Error("Invalid JSON structure: No closing bracket/brace found.");
        }

        const jsonString = cleanText.substring(start, end + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", e, "Raw text:", text);
        throw new Error("A resposta do Oráculo está em um formato inválido.");
    }
};

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

export const generateDetailedLifeMapAnalysis = async (scores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[]): Promise<string> => {
    try {
        const client = initializeGenAI();
        if (!client) return "Modo Offline: Análise indisponível.";
        const prompt = `Analise este Mapa de Vida: ${JSON.stringify(scores)}. Foco: ${focusAreas.join(', ')}. Gere um dossiê estratégico em Markdown com Diagnóstico de Sombra, Protocolo de Intervenção, Ponto de Alavancagem e Tríade de Ação. Tom militar e estoico.`;
        const response = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION }
        });
        return response.text;
    } catch (error) {
        console.error("Analysis Error", error);
        return "O Oráculo está em silêncio.";
    }
};

export const generateProactiveOracleGuidance = async (user: UserState): Promise<DailyGuidance> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("AI Client not initialized");
    const prompt = `Analisar perfil do herói: ${user.rank} Lvl ${user.level}. Gerar um JSON com um decreto estratégico para hoje: {"content": "Frase curta e imperativa.", "type": "alert" | "strategy" | "praise"}`;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
          responseMimeType: 'application/json',
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  content: { type: Type.STRING },
                  type: { type: Type.STRING }
              }
          }
      }
    });
    const data = cleanAndParseJson(response.text);
    return { date: Date.now(), content: data.content, type: data.type || 'strategy' };
  } catch (error) {
    console.error("Proactive Oracle Error:", error);
    return { date: Date.now(), content: "A disciplina é sua bússola hoje.", type: 'strategy' };
  }
};

export const generateDailyAnalysisAI = async (userState: {rank: RankTitle, stats: UserStats, journalEntries: JournalEntry[]}): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return "O Oráculo está offline.";
    const prompt = `Analisar Herói: ${userState.rank}, Status: ${JSON.stringify(userState.stats)}. Forneça: 1. Virtude em Foco, 2. Sombra a Enfrentar, 3. Oráculo do Dia.`;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION },
    });
    return response.text;
  } catch (error: any) {
    throw new Error("A conexão com o Oráculo falhou.");
  }
};

export const generateDailyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("AI Client not initialized");
    const prompt = `Gere 4 missões diárias para um herói nível ${level} (${rank}) em JSON. Categorias: 'Fitness', 'Learning', 'Finance', 'Mindset'. XP: 15-50. Retorne APENAS o array JSON.`;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const missions = cleanAndParseJson(response.text) as Mission[];
    return missions.map((m, i) => ({ ...m, id: `ai-daily-${Date.now()}-${i}`, xp: Number(m.xp) || 20, completed: false, type: 'daily' }));
  } catch (error: any) {
    throw new Error("O Oráculo falhou ao gerar missões diárias.");
  }
};

export const generateWeeklyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("AI Client not initialized");
    const prompt = `Gere 3 missões semanais para um herói nível ${level} (${rank}) em JSON. Categorias: 'Fitness', 'Learning', 'Finance'. XP: 100-200. Retorne APENAS o array JSON.`;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const missions = cleanAndParseJson(response.text) as Mission[];
    return missions.map((m, i) => ({ ...m, id: `ai-weekly-${Date.now()}-${i}`, xp: Number(m.xp) || 120, completed: false, type: 'weekly' }));
  } catch (error: any) {
    throw new Error("O Oráculo falhou ao gerar missões semanais.");
  }
};

export const generateMilestoneMissionsAI = async (level: number, rank: RankTitle, stats: UserStats, journalEntries: JournalEntry[]): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("AI Client not initialized");
    const prompt = `Baseado no perfil (Nível ${level}, ${rank}), gere 2 missões de marco (milestone) de longo prazo em JSON. XP: 150-300. Retorne APENAS o array JSON.`;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const missions = cleanAndParseJson(response.text) as Mission[];
    return missions.map((m, i) => ({ ...m, id: `ai-milestone-${Date.now()}-${i}`, xp: Number(m.xp) || 200, completed: false, type: 'milestone' }));
  } catch (error: any) {
    throw new Error("O Oráculo falhou ao gerar os marcos épicos.");
  }
};

export const generateChannelInsightAI = async (channelName: string, lastPosts: GuildPost[]): Promise<string> => {
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
        throw new Error("Interferência no sinal. Comunicação com o Oráculo perdida.");
    }
};

export const generateGuildMemberReply = async (channelName: string, lastPosts: GuildPost[]): Promise<{author: string, rank: RankTitle, content: string} | null> => {
    try {
        const client = initializeGenAI();
        if (!client) return null;
        const context = lastPosts.slice(-3).map(p => `${p.author}: ${p.content}`).join('\n');
        const prompt = `Você está simulando um chat de RPG/Desenvolvimento Pessoal. Canal: #${channelName}. Contexto recente:\n${context}\n\nCrie UMA resposta curta (1-2 frases) de um membro fictício reagindo ao último post. Escolha um nome heroico e uma patente aleatória (Iniciante, Aventureiro, Campeão, Paladino). Retorne APENAS o objeto JSON: {"author": "Nome", "rank": "Patente", "content": "Sua mensagem"}`;
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        author: { type: Type.STRING },
                        rank: { type: Type.STRING },
                        content: { type: Type.STRING }
                    }
                }
            }
        });
        const data = cleanAndParseJson(response.text);
        if (data.author && data.rank && data.content) {
            return data;
        }
        return null;
    } catch (e) {
        console.error("Guild Member Reply Error:", e);
        return null;
    }
};

export const analyzeJournalAI = async (entries: JournalEntry[], userName: string): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return "O Oráculo está offline.";
    const recentEntriesText = entries.slice(-5).map(e => `[${new Date(e.date).toLocaleDateString()}] ${e.content}`).join('\n');
    const prompt = `Analise o Diário do Herói ${userName}:\n${recentEntriesText}\n\nComo Oráculo, forneça uma análise: 1. Padrão (virtude ou sombra). 2. Conselho. 3. UMA pergunta reflexiva. Seja direto.`;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { systemInstruction: MENTOR_SYSTEM_INSTRUCTION },
    });
    return response.text;
  } catch (error) {
    throw new Error("A conexão com o Oráculo está turva.");
  }
};
