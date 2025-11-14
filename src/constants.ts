
import { UserState, ArchetypeInfo, Archetype, ArchetypeQuestion, LifeMapCategory, LifeMapCategoriesList, RankTitle, SkillTree, ParagonPerk, Module, Mission, Skill, ProtectionModuleInfo, GuildChannelId, ProtectionModuleId, PaymentProvider, ProductDef, LifeMapQuestion, Squad } from './types';
import {
  Heart, Mountain, BookOpen, Shield, Clapperboard, Wand2, Users, Sun, Laugh, HandHelping, Gem, Crown,
  Zap, Brain, Dumbbell, PiggyBank, BarChart, Repeat, Award, Activity, Sunrise, Moon, DollarSign, Timer, Wind, ListTodo, Calculator,
  Briefcase, Smile, Home, Eye, Star, Anchor, Lock, Sparkles, Flag, Flame, TrendingUp, HeartHandshake, Globe, Hash, Trophy
} from 'lucide-react';

// --- CONFIGURATION ---
export const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};
export const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY;
export const FRONTEND_URL = "https://hero-mindset.web.app";

// --- GAMEPLAY CONFIGURATION ---
export const MAX_SQUAD_SIZE = 5;
export const MIN_LEVEL_TO_CREATE_SQUAD = 3;

// --- STRIPE PRICE MAPPING ---
export const STRIPE_PRICES = {
  HERO_BASE: "price_1PshrWELwcc78QutdK8hB29k",
  IA_UPGRADE: "price_1PshtPELwcc78QutMvFlf3wR",
  PROTECAO_360: "price_1Pshv8ELwcc78Qut2qfW5oUh",
};

export const PRODUCTS: ProductDef[] = [
  {
    id: 'hero_vitalicio',
    name: 'Hero Mindset Vitalício',
    description: 'Acesso único à plataforma base e todas as ferramentas estáticas.',
    provider: PaymentProvider.STRIPE,
    priceId: STRIPE_PRICES.HERO_BASE,
    price: 49700,
    originalPrice: 99700,
    isSubscription: false,
  },
  {
    id: 'mentor_ia',
    name: 'Assinatura: Mentor IA',
    description: 'Desbloqueie o Oráculo. Missões, análises e guias gerados por IA.',
    provider: PaymentProvider.STRIPE,
    priceId: STRIPE_PRICES.IA_UPGRADE,
    price: 4700, // Monthly
    isSubscription: true,
  },
  {
    id: 'protecao_360',
    name: 'Assinatura: Proteção 360',
    description: 'Acesso total. Inclui Mentor IA + todos os Módulos de Proteção (Business, Saúde, etc).',
    provider: PaymentProvider.STRIPE,
    priceId: STRIPE_PRICES.PROTECAO_360,
    price: 9700, // Monthly
    isSubscription: true,
  }
];

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
  'O Inocente': { name: 'O Inocente', description: 'Busca a felicidade e a segurança, temendo o abandono. Vê o bem em tudo.', icon: Sun, motto: 'Livre para ser eu e você.' },
  'O Explorador': { name: 'O Explorador', description: 'Anseia por liberdade e aventura para descobrir a si mesmo, temendo o vazio.', icon: Mountain, motto: 'Não me cerque.' },
  'O Sábio': { name: 'O Sábio', description: 'Usa a inteligência e a análise para entender o mundo, buscando a verdade.', icon: BookOpen, motto: 'A verdade vos libertará.' },
  'O Herói': { name: 'O Herói', description: 'Age corajosamente para provar seu valor e proteger os outros, temendo a fraqueza.', icon: Shield, motto: 'Onde há vontade, há um caminho.' },
  'O Fora-da-lei': { name: 'O Fora-da-lei', description: 'Deseja a revolução e quebra as regras, temendo ser impotente.', icon: Clapperboard, motto: 'As regras são feitas para serem quebradas.' },
  'O Mago': { name: 'O Mago', description: 'Deseja poder e conhecimento para transformar o mundo e realizar sonhos.', icon: Wand2, motto: 'Eu faço as coisas acontecerem.' },
  'O Cara Comum': { name: 'O Cara Comum', description: 'Busca pertencimento e conexão, querendo apenas se encaixar com os outros.', icon: Users, motto: 'Todos os homens e mulheres são criados iguais.' },
  'O Amante': { name: 'O Amante', description: 'Busca intimidade e experiência, cercando-se do que ama.', icon: Heart, motto: 'Você é o único.' },
  'O Bobo da Corte': { name: 'O Bobo da Corte', description: 'Vive o momento com alegria e diversão, buscando aproveitar a vida ao máximo.', icon: Laugh, motto: 'Se eu não puder dançar, não quero fazer parte da sua revolução.' },
  'O Prestativo': { name: 'O Prestativo', description: 'Deseja proteger e cuidar dos outros, movido pela compassão.', icon: HandHelping, motto: 'Ame o seu próximo como a si mesmo.' },
  'O Criador': { name: 'O Criador', description: 'Impulsionado a criar coisas de valor duradouro, usando a imaginação e a habilidade.', icon: Gem, motto: 'Se você pode imaginar, pode ser criado.' },
  'O Governante': { name: 'O Governante', description: 'Exerce o controle para criar uma comunidade próspera e bem-sucedida.', icon: Crown, motto: 'O poder não é tudo, é a única coisa.' },
};

