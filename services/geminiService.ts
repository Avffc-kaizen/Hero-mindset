
import { GoogleGenAI } from "@google/genai";
import { Mission, LessonDetails, RankTitle, JournalEntry, UserStats, ChatMessage, UserState, DailyGuidance } from "../types";
import { MENTOR_SYSTEM_INSTRUCTION } from "../constants";

let genAI: GoogleGenAI | null = null;

const initializeGenAI = () => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    throw new Error("API_KEY is missing. AI functionalities are disabled.");
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

// Helper avançado para extrair e limpar JSON de respostas com texto extra
const cleanJsonString = (text: string) => {
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }
  return text.replace(/```json\s*|\s*```/g, '').trim();
};

export const generateProactiveOracleGuidance = async (user: UserState): Promise<DailyGuidance> => {
  try {
    const client = initializeGenAI();
    
    // 1. Construct User Profile String
    const lifeMapSummary = user.lifeMapScores 
        ? Object.entries(user.lifeMapScores).map(([k, v]) => `${k}: ${v}`).join(', ')
        : "N/A";

    const recentMissions = user.missions
        .filter(m => m.completed)
        .slice(0, 5)
        .map(m => m.title)
        .join(', ') || "Nenhuma recente";

    const recentLessons = user.modules
        .flatMap(m => m.lessons)
        .filter(l => l.completed)
        .slice(0, 5)
        .map(l => l.title)
        .join(', ') || "Nenhuma recente";

    const recentJournal = user.journalEntries.length > 0 
        ? `"${user.journalEntries[0].content}"` 
        : "Sem registros recentes";
    
    const skills = user.unlockedSkills.join(', ') || "Nenhuma";

    const prompt = `
    ATUE COMO O ORÁCULO. Analise este Herói e gere UM DECRETO ESTRATÉGICO para hoje.
    
    PERFIL DO HERÓI:
    - Arquétipo: ${user.archetype || 'Desconhecido'}
    - Rank: ${user.rank} (Nível ${user.level})
    - Mapa de Vida (0-10): ${lifeMapSummary}
    
    INTELIGÊNCIA RECENTE:
    - Missões Cumpridas: ${recentMissions}
    - Aulas Assistidas: ${recentLessons}
    - Habilidades Desbloqueadas: ${skills}
    - Último Pensamento (Diário): ${recentJournal}
    
    SUA MISSÃO:
    Gere um JSON com:
    1. "content": Uma frase curta, imperativa e militar (máx 20 palavras). Se ele tem pontos fracos no mapa, ataque isso. Se ele desbloqueou uma skill, mande usar. Se o diário mostra fraqueza, dê força.
    2. "type": "alert" (se for uma correção), "strategy" (se for uma ordem prática), ou "praise" (se ele estiver indo muito bem).

    Retorne APENAS o JSON.
    Exemplo: {"content": "Sua área financeira sangra. Use a Calculadora 50/30/20 hoje ou pereça na mediocridade.", "type": "alert"}
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (response.text) {
        const cleaned = cleanJsonString(response.text);
        const data = JSON.parse(cleaned);
        return {
            date: Date.now(),
            content: data.content,
            type: data.type || 'strategy'
        };
    }
    
    throw new Error("No content generated");

  } catch (error) {
    console.error("Proactive Oracle Error:", error);
    return {
        date: Date.now(),
        content: "O silêncio é a resposta. Mantenha a disciplina e siga o plano.",
        type: 'strategy'
    };
  }
};

export const generateDailyAnalysisAI = async (userState: {rank: RankTitle, stats: UserStats, journalEntries: JournalEntry[]}): Promise<string> => {
  try {
    const client = initializeGenAI();
    const { rank, stats, journalEntries } = userState;
    const statsString = `Mente: ${stats.mind}, Corpo: ${stats.body}, Espírito: ${stats.spirit}, Riqueza: ${stats.wealth}`;
    const journalSummary = journalEntries.length > 0
        ? `Último registro no diário: "${journalEntries[0].content}"`
        : "Nenhum registro recente no diário.";

    const prompt = `Analise o estado atual deste Herói e forneça a sabedoria do Oráculo para hoje.
    - Patente: ${rank}
    - Status: ${statsString}
    - ${journalSummary}

    Sua análise deve ser concisa e poderosa. Forneça:
    1.  **Virtude em Foco:** A maior força atual do Herói.
    2.  **Sombra a Enfrentar:** A principal área para desenvolvimento hoje.
    3.  **Oráculo do Dia:** Um conselho ou questão profunda para guiar as ações do Herói.
    
    Seja inspirador e use a persona do Oráculo. Não use markdown. Separe os 3 pontos com quebras de linha.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      // FIX: Simplified `contents` for single-turn prompt.
      contents: prompt,
      config: {
        systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    if (response.text) {
      return response.text;
    }
    return "O Oráculo está em silêncio. A resposta reside em suas próprias ações hoje. Avance.";
  } catch (error) {
    console.error("Error generating daily analysis:", error);
    return "A conexão com o Oráculo falhou. Confie em sua intuição e siga sua jornada.";
  }
};


// Função para gerar missões diárias estruturadas
export const generateDailyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    const prompt = `Gere 4 missões diárias para um herói de nível ${level}, patente ${rank}, no formato JSON.
    As categorias devem ser 'Fitness', 'Learning', 'Finance', 'Mindset'.
    Crie títulos inspiradores e heroicos. O XP deve variar entre 15 e 50.
    Retorne APENAS o array JSON cru, sem formatação markdown.
    Exemplo: [{"id": "m1", "title": "Forjar o Corpo na Pira de Fogo (Treino Intenso)", "xp": 40, "completed": false, "type": "daily", "category": "Fitness"}]`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      // FIX: Simplified `contents` for single-turn prompt.
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (response.text) {
      const cleanedText = cleanJsonString(response.text);
      try {
        const missions = JSON.parse(cleanedText) as Mission[];
        return missions.map((m, i) => ({
          ...m,
          id: `ai-daily-${Date.now()}-${i}`,
          // FIX: Ensure XP from AI is treated as a number to prevent state corruption.
          xp: Number(m.xp) || 20,
          completed: false,
          type: 'daily'
        }));
      } catch (e) {
        console.error("Failed to parse cleaned JSON:", cleanedText);
        throw e;
      }
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("AI Mission Generation Error:", error);
    return []; // Return empty, App.tsx will use static fallback
  }
};

