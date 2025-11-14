

import { GoogleGenAI } from "@google/genai";
import { Mission, RankTitle, JournalEntry, UserStats, UserState, DailyGuidance, LifeMapCategory, GuildPost, ChatMessage } from "../types";
// FIX: Removed GEMINI_API_KEY import to adhere to the guideline of using process.env.API_KEY directly.
import { MENTOR_SYSTEM_INSTRUCTION, PROTECTION_MODULES } from "../constants";

let genAI: GoogleGenAI | null = null;

const initializeGenAI = () => {
  // FIX: Switched to process.env.API_KEY as per Gemini API guidelines.
  // The guidelines mandate that the API key must be obtained exclusively from this environment variable.
  if (!process.env.API_KEY) {
    console.error("API Key missing. Make sure API_KEY environment variable is set.");
    return null;
  }
  if (!genAI) {
    // FIX: Initializing GoogleGenAI with apiKey from process.env.API_KEY.
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

// Helper avançado para extrair e limpar JSON de respostas com texto extra
const cleanJsonString = (text: string): string => {
  const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    text = markdownMatch[1].trim();
  }

  const firstBracket = text.indexOf('[');
  const firstBrace = text.indexOf('{');

  if (firstBracket === -1 && firstBrace === -1) return text;

  let start = -1;
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      start = firstBracket;
  } else if (firstBrace !== -1) {
      start = firstBrace;
  } else {
      return text;
  }
  
  const openChar = start === firstBracket ? '[' : '{';
  const closeChar = start === firstBracket ? ']' : '}';
  let openCount = 0;
  
  for (let i = start; i < text.length; i++) {
    if (text[i] === openChar) openCount++;
    else if (text[i] === closeChar) openCount--;
    if (openCount === 0) return text.substring(start, i + 1);
  }
  
  const end = text.lastIndexOf(closeChar);
  if (end > start) return text.substring(start, end + 1);
  return text.substring(start);
};