export const ARCHETYPE_QUESTIONS: ArchetypeQuestion[] = [
  { id: 1, text: "Minha maior motivação é provar meu valor através de atos de coragem e disciplina.", archetype: 'O Herói' },
  { id: 2, text: "Busco constantemente entender o mundo ao meu redor através da lógica e da informação.", archetype: 'O Sábio' },
  { id: 3, text: "Sinto uma necessidade profunda de quebrar convenções e forjar meu próprio caminho, mesmo que isso signifique ir contra o sistema.", archetype: 'O Fora-da-lei' },
  { id: 4, text: "Anseio por explorar o desconhecido, tanto no mundo exterior quanto dentro de mim mesmo, em busca de liberdade.", archetype: 'O Explorador' },
  { id: 5, text: "Meu desejo é manifestar uma visão e transformar a realidade, fazendo o aparentemente impossível acontecer.", archetype: 'O Mago' },
  { id: 6, text: "Encontro grande satisfação em criar algo novo e belo, que tenha um valor duradouro.", archetype: 'O Criador' },
  { id: 7, text: "Acima de tudo, valorizo a conexão, a intimidade e a paixão em meus relacionamentos.", archetype: 'O Amante' },
  { id: 8, text: "Sinto-me mais vivo quando posso trazer alegria e leveza para as situações, usando o humor para conectar as pessoas.", archetype: 'O Bobo da Corte' },
  { id: 9, text: "Meu instinto principal é cuidar e proteger os outros, garantindo seu bem-estar e segurança.", archetype: 'O Prestativo' },
  { id: 10, text: "Acredito na ordem, na responsabilidade e em liderar pelo exemplo para construir algo estável e próspero.", archetype: 'O Governante' },
  { id: 11, text: "Desejo uma vida simples, autêntica e conectada, baseada na honestidade e na esperança.", archetype: 'O Inocente' },
  { id: 12, text: "O mais importante para mim é me conectar com os outros de forma genuína e fazer parte de uma comunidade.", archetype: 'O Cara Comum' },
];

export const INITIAL_LIFE_MAP_SCORES: Record<LifeMapCategory, number> = LifeMapCategoriesList.reduce((acc, cat) => {
  acc[cat] = 5;
  return acc;
}, {} as Record<LifeMapCategory, number>);

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

export const PROTECTION_MODULES: Record<string, ProtectionModuleInfo> = {
  'soberano': {
    id: 'soberano', name: 'Soberano (Business)', description: 'Gestão de recursos e expansão patrimonial.', monthlyPrice: 97, coveredAreas: ['Financeiro', 'Carreira'], icon: TrendingUp, color: 'yellow'
  },
  'tita': {
    id: 'tita', name: 'Titã (Saúde)', description: 'Biohacking e performance física máxima.', monthlyPrice: 67, coveredAreas: ['Saúde & Fitness', 'Qualidade de Vida'], icon: Activity, color: 'red'
  },
  'sabio': {
    id: 'sabio', name: 'Sábio (Intelectual)', description: 'Aprendizado acelerado e gestão do conhecimento.', monthlyPrice: 47, coveredAreas: ['Intelectual', 'Visão de Vida'], icon: Brain, color: 'blue'
  },
  'monge': {
    id: 'monge', name: 'Monge (Espiritual)', description: 'Controle emocional e propósito inabalável.', monthlyPrice: 47, coveredAreas: ['Espiritual', 'Emocional', 'Caráter'], icon: Zap, color: 'purple'
  },
  'lider': {
    id: 'lider', name: 'Líder (Social)', description: 'Networking, influência e liderança de tribo.', monthlyPrice: 57, coveredAreas: ['Social', 'Amoroso', 'Família'], icon: HeartHandshake, color: 'pink'
  }
};

export const GUILD_CHANNELS: { id: GuildChannelId, name: string, description: string, icon: any, exclusiveModule?: ProtectionModuleId }[] = [
    { id: 'general', name: 'Praça Central', description: 'Discussões gerais e avisos.', icon: Hash },
    { id: 'wins', name: 'Salão de Vitórias', description: 'Compartilhe suas conquistas.', icon: Trophy },
    { id: 'support', name: 'Enfermaria', description: 'Ajuda mútua e suporte.', icon: HeartHandshake },
    { id: 'boss_strategy', name: 'Sala de Guerra', description: 'Estratégia contra Chefes.', icon: Shield },
    { id: 'protection_360', name: 'Conselho Elite', description: 'Networking de alto nível.', icon: Briefcase, exclusiveModule: 'soberano' },
];

export const MENTOR_SYSTEM_INSTRUCTION = `
Você é o Oráculo Mentor IA do Hero Mindset.
Sua função é guiar o usuário com conselhos práticos, reflexões profundas e instruções claras.
Responda sempre de forma inspiradora, mas objetiva, ajudando o herói a evoluir em mente, corpo, espírito e riqueza.
Evite respostas vagas: ofereça passos concretos e motivacionais.
`;

const createPassiveSkill = (id: string, name: string, desc: string, cost: number, category: any): Skill => ({
  id, name, description: desc, icon: Star, cost, missionCategoryReq: category, missionCountReq: cost * 3, toolId: 'passive_buff', realBenefit: 'Bonus Passivo de XP/Status'
});