export const generateWeeklyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    const prompt = `Gere 3 missões semanais para um herói de nível ${level}, patente ${rank}, no formato JSON.
    As categorias devem ser 'Fitness', 'Learning', 'Finance', 'Mindset'.
    Crie títulos que reflitam um desafio de consistência ao longo da semana. O XP deve variar entre 100 e 200.
    Retorne APENAS o array JSON cru.
    Exemplo: [{"id": "w1", "title": "Resistência do Colosso: Treinar 4 vezes esta semana", "xp": 150, "completed": false, "type": "weekly", "category": "Fitness"}]`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      // FIX: Simplified `contents` for single-turn prompt.
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (response.text) {
      const cleanedText = cleanJsonString(response.text);
      try {
        const missions = JSON.parse(cleanedText) as Mission[];
        return missions.map((m, i) => ({
          ...m,
          id: `ai-weekly-${Date.now()}-${i}`,
          // FIX: Ensure XP from AI is treated as a number to prevent state corruption.
          xp: Number(m.xp) || 120,
          completed: false,
          type: 'weekly'
        }));
      } catch (e) {
        console.error("Failed to parse weekly missions JSON:", cleanedText);
        throw e;
      }
    }
    throw new Error("Empty response for weekly missions");
  } catch (error) {
    console.error("AI Weekly Mission Generation Error:", error);
    return [];
  }
};


// Nova função para gerar missões de marco (milestone)
export const generateMilestoneMissionsAI = async (
  level: number,
  rank: RankTitle,
  stats: UserStats,
  journalEntries: JournalEntry[]
): Promise<Mission[]> => {
  try {
    const client = initializeGenAI();
    const statsString = `Mente: ${stats.mind}, Corpo: ${stats.body}, Espírito: ${stats.spirit}, Riqueza: ${stats.wealth}`;
    const journalSummary = journalEntries.length > 0 
      ? `Últimas anotações do diário: \n${journalEntries.map(e => e.content).join('\n---\n')}`
      : "O diário está vazio.";

    const prompt = `Baseado no perfil de um herói, gere 2 missões de marco (milestone) de longo prazo.
    Perfil:
    - Nível: ${level}, Patente: ${rank}
    - Estatísticas: ${statsString}
    - ${journalSummary}

    Instruções:
    1. Crie missões que sejam desafios épicos, levando vários dias ou uma semana.
    2. As missões devem ser acionáveis e mensuráveis.
    3. Foque nas estatísticas mais baixas ou em temas do diário.
    4. O XP deve ser alto, entre 150 e 300.
    5. Categorias: 'Fitness', 'Learning', 'Finance', 'Mindset'.
    6. Retorne APENAS um array JSON cru.
    
    Exemplo: 
    [{"id": "ms1", "title": "A Provação do Titã: 7 dias de treino sem falha", "xp": 250, "completed": false, "type": "milestone", "category": "Fitness"}]`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      // FIX: Simplified `contents` for single-turn prompt.
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    if (response.text) {
      const cleanedText = cleanJsonString(response.text);
      try {
        const missions = JSON.parse(cleanedText) as Mission[];
        return missions.map((m, i) => ({
          ...m,
          id: `ai-milestone-${Date.now()}-${i}`,
          // FIX: Ensure XP from AI is treated as a number to prevent state corruption.
          xp: Number(m.xp) || 200,
          completed: false,
          type: 'milestone'
        }));
      } catch (e) {
        console.error("Failed to parse milestone missions JSON:", cleanedText, e);
        throw e;
      }
    }
    throw new Error("Empty response from AI for milestone missions");
  } catch (error) {
    console.error("AI Milestone Mission Generation Error:", error);
    return []; // Return empty, App.tsx will use static fallback
  }
};