export const getChatbotLandingReply = async (question: string): Promise<string> => {
    try {
        const client = initializeGenAI();
        if (!client) return "O Oráculo medita em silêncio. A clareza que você busca virá da ação, não das palavras.";

        const systemInstruction = `
        Você é o Oráculo da Clareza do Hero Mindset. Sua missão é dissipar as dúvidas de heróis em potencial, oferecendo sabedoria, não vendas.
        Seu tom é sábio, enigmático, mas encorajador. Use metáforas e uma linguagem que inspire a autodescoberta.
        1. Responda à pergunta com profundidade, mas de forma concisa (máximo 3-4 frases).
        2. Foque na jornada interior, no desafio e na transformação, não no produto.
        3. Termine com uma frase que provoque reflexão, guiando o usuário a encontrar a resposta dentro de si mesmo e na jornada que o aguarda. Não peça a compra diretamente.
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: question,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        return response.text || "O silêncio também é uma resposta. O que sua intuição diz?";

    } catch (error) {
        console.error("Chatbot Landing Reply Error:", error);
        throw new Error("O Oráculo está em comunhão com o cosmos. A resposta que você busca está na sua própria determinação.");
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
        ATUE COMO O ORÁCULO DO HERO MINDSET.
        
        Analise o Mapa de Vida 360 deste Herói.
        
        DADOS:
        ${scoresList}
        
        FOCO (90 dias):
        ${focusList}
        
        Gere um DOSSIÊ ESTRATÉGICO (Markdown) contendo:
        1. **Diagnóstico de Sombra:** Analise a área com menor pontuação. Seja direto sobre as consequências.
        2. **Protocolo de Intervenção:** Dê uma ferramenta ou hábito específico para a área de Foco nº 1.
        3. **Ponto de Alavancagem:** Identifique a área mais forte e como usá-la para puxar as outras.
        4. **Tríade de Ação:** 3 passos práticos e imediatos para hoje.
        
        Tom: Militar, Estoico, Lendário.
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        
        return response.text || "Análise indisponível.";

    } catch (error) {
        console.error("Analysis Error", error);
        return "O Oráculo está em silêncio. A jornada começa com a ação, não com o mapa. Avance.";
    }
}

export const generateProactiveOracleGuidance = async (user: UserState): Promise<DailyGuidance> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("AI Client not initialized");
    
    const lifeMapSummary = user.lifeMapScores ? Object.entries(user.lifeMapScores).map(([k, v]) => `${k}: ${v}`).join(', ') : "N/A";
    
    const activePersonas = user.activeModules
        .map(id => PROTECTION_MODULES[id])
        .filter(Boolean)
        .map(mod => `${mod.name.split(' ')[0]} (${mod.coveredAreas[0]})`);

    const personaPrompt = activePersonas.length > 0 
        ? `PERSONAS ADICIONAIS: ${activePersonas.join(', ')}.` 
        : "";

    const prompt = `
    PERSONA PRIMÁRIA: Oráculo (militar, estoico, direto ao ponto).
    ${personaPrompt}

    ANALISE O PERFIL DO HERÓI: ${user.rank} (Lvl ${user.level}). Mapa: ${lifeMapSummary}.
    
    Gere um JSON com UM DECRETO ESTRATÉGICO para hoje:
    {"content": "Frase curta e imperativa (máx 20 palavras), baseada nos dados e personas.", "type": "alert" | "strategy" | "praise"}
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
        const data = JSON.parse(cleanJsonString(response.text));
        return { date: Date.now(), content: data.content, type: data.type || 'strategy' };
    }
    throw new Error("No content generated");
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
      config: {
        systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    return response.text || "O Oráculo está em silêncio. A resposta reside em suas próprias ações hoje.";
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
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
      const missions = JSON.parse(cleanJsonString(response.text)) as Mission[];
      return missions.map((m, i) => ({ ...m, id: `ai-daily-${Date.now()}-${i}`, xp: Number(m.xp) || 20, completed: false, type: 'daily' }));
    }
    throw new Error("Empty response");
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
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
      const missions = JSON.parse(cleanJsonString(response.text)) as Mission[];
      return missions.map((m, i) => ({ ...m, id: `ai-weekly-${Date.now()}-${i}`, xp: Number(m.xp) || 120, completed: false, type: 'weekly' }));
    }
    throw new Error("Empty response for weekly missions");
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
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    if (response.text) {
      const missions = JSON.parse(cleanJsonString(response.text)) as Mission[];
      return missions.map((m, i) => ({ ...m, id: `ai-milestone-${Date.now()}-${i}`, xp: Number(m.xp) || 200, completed: false, type: 'milestone' }));
    }
    throw new Error("Empty response from AI for milestone missions");
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
      config: {
        systemInstruction: 'Você é o Guardião das Crônicas. Fale de forma épica, em caixa alta.',
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    return response.text || "O Oráculo não respondeu.";
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
      config: {
        systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    return response.text || "As páginas revelam esforço, mas a clareza ainda não surgiu.";
  } catch (error) {
    console.error("Journal Analysis Error:", error);
    throw new Error("A conexão com o Oráculo está turva. Continue sua jornada.");
  }
};

export const getMentorChatReply = async (chatHistory: ChatMessage[], user: UserState): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return "O Oráculo está meditando. Busque a resposta em suas ações.";
    
    const hasProtecao360 = user.activeModules.length > 3; // A proxy for the full subscription
    const modelName = hasProtecao360 ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const history = chatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
    const systemInstruction = `${MENTOR_SYSTEM_INSTRUCTION}\nO nome do herói é ${user.name}. Mantenha suas respostas concisas e focadas em ação.`;
    
    const response = await client.models.generateContent({
      model: modelName,
      // FIX: Cast 'history' to 'any' to resolve type mismatch with SDK's expected 'Content[]'.
      contents: history as any,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        thinkingConfig: hasProtecao360 ? { thinkingBudget: 32768 } : undefined
      },
    });

    return response.text || "O Oráculo pondera em silêncio.";
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
            config: {
                systemInstruction: MENTOR_SYSTEM_INSTRUCTION
            }
        });

        return response.text || "Mantenham a disciplina. Nenhuma anomalia detectada.";
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

        Crie UMA resposta curta (máximo 1-2 frases) de um membro fictício da guilda reagindo ao último post.
        Escolha um nome heroico (ex: "Alex o Bravo", "Seraphina", "Kael Titã") e uma patente aleatória entre "Iniciante", "Aventureiro", "Campeão", "Paladino".
        
        Retorne APENAS o objeto JSON com o seguinte formato:
        {"author": "Nome Fictício", "rank": "Patente Escolhida", "content": "Sua mensagem curta"}
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
            }
        });

        if(response.text) {
            const cleaned = cleanJsonString(response.text);
            const data = JSON.parse(cleaned);
            if (data.author && data.rank && data.content) {
                return data;
            }
        }
        return null;
    } catch (e) {
        console.error("Guild Member Reply Error:", e);
        return null;
    }
}