export const SKILL_TREES: SkillTree = {
  'Intelectual': [
    { id: 'int_1', name: 'Protocolo Foco de Elite', description: 'Ativa um estado neural de hiperfoco.', realBenefit: 'Timer Pomodoro', icon: Timer, cost: 1, missionCategoryReq: 'Learning', missionCountReq: 3, toolId: 'pomodoro' },
    { id: 'int_2', name: 'Matriz do General', description: 'Algoritmo de decisão para prioridade absoluta.', realBenefit: 'Matriz de Eisenhower', icon: ListTodo, cost: 2, missionCategoryReq: 'Learning', missionCountReq: 6, toolId: 'eisenhower' },
    { id: 'int_3', name: 'Leitura Quântica', description: 'Absorção acelerada de dados textuais.', icon: BookOpen, cost: 3, missionCategoryReq: 'Learning', missionCountReq: 10, toolId: 'passive_buff' },
    { id: 'int_4', name: 'Palácio da Memória', description: 'Retenção de informações de longo prazo.', icon: Brain, cost: 4, missionCategoryReq: 'Learning', missionCountReq: 15, toolId: 'passive_buff' },
    { id: 'int_5', name: 'Síntese Dedutiva', description: 'Capacidade de conectar pontos invisíveis.', icon: Zap, cost: 5, missionCategoryReq: 'Learning', missionCountReq: 20, toolId: 'passive_buff' },
    createPassiveSkill('int_6', 'Dialética Socrática', 'Domínio da argumentação lógica.', 6, 'Learning'),
    createPassiveSkill('int_7', 'Polímata', 'Aprendizado cruzado entre disciplinas.', 7, 'Learning'),
    createPassiveSkill('int_8', 'Visão Sistêmica', 'Compreensão de sistemas complexos.', 8, 'Learning'),
    createPassiveSkill('int_9', 'Deep Work Nível 2', 'Imunidade a distrações digitais.', 9, 'Learning'),
    createPassiveSkill('int_10', 'Mente Mestra', 'Acesso à consciência coletiva dos grandes autores.', 10, 'Learning'),
  ],
  'Saúde & Fitness': [
    { id: 'fit_1', name: 'Bio-Regulação Tática', description: 'Controle autônomo do sistema nervoso.', realBenefit: 'Box Breathing', icon: Wind, cost: 1, missionCategoryReq: 'Fitness', missionCountReq: 3, toolId: 'breathing' },
    { id: 'fit_2', name: 'Fisiologia de Combate', description: 'Recuperação acelerada pós-esforço.', icon: Activity, cost: 2, missionCategoryReq: 'Fitness', missionCountReq: 6, toolId: 'passive_buff' },
    { id: 'fit_3', name: 'Protocolo do Sono', description: 'Otimização do ciclo circadiano.', icon: Moon, cost: 3, missionCategoryReq: 'Fitness', missionCountReq: 10, toolId: 'passive_buff' },
    { id: 'fit_4', name: 'Nutrição de Precisão', description: 'Combustível exato para performance máxima.', icon: Heart, cost: 4, missionCategoryReq: 'Fitness', missionCountReq: 15, toolId: 'passive_buff' },
    { id: 'fit_5', name: 'Armadura de Aço', description: 'Resistência física aprimorada.', icon: Shield, cost: 5, missionCategoryReq: 'Fitness', missionCountReq: 20, toolId: 'passive_buff' },
    createPassiveSkill('fit_6', 'Metabolismo da Fornalha', 'Queima calórica basal aumentada.', 6, 'Fitness'),
    createPassiveSkill('fit_7', 'Força Funcional', 'Poder aplicável ao mundo real.', 7, 'Fitness'),
    createPassiveSkill('fit_8', 'Imunidade Espartana', 'Resistência a doenças menores.', 8, 'Fitness'),
    createPassiveSkill('fit_9', 'Mobilidade Fluida', 'Prevenção de lesões articulares.', 9, 'Fitness'),
    createPassiveSkill('fit_10', 'Corpo de Avatar', 'Sincronia total mente-músculo.', 10, 'Fitness'),
  ],
  'Financeiro': [
    { id: 'fin_1', name: 'Radar de Recursos', description: 'Mapeamento tático de entradas e saídas.', realBenefit: 'Calculadora 50/30/20', icon: Calculator, cost: 1, missionCategoryReq: 'Finance', missionCountReq: 3, toolId: 'budget' },
    { id: 'fin_2', name: 'Escudo Patrimonial', description: 'Defesa contra gastos impulsivos.', icon: Shield, cost: 2, missionCategoryReq: 'Finance', missionCountReq: 6, toolId: 'passive_buff' },
    { id: 'fin_3', name: 'Alquimia de Renda', description: 'Multiplicação de fontes de receita.', icon: Sparkles, cost: 3, missionCategoryReq: 'Finance', missionCountReq: 10, toolId: 'passive_buff' },
    { id: 'fin_4', name: 'Visão do Investidor', description: 'Identificação de oportunidades ocultas.', icon: Eye, cost: 4, missionCategoryReq: 'Finance', missionCountReq: 15, toolId: 'passive_buff' },
    { id: 'fin_5', 'name': 'Negociação Mestra', 'description': 'Vantagem tática em acordos.', 'icon': HandHelping, cost: 5, missionCategoryReq: 'Finance', missionCountReq: 20, toolId: 'passive_buff' },
    createPassiveSkill('fin_6', 'Juros Compostos', 'Aceleração exponencial de ganhos.', 6, 'Finance'),
    createPassiveSkill('fin_7', 'Mentalidade de Abundância', 'Remoção de crenças limitantes.', 7, 'Finance'),
    createPassiveSkill('fin_8', 'Gestão de Risco', 'Mitigação de perdas financeiras.', 8, 'Finance'),
    createPassiveSkill('fin_9', 'Império Automatizado', 'Sistemas de renda passiva.', 9, 'Finance'),
    createPassiveSkill('fin_10', 'Soberania Financeira', 'Independência total do sistema.', 10, 'Finance'),
  ],
  'Espiritual': [
    { id: 'spi_1', name: 'Chama Interior', description: 'Motivação intrínseca inabalável.', icon: Flame, cost: 1, missionCategoryReq: 'Mindset', missionCountReq: 3, toolId: 'passive_buff' },
    { id: 'spi_2', name: 'Silêncio Tático', description: 'Clareza em meio ao caos.', icon: Moon, cost: 2, missionCategoryReq: 'Mindset', missionCountReq: 6, toolId: 'passive_buff' },
    { id: 'spi_3', name: 'Propósito de Aço', description: 'Alinhamento total com a missão.', icon: Anchor, cost: 3, missionCategoryReq: 'Mindset', missionCountReq: 10, toolId: 'passive_buff' },
    { id: 'spi_4', name: 'Gratidão Operacional', description: 'Recalibragem de perspectiva positiva.', icon: Sun, cost: 4, missionCategoryReq: 'Mindset', missionCountReq: 15, toolId: 'passive_buff' },
    { id: 'spi_5', name: 'Transcendência', description: 'Visão além do ego.', icon: Crown, cost: 5, missionCategoryReq: 'Mindset', missionCountReq: 20, toolId: 'passive_buff' },
    createPassiveSkill('spi_6', 'Intuição Aguçada', 'Percepção extra-sensorial de perigo.', 6, 'Mindset'),
    createPassiveSkill('spi_7', 'Paz Armada', 'Serenidade pronta para o combate.', 7, 'Mindset'),
    createPassiveSkill('spi_8', 'Conexão Divina', 'Acesso à fonte criativa universal.', 8, 'Mindset'),
    createPassiveSkill('spi_9', 'Legado Espiritual', 'Impacto além da vida material.', 9, 'Mindset'),
    createPassiveSkill('spi_10', 'Iluminação Tática', 'Estado de fluxo permanente.', 10, 'Mindset'),
  ],
  'Carreira': [
    { id: 'car_1', name: 'Produtividade Letal', description: 'Execução de tarefas em tempo recorde.', icon: Zap, cost: 1, missionCategoryReq: 'Finance', missionCountReq: 3, toolId: 'passive_buff' },
    { id: 'car_2', name: 'Liderança de Front', description: 'Inspirar através do exemplo.', icon: Flag, cost: 2, missionCategoryReq: 'Finance', missionCountReq: 6, toolId: 'passive_buff' },
    createPassiveSkill('car_3', 'Networking Estratégico', 'Construção de alianças poderosas.', 3, 'Finance'),
    createPassiveSkill('car_4', 'Marca Pessoal', 'Autoridade percebida no mercado.', 4, 'Finance'),
    createPassiveSkill('car_5', 'Resolução de Conflitos', 'Diplomacia corporativa.', 5, 'Finance'),
    createPassiveSkill('car_6', 'Inovação Disruptiva', 'Criação de novas soluções.', 6, 'Finance'),
    createPassiveSkill('car_7', 'Gestão de Crise', 'Frieza sob pressão profissional.', 7, 'Finance'),
    createPassiveSkill('car_8', 'Oratória de Impacto', 'Comunicação que converte.', 8, 'Finance'),
    createPassiveSkill('car_9', 'Visão de CEO', 'Pensamento estratégico de longo prazo.', 9, 'Finance'),
    createPassiveSkill('car_10', 'Legado Profissional', 'Construção de uma obra prima.', 10, 'Finance'),
  ],
  'Emocional': [
    { id: 'emo_1', name: 'Escudo Estoico', description: 'Imunidade a provocações externas.', icon: Shield, cost: 1, missionCategoryReq: 'Mindset', missionCountReq: 3, toolId: 'passive_buff' },
    { id: 'emo_2', name: 'Radar Empático', description: 'Leitura precisa de estados emocionais alheios.', icon: Heart, cost: 2, missionCategoryReq: 'Mindset', missionCountReq: 6, toolId: 'passive_buff' },
    createPassiveSkill('emo_3', 'Regulação de Humor', 'Controle químico interno.', 3, 'Mindset'),
    createPassiveSkill('emo_4', 'Antifragilidade Emocional', 'Crescimento através do trauma.', 4, 'Mindset'),
    createPassiveSkill('emo_5', 'Vulnerabilidade Tática', 'Conexão através da verdade.', 5, 'Mindset'),
    createPassiveSkill('emo_6', 'Desapego Estratégico', 'Arte de deixar ir.', 6, 'Mindset'),
    createPassiveSkill('emo_7', 'Alegria de Combate', 'Prazer no desafio difícil.', 7, 'Mindset'),
    createPassiveSkill('emo_8', 'Perdão Radical', 'Liberação de peso morto.', 8, 'Mindset'),
    createPassiveSkill('emo_9', 'Amor Próprio Blindado', 'Autoestima inabalável.', 9, 'Mindset'),
    createPassiveSkill('emo_10', 'Mestria do Coração', 'Integração total razão-emoção.', 10, 'Mindset'),
  ],
  'Caráter': Array.from({length: 10}, (_, i) => createPassiveSkill(`char_${i}`, `Virtude Nível ${i+1}`, 'Aprimoramento moral.', i+1, 'Mindset')),
  'Amoroso': Array.from({length: 10}, (_, i) => createPassiveSkill(`love_${i}`, `Magnetismo ${i+1}`, 'Atração e conexão.', i+1, 'Mindset')),
  'Social': Array.from({length: 10}, (_, i) => createPassiveSkill(`soc_${i}`, `Influência ${i+1}`, 'Poder social.', i+1, 'Mindset')),
  'Qualidade de Vida': Array.from({length: 10}, (_, i) => createPassiveSkill(`qol_${i}`, `Bem-Estar ${i+1}`, 'Otimização do estilo de vida.', i+1, 'Fitness')),
  'Visão de Vida': Array.from({length: 10}, (_, i) => createPassiveSkill(`vis_${i}`, `Clareza ${i+1}`, 'Definição de futuro.', i+1, 'Learning')),
  'Família': Array.from({length: 10}, (_, i) => createPassiveSkill(`fam_${i}`, `União ${i+1}`, 'Fortalecimento do clã.', i+1, 'Mindset')),
};

