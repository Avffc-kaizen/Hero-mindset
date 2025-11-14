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

export interface LifeMapQuestion {
  id: string;
  text: string;
  category: LifeMapCategory;
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

export type ToolType = 'pomodoro' | 'breathing' | 'eisenhower' | 'budget' | 'passive_buff' | 'habit_tracker';

export interface Skill {
  id: string;
  name: string;
  description: string;
  realBenefit?: string;
  icon: LucideIcon;
  cost: number;
  missionCategoryReq: MissionCategory;
  missionCountReq: number;
  toolId?: ToolType; 
}

export type SkillTree = Record<LifeMapCategory, Skill[]>;

export type GuildChannelId = 'general' | 'wins' | 'support' | 'boss_strategy' | 'protection_360';

export interface GuildComment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface GuildPost {
  id: string;
  author: string;
  authorId: string;
  rank: RankTitle | string;
  content: string;
  channel: GuildChannelId;
  likes: number;
  reactions: Record<string, number>;
  comments: GuildComment[];
  timestamp: number;
  isSystem?: boolean;
  action?: 'attack_boss';
}

export interface SquadMember {
  id: string;
  name: string;
  rank: RankTitle;
  level: number;
  archetype: Archetype | null;
}

export interface Squad {
  id: string;
  name: string;
  motto: string;
  leaderId: string;
  leaderName: string;
  members: SquadMember[];
  createdAt: number;
}

export interface DailyGuidance {
  date: number;
  content: string;
  type: 'alert' | 'praise' | 'strategy';
}

export type ProtectionModuleId = 'soberano' | 'tita' | 'sabio' | 'monge' | 'lider';

export interface ProtectionModuleInfo {
    id: ProtectionModuleId;
    name: string;
    description: string;
    monthlyPrice: number;
    coveredAreas: LifeMapCategory[];
    icon: LucideIcon;
    color: string;
}

export interface RoadmapItem {
    id: string;
    title: string;
    completed: boolean;
}

export interface CompanyInfo {
    name: string;
    description: string;
}

export interface BioData {
    sleepHours: number;
    workoutsThisWeek: number;
    waterIntake: number;
}

export interface DailyIntention {
    id: string;
    text: string;
    completed: boolean;
}

export interface UserState {
  uid: string;
  isLoggedIn: boolean;
  name: string;
  onboardingCompleted: boolean;
  archetype: Archetype | null;
  lifeMapScores: Record<LifeMapCategory, number> | null;
  mapAnalysis?: string;
  focusAreas: LifeMapCategory[];
  createdAt: any; // Can be a server timestamp
  email?: string;
  
  activeModules: ProtectionModuleId[];
  hasSubscription: boolean;
  hasPaidBase?: boolean;
  
  company?: CompanyInfo | null;
  businessRoadmap?: RoadmapItem[];
  bioData?: BioData;
  dailyIntention?: DailyIntention | null;
  
  level: number;
  currentXP: number;
  rank: RankTitle;
  lastBossAttacks?: { [key: string]: number };
  joinedSquadIds: string[];
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
  focusHistory?: any[]; // Placeholder
  keyConnections?: any[]; // Placeholder
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  EDUZZ = 'eduzz'
}

export interface ProductDef {
  id: string;
  name: string;
  description: string;
  provider: PaymentProvider;
  priceId?: string;
  eduzzId?: string;
  price: number;
  originalPrice?: number;
  isSubscription: boolean;
}