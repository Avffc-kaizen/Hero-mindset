import React, { Suspense, lazy } from 'react';
import { ProtectionModuleId } from '../types';
import { Award, Zap, RefreshCw, Star, AlertCircle, Flame, Shield, MessageSquare, ChevronRight } from 'lucide-react';
import { XP_PER_LEVEL_FORMULA } from '../utils';
import { useUser } from '../contexts/UserContext';
import MissionProgress from './MissionProgress';
import { useNavigate } from 'react-router-dom';

const LazySecondaryDashboard = lazy(() => import('./SecondaryDashboard'));

const DashboardSkeleton: React.FC = () => (
    <div className="space-y-8 animate-pulse">
        <div className="space-y-4">
            <div className="h-5 w-48 bg-zinc-800 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl h-[200px]"></div>
                ))}
            </div>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 h-[150px]">
            <div className="h-5 w-56 bg-zinc-800 rounded mb-4"></div>
            <div className="h-3 w-full bg-zinc-800 rounded mb-4"></div>
            <div className="h-10 w-full bg-zinc-800 rounded"></div>
        </div>
    </div>
);

const OracleWidget = () => {
    const { user, handleUpgrade } = useUser();
    const navigate = useNavigate();
    const { type, content } = user.dailyGuidance || { type: 'strategy', content: 'Analisando dados...' };

    let borderColor = "border-white/5", accentColor = "bg-zinc-800", IconComp = Zap;
    if (type === 'alert') { borderColor = "border-red-500/30"; accentColor="bg-red-500"; IconComp = AlertCircle; } 
    else if (type === 'praise') { borderColor = "border-green-500/30"; accentColor="bg-green-500"; IconComp = Award; }
    else { borderColor = "border-blue-500/30"; accentColor = "bg-blue-500"; IconComp = Flame; }

    return (
        <div className={`bg-zinc-900/40 border ${borderColor} rounded-2xl p-6 relative overflow-hidden backdrop-blur-md h-full flex flex-col`}>
             <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`}></div>
             <div className="flex-grow">
                <h3 className="text-[10px] font-black font-mono uppercase mb-3 flex items-center gap-2 tracking-widest text-zinc-400"><IconComp className="w-3 h-3" /> DIRETRIZ OPERACIONAL</h3>
                <p className="text-xl md:text-2xl font-bold text-white font-mono uppercase leading-tight tracking-tight mb-6">"{content}"</p>
             </div>
             <div className="border-t border-white/10 pt-4 mt-4">
                {user.hasSubscription ? (
                    <div>
                        <h4 className="text-[10px] font-black font-mono uppercase mb-2 flex items-center gap-2 tracking-widest text-zinc-400"><MessageSquare className="w-3 h-3" /> Análise Estratégica</h4>
                        <p className="text-sm text-zinc-400 italic truncate mb-3">Receba o relatório completo do dia.</p>
                        <button onClick={() => navigate('/app/mentor')} className="w-full text-center text-xs bg-white/10 text-white px-4 py-2 rounded font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                            Consultar Oráculo
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-sm font-bold text-white mb-2">Desbloqueie seu Mentor IA.</p>
                        <p className="text-xs text-zinc-400 mb-4">Receba análises diárias e estratégias personalizadas para acelerar sua jornada.</p>
                        <button onClick={() => handleUpgrade('mentor_ia')} className="bg-white text-black px-5 py-2.5 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 text-xs flex items-center gap-2 mx-auto">
                           Ativar Oráculo <ChevronRight className="w-4 h-4"/>
                        </button>
                    </div>
                )}
             </div>
        </div>
    );
};


const HeroicDashboard: React.FC = () => {
  const { user, handleRedoDiagnosis: onReset } = useUser();
  
  if (!user.archetype || !user.lifeMapScores) return null;

  const themeColor = "text-red-500"; 
  const nextLevelXP = XP_PER_LEVEL_FORMULA(user.level);
  const xpProgress = (user.currentXP / nextLevelXP) * 100;

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-mono uppercase text-white tracking-tighter">Central <span className="text-zinc-600">360°</span></h1>
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-wide">Quartel General • {user.name}</p>
        </div>
        <button onClick={onReset} className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase text-zinc-500 hover:text-white bg-zinc-900/50 border border-white/10 px-4 py-2.5 rounded-lg backdrop-blur-sm"><RefreshCw className="w-3 h-3"/> Recalibrar</button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><OracleWidget /></div>
          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Patente</p>
                      <div className="flex items-center gap-2"><Star className={`w-4 h-4 ${themeColor} fill-current`} /><span className="text-lg font-black text-white uppercase">{user.rank}</span></div>
                  </div>
                  <div className="text-right"><span className="text-4xl font-black text-zinc-200">{user.level}</span><span className="text-[9px] text-zinc-600 uppercase font-mono">Nível</span></div>
              </div>
              <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1.5"><span>Progresso</span><span className="text-white">{Math.floor(xpProgress)}%</span></div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 border border-white/5 overflow-hidden"><div className={`h-full rounded-full bg-red-600`} style={{ width: `${xpProgress}%` }}></div></div>
                  <p className="text-[9px] text-zinc-600 mt-1.5 font-mono text-right">Faltam {nextLevelXP - user.currentXP} XP</p>
              </div>
            </div>
            <MissionProgress />
          </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <LazySecondaryDashboard onRecalibrate={onReset} />
      </Suspense>
    </div>
  );
};

export default HeroicDashboard;