export const PARAGON_PERKS: ParagonPerk[] = [
  { id: 'xp_boost', name: 'Bênção da Experiência', description: (level) => `Aumenta todo o ganho de XP em ${level * 2}%.`, icon: Zap, cost: (level) => level + 1, maxLevel: 10 },
  { id: 'stat_boost', name: 'Fortalecimento Divino', description: (level) => `Aumenta todas as 4 estatísticas base em ${level * 5} pontos.`, icon: BarChart, cost: (level) => level + 2, maxLevel: 5 },
  { id: 'mission_reroll', name: 'Visão do Oráculo', description: (level) => `Permite trocar ${level} missão(ões) diária(s) por dia.`, icon: Repeat, cost: (level) => 3, maxLevel: 3 },
  { id: 'skill_point_mastery', name: 'Dádiva do Conhecimento', description: (level) => `Ganha ${level} Ponto(s) de Habilidade extra(s) imediatamente.`, icon: Award, cost: (level) => 5, maxLevel: 5 },
];

export const CODEX_MODULES: Module[] = [
  {
    id: 'mod1',
    title: 'Módulo 1: A Convocação - Fundamentos do Herói',
    lessons: [
      { id: 'l1-1', title: 'O Fim da Motivação', subtitle: 'A Disciplina como Arma Principal', videoId: 'g-gIIae0fak', locked: false, completed: false, description: 'A motivação é um sentimento fugaz. A disciplina é o motor que você constrói. Aprenda por que depender da motivação é uma armadilha e como forjar um sistema de execução que funciona mesmo nos piores dias.', quote: 'A disciplina é a ponte entre metas e realizações.', mission: 'Execute uma tarefa importante que você procrastinou por 15 minutos hoje, sem questionar. Registre a sensação de dever cumprido.', tool: 'O Gatilho de Ação: Vincule o início da sua tarefa mais importante a um hábito já existente (ex: após o café).', tags: ['Mindset', 'Fundamentos'] },
      { id: 'l1-2', title: 'A Lei da Causa e Efeito', subtitle: 'Assumindo 100% de Responsabilidade', videoId: 'EUC0AYyA1Lw', locked: true, completed: false, description: 'Suas circunstâncias atuais são um reflexo direto de suas ações passadas. Esta lição é um chamado para abandonar as desculpas e assumir controle total sobre seu destino, entendendo que cada escolha é uma semente.', quote: 'Você é livre para fazer suas escolhas, mas é prisioneiro das consequências.', mission: 'Identifique uma área da sua vida onde você está culpando fatores externos. Liste 3 ações que você pode tomar para mudar o resultado.', tool: 'O Círculo de Controle: Foque sua energia apenas no que você pode controlar diretamente (suas ações, reações e pensamentos).', tags: ['Responsabilidade', 'Mindset'] },
      { id: 'l1-3', title: 'Clareza: O Poder da Visão', subtitle: 'Definindo o Destino da sua Jornada', videoId: '1M3CppRNeNM', locked: true, completed: false, description: 'Um herói sem um mapa está perdido. A clareza sobre quem você quer se tornar e o que deseja alcançar é a bússola para todas as suas decisões. Aprenda a definir uma visão que puxe você para a ação.', quote: 'Aquele que tem um "porquê" para viver pode suportar quase qualquer "como".', mission: 'Escreva em uma única frase: "Quem eu preciso me tornar para ter a vida que desejo?". Mantenha essa frase visível por uma semana.', tool: 'A Visão de Futuro: Dedique 10 minutos para visualizar em detalhes o seu "eu" ideal daqui a 5 anos. Sinta as emoções dessa realidade.', tags: ['Visão', 'Propósito'] },
      { id: 'l1-4', title: 'O Princípio do Progresso', subtitle: 'A Força do 1% Melhor a Cada Dia', videoId: 'PBKXKM0C7B8', locked: true, completed: false, description: 'A maestria não é construída em saltos, mas em pequenos passos consistentes. Entenda o poder dos juros compostos aplicados ao seu desenvolvimento pessoal e como a melhoria diária de 1% leva a resultados exponenciais.', quote: 'Nós somos o que fazemos repetidamente. A excelência, portanto, não é um ato, mas um hábito.', mission: 'Escolha um hábito angular (ex: treino, leitura) e execute-o, mesmo que por apenas 5 minutos. O objetivo é a consistência, não a intensidade.', tool: 'O Registro Mínimo Viável: Anote apenas "SIM" ou "NÃO" para o seu hábito diário. A simplicidade do rastreio aumenta a aderência.', tags: ['Hábitos', 'Consistência'] },
      { id: 'l1-5', title: 'Mente, Corpo e Espírito', subtitle: 'Os Três Pilares da Força do Herói', videoId: 'to-UUgfA0ng', locked: true, completed: false, description: 'Um herói não é apenas forte fisicamente; ele é mentalmente resiliente e espiritualmente ancorado. Explore a interconexão desses três pilares e por que negligenciar um deles compromete toda a sua estrutura.', quote: 'Um corpo saudável é um abrigo para a alma, um corpo doente, uma prisão.', mission: 'Hoje, realize uma atividade para cada pilar: 30 min de exercício (Corpo), 10 min de leitura focada (Mente), 5 min de silêncio/meditação (Espírito).', tool: 'A Santíssima Trindade do Herói: Avalie de 1 a 5 sua dedicação a cada pilar no final do dia. Identifique o pilar mais fraco para focar no dia seguinte.', tags: ['Equilíbrio', 'Fundamentos'] },
      { id: 'l1-6', title: 'O Poder da Palavra', subtitle: 'Comunicação como Ferramenta de Influência', videoId: 'HS0KOM1eEQ0', locked: true, completed: false, description: 'Suas palavras criam sua realidade. Uma comunicação clara e assertiva é fundamental para liderança, negociações e relacionamentos. Aprenda a usar sua voz como uma ferramenta de precisão.', quote: 'As palavras têm o poder de destruir e de curar. Quando as palavras são verdadeiras e gentis, elas podem mudar nosso mundo.', mission: 'Em sua próxima conversa importante, pratique a escuta ativa: não interrompa e resuma o que a outra pessoa disse antes de dar sua resposta.', tool: 'A Regra dos 3 Segundos: Antes de responder a uma pergunta complexa, faça uma pausa de três segundos. Isso transmite controle e permite uma resposta mais elaborada.', tags: ['Comunicação', 'Social'] },
      { id: 'l1-7', title: 'Foco: O Superpoder Moderno', subtitle: 'Vencendo a Guerra Contra a Distração', videoId: 'J_em4c9On6U', locked: true, completed: false, description: 'Em um mundo projetado para roubar sua atenção, a capacidade de se concentrar em uma única tarefa é uma habilidade de elite. Descubra técnicas para blindar seu foco e entrar em estado de fluxo.', quote: 'Concentre todas as suas energias em dominar uma coisa de cada vez.', mission: 'Use a técnica Pomodoro: trabalhe por 25 minutos com foco total (sem celular, sem abas extras) e depois faça uma pausa de 5 minutos.', tool: 'O Ambiente de Batalha: Prepare seu ambiente físico e digital para o trabalho focado, eliminando todas as possíveis fontes de distração antes de começar.', tags: ['Foco', 'Produtividade'] },
      { id: 'l1-8', title: 'O Valor do Tempo', subtitle: 'O Ativo Mais Escasso do Herói', videoId: '0AwbwJB_5LQ', locked: true, completed: false, description: 'Você não pode comprar mais tempo. Cada segundo desperdiçado é uma oportunidade perdida. Trate seu tempo como o recurso mais valioso e aprenda a alocá-lo com intenção estratégica.', quote: 'A má notícia é que o tempo voa. A boa notícia é que você é o piloto.', mission: 'Monitore seu tempo por 2 horas. Anote exatamente o que você fez. Identifique um "ladrão de tempo" e crie uma regra para limitá-lo amanhã.', tool: 'O Bloco de Tempo: Agende blocos de tempo específicos para suas tarefas mais importantes, tratando-os como compromissos inadiáveis.', tags: ['Produtividade', 'Tempo'] },
    ]
  },
  {
    id: 'mod2',
    title: 'Módulo 2: A Forja - Disciplina e Hábitos de Elite',
    lessons: [
      { id: 'l2-1', title: 'O Poder do Hábito', subtitle: 'A Arquitetura da Transformação', videoId: '_j2QgvSQ6a8', locked: true, completed: false, description: 'Você não se eleva ao nível de suas metas, você cai ao nível de seus sistemas. Os hábitos são os sistemas automáticos que definem seu sucesso. Aprenda o loop "gatilho-rotina-recompensa" para construir e quebrar qualquer hábito.', quote: 'A corrente do hábito é muito leve para ser sentida, até que seja forte demais para ser quebrada.', mission: 'Escolha um novo hábito que deseja construir. Defina um gatilho claro e uma recompensa imediata e satisfatória para quando completar a rotina.', tool: 'O Empilhamento de Hábitos: Ancore um novo hábito a um já existente. "Depois de [hábito atual], eu vou [novo hábito]".', tags: ['Hábitos', 'Disciplina'] },
      { id: 'l2-2', title: 'A Força da Repetição', subtitle: 'Construindo Caminhos Neurais', videoId: 'VTgB_CydTBM', locked: true, completed: false, description: 'Cada repetição de uma ação fortalece o caminho neural correspondente em seu cérebro. A consistência é mais importante que a intensidade no início. Entenda como a repetição transforma esforço consciente em comportamento automático.', quote: 'Eu não temo o homem que praticou 10.000 chutes uma vez, mas temo o homem que praticou um chute 10.000 vezes.', mission: 'Execute o hábito que você está construindo pelo menos uma vez hoje, não importa quão pequena seja a execução. O objetivo é não quebrar a corrente.', tool: 'A Regra dos Dois Dias: Nunca falhe o mesmo hábito duas vezes seguidas. Um erro é um acidente, dois é o início de um novo (mau) hábito.', tags: ['Consistência', 'Hábitos'] },
      { id: 'l2-3', title: 'Inteligência Emocional', subtitle: 'O Domínio do Mundo Interno', videoId: 'v6JAZxnRDnI', locked: true, completed: false, description: 'A verdadeira força não está na ausência de emoções, mas na capacidade de reconhecê-las, compreendê-las e gerenciá-las. A inteligência emocional é a base para a resiliência e a tomada de decisões eficaz.', quote: 'Qualquer um pode ficar zangado, isso é fácil. Mas ficar zangado com a pessoa certa, na medida certa, na hora certa, pelo motivo certo e da maneira certa, isso não é fácil.', mission: 'Quando sentir uma emoção forte hoje, pare e nomeie-a. "Estou sentindo frustração". Apenas o ato de nomear já reduz sua intensidade.', tool: 'O Diário Emocional: No final do dia, anote as 3 emoções mais fortes que você sentiu e o que as desencadeou. Busque padrões.', tags: ['Inteligência Emocional', 'Mindset'] },
      { id: 'l2-4', title: 'Princípios da Persuasão', subtitle: 'A Arte da Influência Ética', videoId: 'JxEYjXQy3vY', locked: true, completed: false, description: 'Persuasão não é manipulação. É a habilidade de comunicar sua visão de forma que inspire outros à ação. Conheça os gatilhos psicológicos que governam a decisão humana para se tornar um líder mais eficaz.', quote: 'A melhor maneira de persuadir as pessoas é com os seus ouvidos – ouvindo-as.', mission: 'Use o princípio da "Prova Social" hoje. Ao apresentar uma ideia, mencione outras pessoas respeitadas que concordam ou já adotaram a prática.', tool: 'A Reciprocidade: Ofereça valor genuíno a alguém sem esperar nada em troca. Isso cria um forte desejo na outra pessoa de retribuir no futuro.', tags: ['Comunicação', 'Liderança'] },
      { id: 'l2-5', title: 'A Arte da Negociação', subtitle: 'Criando Acordos Vantajosos', videoId: '6ASUiCp-YaM', locked: true, completed: false, description: 'A vida é uma série de negociações. De aumentos salariais a decisões familiares, a habilidade de negociar define a qualidade dos seus resultados. Aprenda a focar em interesses, não em posições, para encontrar soluções ganha-ganha.', quote: 'Você não consegue o que você merece, você consegue o que você negocia.', mission: 'Em uma pequena negociação hoje (até mesmo onde almoçar), tente entender o "porquê" por trás da posição da outra pessoa antes de apresentar a sua.', tool: 'BATNA (Best Alternative to a Negotiated Agreement): Sempre saiba qual é sua melhor alternativa caso o acordo falhe. Isso lhe dá poder e confiança.', tags: ['Negociação', 'Finanças'] },
      { id: 'l2-6', title: 'O Poder da Leitura', subtitle: 'Absorvendo a Sabedoria de Gigantes', videoId: 'IUfklwTcMQo', locked: true, completed: false, description: 'Ler é ter uma conversa com as mentes mais brilhantes da história. Um livro pode conter décadas de experiência condensadas em algumas horas de leitura. Transforme a leitura em um pilar do seu crescimento.', quote: 'Um leitor vive mil vidas antes de morrer. O homem que nunca lê vive apenas uma.', mission: 'Leia 10 páginas de um livro de não-ficção hoje. O objetivo é a consistência.', tool: 'O Leitor Ativo: Sublinhe, faça anotações nas margens e, ao final de cada capítulo, escreva um resumo de 3 frases sobre o que aprendeu.', tags: ['Aprendizado', 'Intelectual'] },
      { id: 'l2-7', title: 'Tomada de Decisão', subtitle: 'O Processo dos Líderes', videoId: 'hWUQScqPHvg', locked: true, completed: false, description: 'A qualidade da sua vida é determinada pela qualidade das suas decisões. Desenvolva um framework para tomar decisões mais rápidas e eficazes, reduzindo a paralisia por análise e o arrependimento.', quote: 'Não é a decisão em si, mas o compromisso com a decisão que importa.', mission: 'Para sua próxima decisão importante, escreva os prós e os contras. Em seguida, avalie o "pior cenário" e como você lidaria com ele.', tool: 'A Regra 10/10/10: Pergunte-se: "Como me sentirei sobre esta decisão em 10 minutos? Em 10 meses? Em 10 anos?". Isso adiciona perspectiva de longo prazo.', tags: ['Decisão', 'Liderança'] },
      { id: 'l2-8', title: 'O Corpo como Templo', subtitle: 'Nutrição e Treino de Elite', videoId: 'ojYWqqfEiro', locked: true, completed: false, description: 'Seu corpo é o único veículo que você tem para esta jornada. Tratá-lo com displicência é sabotar sua missão. Aprenda os princípios fundamentais de nutrição e treinamento para ter energia e performance máximas.', quote: 'Cuide do seu corpo. É o único lugar que você tem para viver.', mission: 'Elimine uma "não-comida" (ex: refrigerante, ultraprocessado) da sua dieta hoje e adicione um alimento integral no lugar.', tool: 'O Prato do Herói: Divida seu prato em 3 partes: 1/2 de vegetais, 1/4 de proteína magra e 1/4 de carboidratos complexos.', tags: ['Fitness', 'Saúde'] },
      { id: 'l2-9', title: 'Resiliência: A Arte de se Reerguer', subtitle: 'Como Lidar com a Adversidade', videoId: 'Lacx_L-FWmU', locked: true, completed: false, description: 'A jornada do herói é pavimentada com fracassos e adversidades. A resiliência não é sobre nunca cair, mas sobre se levantar uma vez a mais. Desenvolva a força mental para encarar os desafios como oportunidades.', quote: 'A maior glória em viver não está em nunca cair, mas em nos levantarmos cada vez que caímos.', mission: 'Lembre-se de um grande desafio que você superou no passado. Reconheça a força que você demonstrou e que ainda reside em você.', tool: 'A Reenquadramento Cognitivo: Quando encontrar um obstáculo, pergunte-se: "O que isso me permite fazer? Qual a oportunidade aqui?".', tags: ['Resiliência', 'Mindset'] },
    ]
  },
  {
    id: 'mod3',
    title: 'Módulo 3: O Arsenal - Produtividade e Estratégia',
    lessons: [
      { id: 'l3-1', title: 'Trabalho Profundo', subtitle: 'Produzindo em Nível de Elite', videoId: 'T4MlsW8Uk38', locked: true, completed: false, description: 'A economia moderna premia duas coisas: a capacidade de aprender coisas difíceis rapidamente e a capacidade de produzir em nível de elite. O Trabalho Profundo (Deep Work) é a chave para ambas.', quote: 'Quem trabalha muito não tem tempo para ganhar dinheiro.', mission: 'Realize um bloco de 90 minutos de Trabalho Profundo sem interrupções (celular em outro cômodo).', tool: 'O Modo Monge: Um período sagrado do dia onde você está incomunicável para o mundo.', tags: ['Produtividade', 'Foco'] },
      { id: 'l3-2', title: 'Essencialismo', subtitle: 'A Disciplina de Buscar Menos', videoId: 'ylwGLhkRAqI', locked: true, completed: false, description: 'Se você não priorizar sua vida, alguém o fará. Aprenda a dizer "não" para o trivial para poder dizer "sim" ao que é vital. Menos, porém melhor.', quote: 'Às vezes, o que você não faz é tão importante quanto o que você faz.', mission: 'Identifique 3 compromissos ou tarefas que não contribuem para sua missão principal e elimine-os hoje.', tool: 'A Navalha do Essencialista: Se não é um "sim" óbvio, então é um "não".', tags: ['Gestão de Tempo', 'Clareza'] },
      { id: 'l3-3', title: 'Mentalidade de Riqueza', subtitle: 'O Jogo do Dinheiro', videoId: 'p7HKvqRI_Bo', locked: true, completed: false, description: 'Dinheiro é um amplificador de quem você é. Entenda os princípios de ativos vs passivos e como começar a construir sua fortaleza financeira.', quote: 'Não trabalhe pelo dinheiro, faça o dinheiro trabalhar para você.', mission: 'Analise seus extratos dos últimos 30 dias e categorize cada gasto como "Essencial", "Supérfluo" ou "Investimento".', tool: 'A Regra de Ouro: Pague-se primeiro. Invista antes de gastar.', tags: ['Finanças', 'Riqueza'] },
      { id: 'l3-4', title: 'A Guerra da Arte', subtitle: 'Vencendo a Resistência Interna', videoId: '1X8p03Ob_qE', locked: true, completed: false, description: 'Existe uma força invisível que tenta impedir você de realizar qualquer trabalho criativo ou evolutivo: a Resistência. Aprenda a reconhecê-la e combatê-la diariamente.', quote: 'O amador espera por inspiração. O profissional apenas levanta e trabalha.', mission: 'Identifique a tarefa que você mais teme fazer hoje e faça-a imediatamente. A Resistência se esconde atrás do medo.', tool: 'A Bússola do Medo: Onde o medo é maior, é lá que você deve ir.', tags: ['Mindset', 'Disciplina'] },
      { id: 'l3-5', title: 'Sistemas vs Metas', subtitle: 'Como Garantir o Sucesso Inevitável', videoId: '8Jk9P6opgjo', locked: true, completed: false, description: 'Metas são sobre os resultados que você quer alcançar. Sistemas são sobre os processos que levam a esses resultados. Vencedores e perdedores têm as mesmas metas; o sistema é o diferencial.', quote: 'Você não sobe ao nível dos seus objetivos. Você desce ao nível dos seus sistemas.', mission: 'Escreva um protocolo diário (checklist) que, se seguido, tornará sua meta de longo prazo inevitável.', tool: 'O Algoritmo Diário: Uma sequência fixa de ações que automatiza seu sucesso.', tags: ['Estratégia', 'Hábitos'] },
    ]
  },
  {
    id: 'mod4',
    title: 'Módulo 4: A Ascensão - Liderança e Legado',
    lessons: [
      { id: 'l4-1', title: 'Propriedade Extrema', subtitle: 'A Liderança Começa no Espelho', videoId: 'ljqra3BcqWM', locked: true, completed: false, description: 'Não há ninguém para culpar. Como líder de sua própria vida, tudo o que acontece é sua responsabilidade. Adote a mentalidade de que não existem times ruins, apenas líderes ruins.', quote: 'Liderança não é um cargo, é uma atitude.', mission: 'Identifique um problema em sua vida que você culpa os outros. Reescreva a situação assumindo 100% da culpa e proponha a solução.', tool: 'O Espelho da Verdade: Antes de criticar o mundo, corrija a si mesmo.', tags: ['Liderança', 'Responsabilidade'] },
      { id: 'l4-2', title: 'Antifrágil', subtitle: 'Beneficiando-se do Caos', videoId: 'KyfP1l3M5E0', locked: true, completed: false, description: 'O resiliente resiste aos choques e permanece o mesmo; o antifrágil fica melhor. Aprenda a usar o estresse, os erros e a volatilidade como combustível para o crescimento.', quote: 'O vento apaga a vela, mas aviva o fogo.', mission: 'Faça algo desconfortável hoje (banho gelado, conversa difícil) intencionalmente para fortalecer seu sistema nervoso.', tool: 'A Exposição Voluntária: Busque pequenas doses de estresse controlado para se tornar imune aos grandes choques.', tags: ['Resiliência', 'Mindset'] },
      { id: 'l4-3', title: 'Dinâmica Social', subtitle: 'Influência e Carisma', videoId: 'D5h_rQ_yS9A', locked: true, completed: false, description: 'O sucesso é um esporte de equipe. Entenda os princípios da influência, como construir rapport e como navegar hierarquias sociais com integridade.', quote: 'Você é a média das 5 pessoas com quem mais convive.', mission: 'Envie uma mensagem de gratidão genuína para 3 pessoas que foram importantes na sua trajetória.', tool: 'O Banco Emocional: Faça depósitos (ajuda, elogios) antes de tentar fazer saques (pedidos).', tags: ['Social', 'Networking'] },
      { id: 'l4-4', title: 'Memento Mori', subtitle: 'A Perspectiva da Morte', videoId: 'J3tQd6y_3sM', locked: true, completed: false, description: 'A morte não é um evento futuro a ser temido, mas uma realidade presente que deve informar como vivemos. Use a finitude da vida para eliminar o medo do julgamento e a procrastinação.', quote: 'Lembre-se de que você vai morrer. É a melhor maneira de evitar a armadilha de pensar que você tem algo a perder.', mission: 'Escreva seu próprio epitáfio. O que você gostaria que estivesse escrito na sua lápide se morresse hoje? O que falta fazer?', tool: 'A Visão do Leito de Morte: Ao tomar uma decisão, pergunte-se: "Isso importará no meu último dia?"', tags: ['Filosofia', 'Propósito'] },
      { id: 'l4-5', title: 'O Caminho da Maestria', subtitle: 'A Jornada Sem Fim', videoId: '50L44hM_2e8', locked: true, completed: false, description: 'A jornada do herói é um círculo, não uma linha reta. A maestria não é um destino, é o processo contínuo de refinamento. Apaixone-se pelo platô e pela prática diária.', quote: 'A maestria não é sobre perfeição. É sobre o processo.', mission: 'Escolha uma habilidade que você quer dominar e pratique-a por 60 minutos hoje com foco total na técnica, não no resultado.', tool: 'O Ciclo Shuhari: Aprenda as regras (Shu), quebre as regras (Ha), transcenda as regras (Ri).', tags: ['Maestria', 'Aprendizado'] },
    ]
  }
];

