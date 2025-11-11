
import { GoogleGenAI } from "@google/genai";
import { Mission, LessonDetails, RankTitle, JournalEntry, UserStats, ChatMessage, UserState, DailyGuidance, GuildPost, LifeMapCategory } from "../types";
import { MENTOR_SYSTEM_INSTRUCTION, PROTECTION_MODULES } from "../constants";

let genAI: GoogleGenAI | null = null;

const initializeGenAI = () => {
  if (!process.env.API_KEY) {
    // Retorna null silenciosamente para permitir fallback gracefully
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

// Helper avançado para extrair e limpar JSON de respostas com texto extra
const cleanJsonString = (text: string): string => {
  // Case 1: JSON is inside markdown code blocks
  const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    text = markdownMatch[1].trim();
  }

  // Case 2: Raw JSON, possibly with leading/trailing garbage
  const firstBracket = text.indexOf('[');
  const firstBrace = text.indexOf('{');

  if (firstBracket === -1 && firstBrace === -1) {
    return text; // No JSON found, return as-is
  }

  let start = -1;
  let isArray = false;
  
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      start = firstBracket;
      isArray = true;
  } else if (firstBrace !== -1) {
      start = firstBrace;
      isArray = false;
  } else {
      return text; // Should not happen given previous check
  }
  
  const openChar = isArray ? '[' : '{';
  const closeChar = isArray ? ']' : '}';
  let openCount = 0;
  
  for (let i = start; i < text.length; i++) {
    if (text[i] === openChar) {
      openCount++;
    } else if (text[i] === closeChar) {
      openCount--;
    }
    
    if (openCount === 0) {
      // We found the matching end brace/bracket
      return text.substring(start, i + 1);
    }
  }

  // Fallback: If no matching brace is found (malformed), try a simpler slice
  // This helps with truncated responses.
  const lastBracket = text.lastIndexOf(']');
  const lastBrace = text.lastIndexOf('}');
  const end = isArray ? lastBracket : lastBrace;

  if (end > start) {
      return text.substring(start, end + 1);
  }

  return text.substring(start);
};

// --- DEEP INSIGHT ENGINE (MODELO PRO) ---

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
        4. **Tríade de Ação:** 3 passos práticos para hoje.
        
        Tom: Militar, Estoico, Lendário.
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
                thinkingConfig: { thinkingBudget: 2048 } // Pensamento profundo para insights complexos
            }
        });
        
        return response.text || "Análise indisponível.";

    } catch (error) {
        console.error("Analysis Error", error);
        return "O Oráculo está em silêncio.";
    }
}

export const analyzeJournalAI = async (entries: JournalEntry[], userName: string): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return "Modo Offline.";

    const recentEntriesText = entries.slice(-5).map(e => `[${new Date(e.date).toLocaleDateString()}] ${e.content}`).join('\n');
    
    const prompt = `Analise o Diário do Herói ${userName}:\n\n${recentEntriesText}\n\n
    Identifique padrões, virtudes e sombras. Dê um conselho profundo e termine com uma pergunta reflexiva.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });

    return response.text || "Sem análise.";
  } catch (error) {
    return "Erro na conexão neural.";
  }
};

export const generateDailyAnalysisAI = async (userState: {rank: RankTitle, stats: UserStats, journalEntries: JournalEntry[]}): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return "Modo Offline.";

    const { rank, stats, journalEntries } = userState;
    const statsString = `Mente: ${stats.mind}, Corpo: ${stats.body}, Espírito: ${stats.spirit}, Riqueza: ${stats.wealth}`;
    const journalSummary = journalEntries.length > 0
        ? `Último registro: "${journalEntries[0].content}"`
        : "Diário vazio.";

    const prompt = `Analise este Herói (${rank}, Stats: ${statsString}). ${journalSummary}.
    Forneça: 1. Virtude em Foco, 2. Sombra a Enfrentar, 3. Oráculo do Dia.
    Seja conciso e lendário.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    return response.text || "Silêncio.";
  } catch (error) {
    return "Oráculo indisponível.";
  }
};

// --- HIGH VELOCITY ENGINE (MODELO FLASH) ---

