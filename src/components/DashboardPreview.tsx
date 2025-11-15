import React from 'react';
import { Award, Zap, Star, AlertCircle, Flame, Shield, Briefcase, Activity, TrendingUp, CheckCircle, Plus, Lock, Dumbbell, Moon, Droplets, Target, Check, Bot, Terminal, Flag, CalendarDays } from 'lucide-react';
import { RankTitle, LifeMapCategory } from '../types';
import LiteYouTubeEmbed from './LiteYouTubeEmbed';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// --- MOCK DATA ---
const MOCK_USER = {
    rank: RankTitle.Paladino,
    level: 28,
    xpProgress: 65,
    xpRemaining: 4320,
    dailyGuidance: { type: 'strategy', content: 'Execute a tarefa mais difícil primeiro. A vitória ama o momentum.' },
    dailyIntention: { text: 'Finalizar o relatório estratégico do Projeto Ômega.', completed: true },
    missions: {
        daily: { completed: 2, total: 4 },
        weekly: { completed: 1, total: 2 },
        milestone: { completed: 0, total: 1 }
    },
    lifeMapScores: {
        'Saúde & Fitness': 8, 'Intelectual': 9, 'Emocional': 6, 'Caráter': 8, 'Espiritual': 7,
        'Amoroso': 6, 'Social': 7, 'Financeiro': 9, 'Carreira': 9,
        'Qualidade de Vida': 6, 'Visão de Vida': 8, 'Família': 7
    },
    activeModules: ['soberano', 'tita']
};

// --- WIDGETS DE DEMONSTRAÇÃO ---

const OracleDecreePreview = () => (
    <div className="bg-zinc-900/40 border border-blue-500/30 rounded-2xl p-6 h-full min-h-[180px] flex flex-col justify-center relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <h3 className="text-[10px] font-black font-mono uppercase mb-3 flex items-center gap-2 tracking-widest text-zinc-400"><Flame className="w-3 h-3" /> DIRETRIZ OPERACIONAL</h3>
        <p className="text-xl md:text-2xl font-bold text-white font-mono uppercase leading-tight tracking-tight">"{MOCK_USER.dailyGuidance.content}"</p>
    </div>
);

const DailyIntentionPreview = () => (
    <div className="bg-zinc-900/40 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-md h-full flex flex-col justify-center">
        <h2 className="text-sm font-bold font-mono uppercase text-purple-500 flex items-center gap-2 mb-4"><Zap className="w-4 h-4" /> Intenção Única Diária</h2>
        <div className="flex items-center gap-4 group">
            <div className="w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all bg-purple-600 border-purple-500">
                <Check className="w-5 h-5 text-white" />
            </div>
            <p className="text-lg font-bold text-white transition-all line-through text-zinc-500">{MOCK_USER.dailyIntention.text}</p>
        </div>
    </div>
);

const MissionProgressPreview = () => (
    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md">
        <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase flex items-center gap-2"><Target className="w-4 h-4" /> Progresso das Missões</h3>
        <div>
            <div className="flex justify-between items-center mb-1"><label className="text-xs font-mono text-zinc-400">Diárias</label><span className="text-xs font-mono font-bold text-white">2/4</span></div>
            <div className="w-full bg-black/50 rounded-full h-1.5"><div className="bg-red-600 h-full rounded-full" style={{ width: `50%` }}></div></div>
        </div>
        <div>
            <div className="flex justify-between items-center mb-1"><label className="text-xs font-mono text-zinc-400">Desafios</label><span className="text-xs font-mono font-bold text-white">1/2</span></div>
            <div className="w-full bg-black/50 rounded-full h-1.5"><div className="bg-blue-600 h-full rounded-full" style={{ width: `50%` }}></div></div>
        </div>
    </div>
);

const DashboardPreview: React.FC = () => {
  return (
    <div className="space-y-8 pb-12 text-white">
      <header>
        <h1 className="text-3xl font-black font-mono uppercase tracking-tighter">Central <span className="text-zinc-600">360°</span></h1>
        <p className="text-zinc-400 text-xs font-mono uppercase tracking-wide">Bem-vindo, Herói. Execute.</p>
      </header>
      
      <div className="p-1 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-2xl">
        <div className="bg-zinc-950 rounded-xl p-1">
          <div className="aspect-video w-full relative">
             <LiteYouTubeEmbed videoId="cWrWyPtsllM" title="Comunicado do Comando" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <OracleDecreePreview />
            <DailyIntentionPreview />
          </div>
          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md">
              <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Patente</p>
                  <div className="flex items-center gap-2"><Star className="w-4 h-4 text-red-500 fill-current" /><span className="text-lg font-black uppercase">{MOCK_USER.rank}</span></div>
              </div>
              <div className="text-right"><span className="text-4xl font-black">{MOCK_USER.level}</span><span className="text-[9px] text-zinc-600 uppercase font-mono">Nível</span></div>
              <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1.5"><span>Progresso</span><span>{MOCK_USER.xpProgress}%</span></div>
                  <div className="w-full bg-black/50 rounded-full h-1.5"><div className="bg-red-600 h-full rounded-full" style={{ width: `${MOCK_USER.xpProgress}%` }}></div></div>
                  <p className="text-[9px] text-zinc-600 mt-1.5 font-mono text-right">Faltam {MOCK_USER.xpRemaining} XP</p>
              </div>
            </div>
            <MissionProgressPreview />
          </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
