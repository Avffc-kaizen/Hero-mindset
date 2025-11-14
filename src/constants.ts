
import { UserState, ArchetypeInfo, Archetype, ArchetypeQuestion, LifeMapCategory, LifeMapCategoriesList, RankTitle, SkillTree, ParagonPerk, Module, Mission, Skill, ProtectionModuleInfo, GuildChannelId, ProtectionModuleId, PaymentProvider, ProductDef, LifeMapQuestion, Squad } from './types';
import {
  Heart, Mountain, BookOpen, Shield, Clapperboard, Wand2, Users, Sun, Laugh, HandHelping, Gem, Crown,
  Zap, Brain, Dumbbell, PiggyBank, BarChart, Repeat, Award, Activity, Moon, Timer, Wind, ListTodo, Calculator,
  Briefcase, Smile, Home, Eye, Star, Anchor, Lock, Sparkles, Flag, Flame, TrendingUp, HeartHandshake, Hash, Trophy, Map, CheckCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// --- CONFIGURAÇÕES DE AMBIENTE ---
// FIX: Switched from import.meta.env to process.env to resolve TypeScript errors.
export const STRIPE_PUBLIC_KEY = process.env.VITE_STRIPE_PUBLIC_KEY;
export const FRONTEND_URL = "https://hero-mindset.web.app";

// --- CONFIGURAÇÕES DE JOGO ---
export const MAX_SQUAD_SIZE = 5;
export const MIN_LEVEL_TO_CREATE_SQUAD = 10;
export const XP_PER_LEVEL_FORMULA = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

// --- PRODUTOS E PAGAMENTOS (STRIPE) ---
export const PRODUCTS: ProductDef[] = [
  {
    id: 'hero_vitalicio',
    name: 'Hero Mindset Vitalício',
    description: 'Acesso único à plataforma base e todas as ferramentas estáticas.',
    provider: PaymentProvider.EDUZZ,
    eduzzId: "E05XKGE7WX",
    price: 49700,
    originalPrice: 99700,
    isSubscription: false,
  },
  {
    id: 'mentor_ia',
    name: 'Assinatura: Mentor IA',
    description: 'Desbloqueie o Oráculo. Missões, análises e guias gerados por IA.',
    provider: PaymentProvider.STRIPE,
    priceId: "price_1PshtPELwcc78QutMvFlf3wR",
    price: 4700, // Mensal
    isSubscription: true,
  },
  {
    id: 'protecao_360',
    name: 'Assinatura: Proteção 360',
    description: 'Acesso total. Inclui Mentor IA + todos os Módulos de Proteção.',
    provider: PaymentProvider.STRIPE,
    priceId: "price_1Pshv8ELwcc78Qut2qfW5oUh",
    price: 9700, // Mensal
    isSubscription: true,
  }
];

// --- DADOS DE JOGO ESTÁTICOS ---

export const MOCK_SQUADS: Squad[] = [
  { 
    id: 'sq-1', 
    name: 'Vanguarda Estoica', 
    motto: 'Suportar e Renunciar.', 
    leaderId: '2', 
    leaderName: 'Ricardo M.', 
    members: [ 
      { id: '2', name: 'Ricardo M.', rank: RankTitle.Lendario, level: 48, archetype: 'O Sábio' }, 
      { id: '99', name: 'Membro 2', rank: RankTitle.Aventureiro, level: 12, archetype: 'O Inocente' } 
    ], 
    createdAt: Date.now() - 10000000 
  }
];

export const ARCHETYPES: Record<Archetype, ArchetypeInfo> = {
  'O Inocente': { name: 'O Inocente', description: 'Busca a felicidade e a segurança.', icon: Sun, motto: 'Livre para ser eu e você.' },
  'O Explorador': { name: 'O Explorador', description: 'Anseia por liberdade e aventura.', icon: Mountain, motto: 'Não me cerque.' },
  'O Sábio': { name: 'O Sábio', description: 'Usa a inteligência para entender o mundo.', icon: BookOpen, motto: 'A verdade vos libertará.' },
  'O Herói': { name: 'O Herói', description: 'Age corajosamente para provar seu valor.', icon: Shield, motto: 'Onde há vontade, há um caminho.' },
  'O Fora-da-lei': { name: 'O Fora-da-lei', description: 'Deseja a revolução e quebra as regras.', icon: Clapperboard, motto: 'As regras são feitas para serem quebradas.' },
  'O Mago': { name: 'O Mago', description: 'Deseja poder para transformar o mundo.', icon: Wand2, motto: 'Eu faço as coisas acontecerem.' },
  'O Cara Comum': { name: 'O Cara Comum', description: 'Busca pertencimento e conexão.', icon: Users, motto: 'Todos são criados iguais.' },
  'O Amante': { name: 'O Amante', description: 'Busca intimidade e experiência.', icon: Heart, motto: 'Você é o único.' },
  'O Bobo da Corte': { name: 'O Bobo da Corte', description: 'Vive o momento com alegria e diversão.', icon: Laugh, motto: 'Se eu não puder dançar, não quero fazer parte.' },
  'O Prestativo': { name: 'O Prestativo', description: 'Deseja proteger e cuidar dos outros.', icon: HandHelping, motto: 'Ame o seu próximo como a si mesmo.' },
  'O Criador': { name: 'O Criador', description: 'Impulsionado a criar coisas de valor duradouro.', icon: Gem, motto: 'Se pode imaginar, pode ser criado.' },
  'O Governante': { name: 'O Governante', description: 'Exerce o controle para criar prosperidade.', icon: Crown, motto: 'O poder é a única coisa.' },
};

export const ARCHETYPE_QUESTIONS: ArchetypeQuestion[] = [
  { id: 1, text: "Minha maior motivação é provar meu valor através de atos de coragem e disciplina.", archetype: 'O Herói' },
  { id: 2, text: "Busco constantemente entender o mundo ao meu redor através da lógica e da informação.", archetype: 'O Sábio' },
  { id: 3, text: "Sinto uma necessidade profunda de quebrar convenções e forjar meu próprio caminho.", archetype: 'O Fora-da-lei' },
  { id: 4, text: "Anseio por explorar o desconhecido, em busca de liberdade.", archetype: 'O Explorador' },
  { id: 5, text: "Meu desejo é manifestar uma visão e transformar a realidade.", archetype: 'O Mago' },
  { id: 6, text: "Encontro grande satisfação em criar algo novo e de valor duradouro.", archetype: 'O Criador' },
  { id: 7, text: "Acima de tudo, valorizo a conexão, a intimidade e a paixão.", archetype: 'O Amante' },
  { id: 8, text: "Sinto-me mais vivo quando posso trazer alegria e leveza para as situações.", archetype: 'O Bobo da Corte' },
  { id: 9, text: "Meu instinto principal é cuidar e proteger os outros.", archetype: 'O Prestativo' },
  { id: 10, text: "Acredito na ordem, na responsabilidade e em liderar pelo exemplo.", archetype: 'O Governante' },
  { id: 11, text: "Desejo uma vida simples, autêntica e conectada.", archetype: 'O Inocente' },
  { id: 12, text: "O mais importante para mim é me conectar com os outros e fazer parte de uma comunidade.", archetype: 'O Cara Comum' },
];

export const INITIAL_LIFE_MAP_SCORES: Record<LifeMapCategory, number> = LifeMapCategoriesList.reduce((acc, cat) => ({ ...acc, [cat]: 5 }), {} as Record<LifeMapCategory, number>);

export const LIFE_MAP_QUESTIONS: Record<LifeMapCategory, LifeMapQuestion[]> = {
    'Saúde & Fitness': [ { id: 'sf1', text: 'Tenho energia constante ao longo do dia.', category: 'Saúde & Fitness' }, { id: 'sf2', text: 'Pratico atividades físicas intensas regularmente.', category: 'Saúde & Fitness' } ],
    'Intelectual': [ { id: 'int1', text: 'Dedico tempo para aprender algo novo.', category: 'Intelectual' }, { id: 'int2', text: 'Consigo manter foco profundo em tarefas.', category: 'Intelectual' } ],
    'Emocional': [ { id: 'emo1', text: 'Lido bem com o estresse e pressão.', category: 'Emocional' }, { id: 'emo2', text: 'Recupero-me rapidamente de contratempos.', category: 'Emocional' } ],
    'Caráter': [ { id: 'car1', text: 'Minhas ações estão alinhadas com meus valores.', category: 'Caráter' }, { id: 'car2', text: 'Assumo responsabilidade total pelos meus erros.', category: 'Caráter' } ],
    'Espiritual': [ { id: 'esp1', text: 'Sinto que minha vida tem um propósito.', category: 'Espiritual' }, { id: 'esp2', text: 'Dedico tempo para reflexão ou meditação.', category: 'Espiritual' } ],
    'Amoroso': [ { id: 'amo1', text: 'Estou satisfeito com minha situação amorosa.', category: 'Amoroso' }, { id: 'amo2', text: 'Comunico-me abertamente com meu parceiro(a).', category: 'Amoroso' } ],
    'Social': [ { id: 'soc1', text: 'Tenho amigos verdadeiros com quem posso contar.', category: 'Social' }, { id: 'soc2', text: 'Sinto-me parte de uma comunidade.', category: 'Social' } ],
    'Financeiro': [ { id: 'fin1', text: 'Tenho controle total sobre minhas finanças.', category: 'Financeiro' }, { id: 'fin2', text: 'Invisto regularmente para o meu futuro.', category: 'Financeiro' } ],
    'Carreira': [ { id: 'crr1', text: 'Sinto-me realizado com meu trabalho atual.', category: 'Carreira' }, { id: 'crr2', text: 'Tenho oportunidades claras de crescimento.', category: 'Carreira' } ],
    'Qualidade de Vida': [ { id: 'qdv1', text: 'Tenho tempo livre para hobbies e lazer.', category: 'Qualidade de Vida' }, { id: 'qdv2', text: 'Estou satisfeito com meu estilo de vida geral.', category: 'Qualidade de Vida' } ],
    'Visão de Vida': [ { id: 'vis1', text: 'Tenho metas claras para os próximos 5 anos.', category: 'Visão de Vida' }, { id: 'vis2', text: 'Minhas decisões diárias servem minha visão de longo prazo.', category: 'Visão de Vida' } ],
    'Família': [ { id: 'fam1', text: 'Tenho um bom relacionamento com meus familiares.', category: 'Família' }, { id: 'fam2', text: 'Sinto-me apoiado pela minha família.', category: 'Família' } ]
};

export const PROTECTION_MODULES: Record<ProtectionModuleId, ProtectionModuleInfo> = {
  'soberano': { id: 'soberano', name: 'Soberano (Business)', description: 'Gestão de recursos e expansão.', monthlyPrice: 97, coveredAreas: ['Financeiro', 'Carreira'], icon: TrendingUp, color: 'yellow' },
  'tita': { id: 'tita', name: 'Titã (Saúde)', description: 'Biohacking e performance física.', monthlyPrice: 67, coveredAreas: ['Saúde & Fitness', 'Qualidade de Vida'], icon: Activity, color: 'red' },
  'sabio': { id: 'sabio', name: 'Sábio (Intelectual)', description: 'Aprendizado acelerado e foco.', monthlyPrice: 47, coveredAreas: ['Intelectual', 'Visão de Vida'], icon: Brain, color: 'blue' },
  'monge': { id: 'monge', name: 'Monge (Espiritual)', description: 'Controle emocional e propósito.', monthlyPrice: 47, coveredAreas: ['Espiritual', 'Emocional', 'Caráter'], icon: Zap, color: 'purple' },
  'lider': { id: 'lider', name: 'Líder (Social)', description: 'Networking, influência e liderança.', monthlyPrice: 57, coveredAreas: ['Social', 'Amoroso', 'Família'], icon: HeartHandshake, color: 'pink' }
};

export const GUILD_CHANNELS: { id: GuildChannelId, name: string, description: string, icon: LucideIcon, exclusiveModule?: ProtectionModuleId }[] = [
    { id: 'general', name: 'Praça Central', description: 'Discussões gerais e avisos.', icon: Hash },
    { id: 'wins', name: 'Salão de Vitórias', description: 'Compartilhe suas conquistas.', icon: Trophy },
    { id: 'support', name: 'Enfermaria', description: 'Ajuda mútua e suporte.', icon: HeartHandshake },
    { id: 'boss_strategy', name: 'Sala de Guerra', description: 'Estratégia contra Chefes.', icon: Shield },
    { id: 'protection_360', name: 'Conselho Elite', description: 'Networking de alto nível.', icon: Briefcase, exclusiveModule: 'soberano' },
];

export const MENTOR_SYSTEM_INSTRUCTION = `Você é o Oráculo, um mentor estratégico, observador e militar. Sua função NÃO é bater papo. É analisar os dados do usuário e dar UMA diretriz diária precisa, curta e impactante. Use linguagem estoica, firme e inspiradora.`;

export const SKILL_TREES: SkillTree = {
  'Intelectual': [
    { id: 'int_1', name: 'Protocolo Foco de Elite', description: 'Ativa um estado neural de hiperfoco.', realBenefit: 'Timer Pomodoro', icon: Timer, cost: 1, missionCategoryReq: 'Learning', missionCountReq: 3, toolId: 'pomodoro' },
    { id: 'int_2', name: 'Matriz do General', description: 'Algoritmo de decisão para prioridade absoluta.', realBenefit: 'Matriz de Eisenhower', icon: ListTodo, cost: 2, missionCategoryReq: 'Learning', missionCountReq: 6, toolId: 'eisenhower' },
    { id: 'int_3', name: 'Rastreador de Hábitos', description: 'Ferramenta para forjar consistência.', realBenefit: 'Rastreador de Hábitos', icon: CheckCircle, cost: 3, missionCategoryReq: 'Learning', missionCountReq: 10, toolId: 'habit_tracker' }
  ],
  'Saúde & Fitness': [
    { id: 'fit_1', name: 'Bio-Regulação Tática', description: 'Controle autônomo do sistema nervoso.', realBenefit: 'Respiração Tática (Box)', icon: Wind, cost: 1, missionCategoryReq: 'Fitness', missionCountReq: 3, toolId: 'breathing' }
  ],
  'Financeiro': [
    { id: 'fin_1', name: 'Radar de Recursos', description: 'Mapeamento tático de entradas e saídas.', realBenefit: 'Calculadora de Orçamento 50/30/20', icon: Calculator, cost: 1, missionCategoryReq: 'Finance', missionCountReq: 3, toolId: 'budget' }
  ],
  'Espiritual': [], 'Carreira': [], 'Emocional': [], 'Caráter': [], 'Amoroso': [], 'Social': [], 'Qualidade de Vida': [], 'Visão de Vida': [], 'Família': []
};

export const PARAGON_PERKS: ParagonPerk[] = [
  { id: 'xp_boost', name: 'Bênção da Experiência', description: (level) => `Aumenta todo o ganho de XP em ${level * 2}%.`, icon: Zap, cost: (level) => level + 1, maxLevel: 10 },
  { id: 'stat_boost', name: 'Fortalecimento Divino', description: (level) => `Aumenta todas as 4 estatísticas base em ${level * 5} pontos.`, icon: BarChart, cost: (level) => level + 2, maxLevel: 5 },
  { id: 'mission_reroll', name: 'Visão do Oráculo', description: (level) => `Permite trocar ${level} missão(ões) diária(s) por dia.`, icon: Repeat, cost: (level) => 3, maxLevel: 3 },
  { id: 'skill_point_mastery', name: 'Dádiva do Conhecimento', description: (level) => `Ganha ${level} Ponto(s) de Habilidade extra(s) imediatamente.`, icon: Award, cost: (level) => 5, maxLevel: 5 },
];

export const CODEX_MODULES: Module[] = [
  {
    id: 'mod1', title: 'Módulo 1: Fundamentos do Herói',
    lessons: [
      { id: 'l1-1', title: 'O Fim da Motivação', subtitle: 'A Disciplina como Arma Principal', videoId: 'g-gIIae0fak', locked: false, completed: false, description: 'A motivação é um sentimento fugaz. A disciplina é o motor que você constrói.', quote: 'A disciplina é a ponte entre metas e realizações.', mission: 'Execute uma tarefa importante que você procrastinou por 15 minutos.', tags: ['Mindset', 'Fundamentos'] },
      { id: 'l1-2', title: 'A Lei da Causa e Efeito', subtitle: 'Assumindo 100% de Responsabilidade', videoId: 'EUC0AYyA1Lw', locked: true, completed: false, description: 'Suas circunstâncias são um reflexo de suas ações passadas. Abandone as desculpas.', quote: 'Você é livre para fazer suas escolhas, mas é prisioneiro das consequências.', mission: 'Identifique uma área onde você culpa fatores externos. Liste 3 ações para mudar o resultado.', tags: ['Responsabilidade', 'Mindset'] },
    ]
  },
  {
    id: 'mod2', title: 'Módulo 2: Disciplina e Hábitos de Elite',
    lessons: [ { id: 'l2-1', title: 'O Poder do Hábito', subtitle: 'A Arquitetura da Transformação', videoId: '_j2QgvSQ6a8', locked: true, completed: false, tags: ['Hábitos', 'Disciplina'] }, ]
  },
];

export const STATIC_DAILY_MISSIONS: Mission[] = [
    { id: 'static-d-1', title: 'Praticar 30min de exercício físico', xp: 20, completed: false, type: 'daily', category: 'Fitness' },
    { id: 'static-d-2', title: 'Ler 10 páginas de um livro', xp: 20, completed: false, type: 'daily', category: 'Learning' },
    { id: 'static-d-3', title: 'Revisar seus gastos do dia', xp: 15, completed: false, type: 'daily', category: 'Finance' },
    { id: 'static-d-4', title: 'Meditar ou refletir por 5 minutos', xp: 15, completed: false, type: 'daily', category: 'Mindset' },
];

export const STATIC_WEEKLY_MISSIONS: Mission[] = [
    { id: 'static-w-1', title: 'Completar 3 sessões de treino na semana', xp: 150, completed: false, type: 'weekly', category: 'Fitness' },
];

export const INITIAL_USER_STATE: UserState = {
  uid: '', isLoggedIn: false, name: "Herói", onboardingCompleted: false, archetype: null, lifeMapScores: null,
  mapAnalysis: undefined, focusAreas: [], createdAt: 0, email: '', level: 1, currentXP: 0, rank: RankTitle.Iniciante,
  hasSubscription: false, hasPaidBase: false, lastBossAttacks: {}, isAscended: false, paragonPoints: 0,
  paragonPerks: {}, skillPoints: 0, unlockedSkills: [], journalEntries: [],
  modules: CODEX_MODULES.map((mod) => ({ ...mod, lessons: mod.lessons.map((lesson, i) => ({ ...lesson, completed: false, locked: !(mod.id === 'mod1' && i === 0)})) })),
  stats: { mind: 0, body: 0, spirit: 0, wealth: 0 }, missions: [], lastDailyMissionRefresh: 0, lastWeeklyMissionRefresh: 0,
  lastMilestoneMissionRefresh: 0, lessonsCompletedToday: 0, lastLessonCompletionDate: 0, dailyGuidance: null, activeModules: [],
  company: null, businessRoadmap: [], bioData: { sleepHours: 0, workoutsThisWeek: 0, waterIntake: 0 }, focusHistory: [],
  dailyIntention: null, keyConnections: [], joinedSquadIds: [],
};