export const STATIC_DAILY_MISSIONS: Mission[] = [
    { id: 'static-d-1', title: 'Praticar 30min de exercício físico', xp: 20, completed: false, type: 'daily', category: 'Fitness' },
    { id: 'static-d-2', title: 'Ler 10 páginas de um livro', xp: 20, completed: false, type: 'daily', category: 'Learning' },
    { id: 'static-d-3', title: 'Revisar seus gastos do dia anterior', xp: 15, completed: false, type: 'daily', category: 'Finance' },
    { id: 'static-d-4', title: 'Meditar ou refletir por 5 minutos', xp: 15, completed: false, type: 'daily', category: 'Mindset' },
];

export const STATIC_WEEKLY_MISSIONS: Mission[] = [
    { id: 'static-w-1', title: 'Completar 3 sessões de treino na semana', xp: 150, completed: false, type: 'weekly', category: 'Fitness' },
    { id: 'static-w-2', title: 'Ler 50 páginas ou 1 capítulo de livro', xp: 120, completed: false, type: 'weekly', category: 'Learning' },
    { id: 'static-w-3', title: 'Evitar gastos supérfluos por 5 dias', xp: 100, completed: false, type: 'weekly', category: 'Finance' },
];

export const STATIC_MILESTONE_MISSIONS: Mission[] = [
    { id: 'static-m-1', title: 'Completar um módulo do Codex', xp: 250, completed: false, type: 'milestone', category: 'Learning' },
    { id: 'static-m-2', title: 'Acumular 3 horas de exercício na semana', xp: 300, completed: false, type: 'milestone', category: 'Fitness' },
    { id: 'static-m-3', title: 'O Primeiro Tesouro: Crie um Orçamento de Guerra e siga-o por 7 dias', xp: 200, completed: false, type: 'milestone', category: 'Finance' },
    { id: 'static-m-4', title: 'A Forja da Mente: Medite por 10 minutos por 5 dias consecutivos', xp: 250, completed: false, type: 'milestone', category: 'Mindset' },
];

