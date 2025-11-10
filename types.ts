
import { LucideIcon } from "lucide-react";

export const LifeMapCategoriesList = [
  'Saúde & Fitness', 'Intelectual', 'Emocional', 'Caráter', 'Espiritual',
  'Amoroso', 'Social', 'Financeiro', 'Carreira',
  'Qualidade de Vida', 'Visão de Vida', 'Família'
] as const;

export type LifeMapCategory = typeof LifeMapCategoriesList[number];

export const ArchetypesList = [
  'O Inocente', 'O Explorador', 'O Sábio', 'O Herói', 'O Fora-da-lei',
  'O Mago', 'O Cara Comum', 'O Amante', 'O Bobo da Corte', 'O Prestativo',
  'O Criador', 'O Governante'
] as const;

export type Archetype = typeof ArchetypesList[number];

export interface ArchetypeInfo {
  name: Archetype;
  description: string;
  icon: LucideIcon;
  motto: string;
}

export interface ArchetypeQuestion {
  id: number;
  text: string;
  archetype: Archetype;
}

export enum IAMode {
  Fast = 'fast',
  Deep = 'deep',
}

export type MissionCategory = 'Fitness' | 'Learning' | 'Finance' | 'Mindset';
export type MissionType = 'daily' | 'weekly' | 'milestone';

export interface Mission {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
  type: MissionType;
  category: MissionCategory;
}

export interface LessonDetails {
  id: string;
  title: string;
  subtitle?: string;
  videoId?: string;
  locked: boolean;
  completed: boolean;
  description?: string;
  quote?: string;
  mission?: string;
  tool?: string;
  aiLoaded?: boolean;
  tags?: string[];
}

export interface Module {
  id: string;
  title: string;
  lessons: LessonDetails[];
}

export enum RankTitle {
  Iniciante = 'Iniciante',
  Aventureiro = 'Aventureiro',
  Campeao = 'Campeão',
  Paladino = 'Paladino',
  Lendario = 'Lendário',
  Divino = 'Divino'
}

export interface JournalEntry {
  id: string;
  date: number; // timestamp
  content: string;
  aiFeedback?: string;
  isAnalyzed?: boolean;
}

export interface UserStats {
  mind: number;
  body: number;
  spirit: number;
  wealth: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ParagonPerk {
  id: string;
  name: string;
  description: (level: number) => string;
  icon: LucideIcon;
  cost: (level: number) => number;
  maxLevel: number;
}

export type ToolType = 'pomodoro' | 'breathing' | 'eisenhower' | 'budget' | 'passive_buff';

export interface Skill {
  id: string;
  name: string;
  description: string; // A descrição vaga/misteriosa
  realBenefit?: string; // O benefício real revelado após desbloqueio
  icon: LucideIcon;
  cost: number;
  missionCategoryReq: MissionCategory;
  missionCountReq: number;
  toolId?: ToolType; 
  passiveEffect?: string; // Para skills que não abrem UI, mas dão bonus
}

// A SkillTree agora usa as categorias do LifeMap como chaves
export type SkillTree = Record<LifeMapCategory, Skill[]>;

export interface GuildComment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface GuildPost {
  id: string;
  author: string;
  rank: string;
  content: string;
  likes: number;
  comments: GuildComment[];
  timestamp: number;
  isSystem?: boolean;
}

export interface DailyGuidance {
  date: number;
  content: string;
  type: 'alert' | 'praise' | 'strategy';
}

export interface UserState {
  isLoggedIn: boolean;
  name: string;
  onboardingCompleted: boolean;
  archetype: Archetype | null;
  lifeMapScores: Record<LifeMapCategory, number> | null;
  focusAreas: LifeMapCategory[];
  createdAt: number;
  email?: string;
  password?: string; 
  level: number;
  currentXP: number;
  rank: RankTitle;
  hasSubscription: boolean;
  lastBossAttacks?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  isAscended?: boolean;
  paragonPoints: number;
  paragonPerks: Record<string, number>;
  skillPoints: number;
  unlockedSkills: string[];
  journalEntries: JournalEntry[];
  modules: Module[];
  stats: UserStats;
  missions: Mission[];
  lastDailyMissionRefresh: number;
  lastWeeklyMissionRefresh: number;
  lastMilestoneMissionRefresh: number;
  lessonsCompletedToday: number;
  lastLessonCompletionDate: number;
  dailyGuidance: DailyGuidance | null;
}

// --- PAYMENT TYPES ---
export enum PaymentProvider {
  STRIPE = 'stripe',
  EDUZZ = 'eduzz'
}

export interface ProductDef {
  id: string;
  name: string;
  provider: PaymentProvider;
  priceId?: string; // Stripe Price ID
  eduzzId?: string; // Eduzz Content ID
  price: number; // In cents
}
