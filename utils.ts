import { RankTitle } from './types';

const RANK_THRESHOLDS: { [key in RankTitle]: number } = {
  [RankTitle.Iniciante]: 0,
  [RankTitle.Aventureiro]: 5,
  [RankTitle.Campeao]: 15,
  [RankTitle.Paladino]: 30,
  [RankTitle.Lendario]: 50,
  [RankTitle.Divino]: 50, // Divino is special, handled by isAscended
};


export const XP_PER_LEVEL_FORMULA = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

export const getRank = (level: number, isAscended: boolean): RankTitle => {
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
    return date.getUTCFullYear() === today.getUTCFullYear() &&
           date.getUTCMonth() === today.getUTCMonth() &&
           date.getUTCDate() === today.getUTCDate();
};

export const getWeekStart = (date: Date): string => {
  const d = new Date(date.getTime());
  const day = d.getUTCDay();
  // Adjust to Monday as the start of the week
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); 
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};

export const getWeekNumber = (d: Date): [number, number] => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    // Return array of year and week number
    return [d.getUTCFullYear(), weekNo];
};

export const isSameWeek = (ts1: number, ts2: number) => {
    if (!ts1 || !ts2) return false;
    const [year1, week1] = getWeekNumber(new Date(ts1));
    const [year2, week2] = getWeekNumber(new Date(ts2));
    return year1 === year2 && week1 === week2;
};