export const INITIAL_USER_STATE: UserState = {
  uid: '',
  isLoggedIn: false,
  name: "Herói",
  onboardingCompleted: false,
  archetype: null,
  lifeMapScores: null,
  focusAreas: [],
  createdAt: 0,
  email: '',
  level: 1,
  currentXP: 0,
  rank: RankTitle.Iniciante,
  hasSubscription: false,
  hasPaidBase: false,
  lastBossAttacks: {},
  isAscended: false,
  paragonPoints: 0,
  paragonPerks: {},
  skillPoints: 0,
  unlockedSkills: [],
  journalEntries: [],
  modules: CODEX_MODULES.map((mod) => ({
    ...mod,
    lessons: mod.lessons.map((lesson, lessonIdx) => ({
      ...lesson,
      completed: false,
      locked: !(mod.id === 'mod1' && lessonIdx === 0),
    }))
  })),
  stats: { mind: 0, body: 0, spirit: 0, wealth: 0 },
  missions: [],
  lastDailyMissionRefresh: 0,
  lastWeeklyMissionRefresh: 0,
  lastMilestoneMissionRefresh: 0,
  lessonsCompletedToday: 0,
  lastLessonCompletionDate: 0,
  dailyGuidance: null,
  activeModules: [],
  company: null,
  businessRoadmap: [],
  bioData: { sleepHours: 0, workoutsThisWeek: 0, waterIntake: 0 },
  focusHistory: [],
  dailyIntention: null,
  keyConnections: [],
  joinedSquadIds: [],
};
