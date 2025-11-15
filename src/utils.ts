import { RankTitle, LifeMapCategory } from './types';

export const XP_PER_LEVEL_FORMULA = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

const RANK_THRESHOLDS: { [key in RankTitle]: number } = {
  [RankTitle.Iniciante]: 0,
  [RankTitle.Aventureiro]: 5,
  [RankTitle.Campeao]: 15,
  [RankTitle.Paladino]: 30,
  [RankTitle.Lendario]: 50,
  [RankTitle.Divino]: 50, // Divino is special, handled by isAscended
};

export const getRank = (level: number, isAscended: boolean | undefined): RankTitle => {
  if (isAscended) return RankTitle.Divino;
  if (level >= RANK_THRESHOLDS[RankTitle.Lendario]) return RankTitle.Lendario;
  if (level >= RANK_THRESHOLDS[RankTitle.Paladino]) return RankTitle.Paladino;
  if (level >= RANK_THRESHOLDS[RankTitle.Campeao]) return RankTitle.Campeao;
  if (level >= RANK_THRESHOLDS[RankTitle.Aventureiro]) return RankTitle.Aventureiro;
  return RankTitle.Iniciante;
};

export const isToday = (timestamp: number) => {
    if (!timestamp) return false;
    const today = new Date();
    const date = new Date(timestamp);
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
};

const getWeekNumber = (d: Date): [number, number] => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
};

export const isSameWeek = (ts1: number, ts2: number) => {
    if (!ts1 || !ts2) return false;
    const [year1, week1] = getWeekNumber(new Date(ts1));
    const [year2, week2] = getWeekNumber(new Date(ts2));
    return year1 === year2 && week1 === week2;
};

export const abbreviateCategory = (category: LifeMapCategory): string => {
  const abbreviations: Record<LifeMapCategory, string> = {
    'Saúde & Fitness': 'Saúde',
    'Intelectual': 'Mente',
    'Emocional': 'Emoções',
    'Caráter': 'Caráter',
    'Espiritual': 'Espírito',
    'Amoroso': 'Amor',
    'Social': 'Social',
    'Financeiro': 'Finanças',
    'Carreira': 'Carreira',
    'Qualidade de Vida': 'Qualidade',
    'Visão de Vida': 'Visão',
    'Família': 'Família',
  };
  return abbreviations[category] || category;
};