export const generateProactiveOracleGuidance = async (user: UserState): Promise<DailyGuidance> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("Offline");
    
    const lifeMapSummary = user.lifeMapScores 
        ? Object.entries(user.lifeMapScores).map(([k, v]) => `${k}: ${v}`).join(', ')
        : "N/A";

    // Determine active personas based on protection modules
    let specializedPersona = "";
    if (user.activeModules.includes('tita')) specializedPersona += " Atue também como um Biohacker de Elite (Saúde).";
    if (user.activeModules.includes('soberano')) specializedPersona += " Atue também como um Estrategista de Negócios (Business).";
    if (user.activeModules.includes('monge')) specializedPersona += " Atue também como um Mestre Estoico (Espiritual).";

    const prompt = `
    ATUE COMO O ORÁCULO. ${specializedPersona}
    PERFIL: ${user.rank} (Lvl ${user.level}). Mapa: ${lifeMapSummary}.
    
    Gere um JSON:
    {"content": "Frase curta, imperativa e militar (máx 20 palavras) baseada nos dados e nos módulos ativos.", "type": "alert" | "strategy" | "praise"}
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash', // Flash para resposta instantânea
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
        const cleaned = cleanJsonString(response.text);
        const data = JSON.parse(cleaned);
        return { date: Date.now(), content: data.content, type: data.type || 'strategy' };
    }
    throw new Error("No content");
  } catch (error) {
    // Fallback local para "Consumo Mínimo de Dados"
    return { date: Date.now(), content: "A disciplina é a ponte entre metas e realizações. Mantenha o foco.", type: 'strategy' };
  }
};

export const generateDailyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("Offline");

    const prompt = `Gere 4 missões diárias RPG para herói lvl ${level}, rank ${rank}.
    Categorias: 'Fitness', 'Learning', 'Finance', 'Mindset'.
    JSON Array Only: [{"title": "...", "xp": 20-50, "category": "..."}]`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
      const cleanedText = cleanJsonString(response.text);
      const missions = JSON.parse(cleanedText) as any[];
      return missions.map((m, i) => ({
        id: `ai-daily-${Date.now()}-${i}`,
        title: m.title,
        xp: Number(m.xp) || 20,
        completed: false,
        type: 'daily',
        category: m.category
      }));
    }
    throw new Error("Empty");
  } catch (error) {
    return []; // App.tsx usará STATIC_DAILY_MISSIONS como fallback
  }
};

export const generateWeeklyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("Offline");

    const prompt = `Gere 3 missões semanais épicas para herói lvl ${level}.
    Categorias: 'Fitness', 'Learning', 'Finance', 'Mindset'.
    JSON Array Only: [{"title": "...", "xp": 100-200, "category": "..."}]`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
      const cleanedText = cleanJsonString(response.text);
      const missions = JSON.parse(cleanedText) as any[];
      return missions.map((m, i) => ({
        id: `ai-weekly-${Date.now()}-${i}`,
        title: m.title,
        xp: Number(m.xp) || 120,
        completed: false,
        type: 'weekly',
        category: m.category
      }));
    }
    throw new Error("Empty");
  } catch (error) {
    return []; // App.tsx usará fallback
  }
};

export const generateMilestoneMissionsAI = async (
  level: number,
  rank: RankTitle,
  stats: UserStats,
  journalEntries: JournalEntry[]
): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    if (!client) throw new Error("Offline");

    const prompt = `Gere 2 missões de MARCO (milestone) épicas e difíceis para herói lvl ${level}.
    JSON Array Only: [{"title": "...", "xp": 200-300, "category": "..."}]`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
      const cleanedText = cleanJsonString(response.text);
      const missions = JSON.parse(cleanedText) as any[];
      return missions.map((m, i) => ({
        id: `ai-milestone-${Date.now()}-${i}`,
        title: m.title,
        xp: Number(m.xp) || 200,
        completed: false,
        type: 'milestone',
        category: m.category
      }));
    }
    throw new Error("Empty");
  } catch (error) {
    return [];
  }
};

export const generateChannelInsightAI = async (
    channelName: string,
    lastPosts: GuildPost[]
): Promise<string> => {
    try {
        const client = initializeGenAI();
        if (!client) return "Sistemas de comunicação offline.";

        const conversation = lastPosts.map(p => `${p.author}: ${p.content}`).join('\n');
        const prompt = `ATUE COMO O ORÁCULO. Resumo tático do canal ${channelName}:\n${conversation}\nSeja breve e militar.`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Mantenham a disciplina.";
    } catch (error) {
        return "Interferência no sinal.";
    }
}

export const generateGuildMemberReply = async (
    channelName: string,
    lastPosts: GuildPost[]
): Promise<{author: string, rank: RankTitle, content: string} | null> => {
    try {
        const client = initializeGenAI();
        if (!client) return null;

        const context = lastPosts.slice(0, 3).map(p => `${p.author}: ${p.content}`).join('\n');
        const prompt = `
        Você está simulando um chat de RPG/Desenvolvimento Pessoal.
        Canal: #${channelName}.
        Contexto recente:
        ${context}

        Crie UMA resposta curta (máx 1 frase) de um membro fictício da guilda reagindo ao último post.
        Escolha um nome heroico (ex: "Titã", "Fênix", "Lobo") e uma patente (Iniciante, Aventureiro, Campeão, Paladino, Lendário).
        
        Formato JSON obrigatório:
        {"author": "Nome", "rank": "Patente", "content": "Mensagem"}
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        if(response.text) {
            return JSON.parse(cleanJsonString(response.text));
        }
        return null;
    } catch (e) {
        return null;
    }
}

export const generateBossVictorySpeech = async (lastMessages: any[], bossName: string): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return `${bossName} FOI ELIMINADO. VITÓRIA DA GUILDA!`;

    const prompt = `O boss ${bossName} caiu. Gere um discurso de vitória curto e ÉPICO (Caixa alta).`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || `${bossName} CAIU! A GLÓRIA É ETERNA!`;
  } catch (error) {
    return `${bossName} CAIU! A GLÓRIA É ETERNA!`;
  }
};

export const getMentorChatReply = async (
  chatHistory: ChatMessage[],
  newMessage: string,
  userName: string
): Promise<string> => {
  try {
    const client = initializeGenAI();
    if (!client) return "O Oráculo está offline. Consulte seus instintos.";
    
    const history = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));
    
    const contents = history;
    const systemInstruction = `${MENTOR_SYSTEM_INSTRUCTION}\nHerói: ${userName}. Respostas curtas e táticas.`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 2048 }
      },
    });

    return response.text || "...";
  } catch (error) {
    return "Conexão perdida.";
  }
};
