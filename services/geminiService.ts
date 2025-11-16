import { httpsCallable } from 'firebase/functions';
import { functions as firebaseFunctions } from '../src/firebase';
import { Mission, RankTitle, JournalEntry, UserStats, UserState, DailyGuidance, LifeMapCategory, GuildPost, ChatMessage } from "../src/types";

const callGeminiAI = async (endpoint: string, payload: any): Promise<any> => {
    if (!firebaseFunctions) {
        console.error("Firebase Functions not initialized. AI features will be disabled.");
        const errorMessage = "O Oráculo está offline devido a uma falha de conexão com o servidor.";
        
        if (['generateDailyMissionsAI', 'generateWeeklyMissionsAI', 'generateMilestoneMissionsAI'].includes(endpoint)) {
             return { missions: [] };
        }
        if (['generateProactiveOracleGuidance'].includes(endpoint)) {
            return { guidance: { date: Date.now(), content: "A disciplina é sua bússola hoje. Use-a.", type: 'strategy' } };
        }
        return { text: errorMessage };
    }

    try {
        const callGeminiAIFunction = httpsCallable(firebaseFunctions, 'callGeminiAI');
        const result = await callGeminiAIFunction({ endpoint, payload });
        return result.data;
    } catch (error) {
        console.error(`Error calling Firebase Function endpoint '${endpoint}':`, error);
        throw error;
    }
};

export const generateDetailedLifeMapAnalysis = async (
    scores: Record<LifeMapCategory, number>,
    focusAreas: LifeMapCategory[]
): Promise<string> => {
    try {
        const response = await callGeminiAI('generateDetailedLifeMapAnalysis', { scores, focusAreas });
        return response.text;
    } catch (error) {
        console.error("Analysis Error", error);
        return "O Oráculo está em silêncio. Avance.";
    }
};

export const generateProactiveOracleGuidance = async (user: UserState): Promise<DailyGuidance> => {
  try {
    const response = await callGeminiAI('generateProactiveOracleGuidance', { user });
    return response.guidance;
  } catch (error) {
    console.error("Proactive Oracle Error:", error);
    return { date: Date.now(), content: "A disciplina é sua bússola hoje. Use-a.", type: 'strategy' };
  }
};

export const generateDailyAnalysisAI = async (userState: {rank: RankTitle, stats: UserStats, journalEntries: JournalEntry[]}): Promise<string> => {
  try {
    const response = await callGeminiAI('generateDailyAnalysisAI', { userState });
    return response.text;
  } catch (error: any) {
    console.error("Error generating daily analysis:", error);
    throw new Error("A conexão com o Oráculo falhou. Siga sua intuição.");
  }
};

export const generateDailyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const response = await callGeminiAI('generateDailyMissionsAI', { level, rank });
    return response.missions.map((m: any, i: number) => ({ ...m, id: `ai-daily-${Date.now()}-${i}`, xp: Number(m.xp) || 20, completed: false, type: 'daily' }));
  } catch (error: any) {
    console.error("AI Mission Generation Error:", error);
    throw new Error(error.message || "O Oráculo falhou ao gerar missões diárias.");
  }
};

export const generateWeeklyMissionsAI = async (level: number, rank: RankTitle): Promise<Mission[]> => {
  try {
    const response = await callGeminiAI('generateWeeklyMissionsAI', { level, rank });
    return response.missions.map((m: any, i: number) => ({ ...m, id: `ai-weekly-${Date.now()}-${i}`, xp: Number(m.xp) || 120, completed: false, type: 'weekly' }));
  } catch (error: any) {
    console.error("AI Weekly Mission Generation Error:", error);
    throw new Error(error.message || "O Oráculo falhou ao gerar missões semanais.");
  }
};

export const generateMilestoneMissionsAI = async (level: number, rank: RankTitle, stats: UserStats, journalEntries: JournalEntry[]): Promise<Mission[]> => {
  try {
    const response = await callGeminiAI('generateMilestoneMissionsAI', { level, rank, stats, journalEntries });
    return response.missions.map((m: any, i: number) => ({ ...m, id: `ai-milestone-${Date.now()}-${i}`, xp: Number(m.xp) || 200, completed: false, type: 'milestone' }));
  } catch (error: any) {
    console.error("AI Milestone Mission Generation Error:", error);
    throw new Error(error.message || "O Oráculo falhou ao gerar os marcos épicos.");
  }
};

export const generateBossVictorySpeech = async (lastMessages: any[], bossName: string): Promise<string> => {
    try {
        const response = await callGeminiAI('generateBossVictorySpeech', { lastMessages, bossName });
        return response.text;
    } catch (error) {
        console.error("Boss Victory Speech Error:", error);
        throw new Error("O Oráculo falhou ao registrar o feito. A vitória ainda é sua!");
    }
};

export const analyzeJournalAI = async (entries: JournalEntry[], userName: string): Promise<string> => {
    try {
        const response = await callGeminiAI('analyzeJournalAI', { entries, userName });
        return response.text;
    } catch (error) {
        console.error("Journal Analysis Error:", error);
        throw new Error("A conexão com o Oráculo está turva. Continue sua jornada.");
    }
};

export const getMentorChatReply = async (chatHistory: ChatMessage[], user: UserState): Promise<string> => {
    try {
        const response = await callGeminiAI('getMentorChatReply', { chatHistory, user });
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
        const response = await callGeminiAI('generateChannelInsightAI', { channelName, lastPosts });
        return response.text;
    } catch (error) {
        console.error("Channel Insight Error:", error);
        return "Interferência no sinal. Comunicação com o Oráculo perdida.";
    }
};

export const generateGuildMemberReply = async (
    channelName: string,
    lastPosts: GuildPost[]
): Promise<{author: string, rank: RankTitle, content: string} | null> => {
    try {
        const response = await callGeminiAI('generateGuildMemberReply', { channelName, lastPosts });
        if (response.reply) {
            return response.reply;
        }
        return null;
    } catch (e) {
        console.error("Guild Member Reply Error:", e);
        return null;
    }
};

export const getChatbotLandingReply = async (question: string): Promise<string> => {
    try {
        const response = await callGeminiAI('getChatbotLandingReply', { question });
        return response.text;
    } catch (error) {
        console.error("Chatbot Landing Reply Error:", error);
        throw new Error("A conexão com o Oráculo falhou.");
    }
};