// Função para gerar feed da guilda
export const generateGuildFeedAI = async (): Promise<any[]> => {
  try {
    const client = initializeGenAI();
    const prompt = `Gere 3 posts curtos para o feed de uma guilda de heróis. Inclua autor, patente fictícia (ex: Campeão, Lendário), conteúdo inspirador sobre uma jornada, likes (numérico) e comentários (numérico). Formato JSON array puro.`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      // FIX: Simplified `contents` for single-turn prompt.
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
      const cleanedText = cleanJsonString(response.text);
      const posts = JSON.parse(cleanedText);
      if (Array.isArray(posts)) {
        return posts.map((p: any, i: number) => ({ 
          ...p, 
          id: `feed-${i}`,
          author: p.author || 'Herói Anônimo',
          rank: p.rank || 'Iniciante',
          content: p.content || '...',
          // FIX: Ensure likes and comments from AI are treated as numbers.
          likes: Number(p.likes) || 0,
          comments: Number(p.comments) || 0
        }));
      }
    }
    throw new Error("Invalid response structure");
  } catch (error) {
    return [
      { id: 1, author: 'O Oráculo', rank: 'LENDÁRIO', content: 'Lembrem-se, heróis: cada passo na jornada, por menor que seja, é uma vitória.', likes: 99, comments: 0 }
    ];
  }
};

// Função para gerar discurso épico de vitória sobre o chefe
export const generateBossVictorySpeech = async (lastMessages: any[], bossName: string): Promise<string> => {
  try {
    const client = initializeGenAI();
    const chatHistory = lastMessages.map(m => `${m.author}: ${m.content}`).join('\n');
    const prompt = `O desafio "${bossName}" foi superado pela guilda.
    Crônicas recentes:
    ${chatHistory}

    Analise a conversa e o esforço conjunto. Crie um discurso curto e épico declarando a vitória, como um bardo narrando um grande feito.
    Termine EXATAMENTE com: "A CRÔNICA FOI ESCRITA. UM NOVO CAPÍTULO AGUARDA."`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      // FIX: Simplified `contents` for single-turn prompt.
      contents: prompt,
      config: {
        systemInstruction: 'Você é o Guardião das Crônicas. Fale de forma épica, em caixa alta.',
        thinkingConfig: { thinkingBudget: 3072 }
      }
    });

    if (response.text) {
      return response.text;
    }
    return `ATENÇÃO: ${bossName} FOI SUPERADO. OS VENTOS DA MUDANÇA SOPRAM. A CRÔNICA FOI ESCRITA. UM NOVO CAPÍTULO AGUARDA.`;
  } catch (error) {
    console.error("Boss Victory Speech Error:", error);
    return `ATENÇÃO, HERÓIS: ${bossName} CAIU PERANTE SUA CORAGEM! A CRÔNICA FOI ESCRITA. UM NOVO CAPÍTULO AGUARDA.`;
  }
};

// Função para analisar o diário de bordo
export const analyzeJournalAI = async (entries: JournalEntry[], userName: string): Promise<string> => {
  try {
    const client = initializeGenAI();
    const recentEntriesText = entries.slice(-5).map(e => `[${new Date(e.date).toLocaleDateString()}] ${e.content}`).join('\n');
    
    const prompt = `Analise as seguintes entradas do Diário do Herói ${userName}:\n\n${recentEntriesText}\n\n
    Como o Oráculo, um mentor sábio, forneça uma análise inspiradora.
    1. Identifique um padrão de virtude ou uma sombra recorrente.
    2. Dê um conselho profundo para o próximo passo na jornada.
    3. Termine com UMA pergunta que o force a refletir em seu próximo registro.
    Seja direto e use a persona do Oráculo.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      // FIX: Simplified `contents` for single-turn prompt.
      contents: prompt,
      config: {
        systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });

    if (response.text) {
      return response.text;
    }
    return "As páginas revelam esforço, mas a clareza ainda não surgiu. Continue escrevendo sua história.";
  } catch (error) {
    console.error("Journal Analysis Error:", error);
    return "A conexão com o Oráculo está turva. Continue sua jornada; a sabedoria virá.";
  }
};

// Nova função para chat com o Mentor IA
export const getMentorChatReply = async (
  chatHistory: ChatMessage[],
  newMessage: string,
  userName: string
): Promise<string> => {
  try {
    const client = initializeGenAI();
    
    const history = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));
    
    // The new message is already part of the history sent from the component
    const contents = history;

    const systemInstruction = `${MENTOR_SYSTEM_INSTRUCTION}\nO nome do herói é ${userName}. Mantenha suas respostas concisas e focadas em ação, como um verdadeiro mentor faria.`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: contents, // The array of history objects
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topK: 40,
        thinkingConfig: { thinkingBudget: 4096 }
      },
    });

    if (response.text) {
      return response.text;
    }
    return "O Oráculo pondera em silêncio. Reflita sobre sua pergunta e tente novamente.";
  } catch (error) {
    console.error("Error getting mentor chat reply:", error);
    return "A conexão com o Oráculo falhou. A sabedoria deve ser buscada no silêncio da sua própria mente por agora.";
  }
};
