import React, { useState } from 'react';
// FIX: Corrected import paths for types and UserContext assuming components directory is at the project root.
import { Mission, MissionCategory, MissionType } from './src/types';
import { Target, CheckCircle, Dumbbell, BookOpen, PiggyBank, Brain, Zap, Award, Loader2 } from 'lucide-react';
import { useUser } from './src/contexts/UserContext';

const categoryIcons: Record<MissionCategory, React.ElementType> = {
  Fitness: Dumbbell, Learning: BookOpen, Finance: PiggyBank, Mindset: Brain,
};
const categoryColors: Record<MissionCategory, string> = {
  Fitness: 'text-red-500', Learning: 'text-blue-500', Finance: 'text-green-500', Mindset: 'text-purple-500',
};

const MissionItem: React.FC<{ mission: Mission; onComplete: (id: string) => void }> = ({ mission, onComplete }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const Icon = categoryIcons[mission.category] || Zap;
  const color = categoryColors[mission.category] || 'text-zinc-400';
  const isChallenge = mission.type === 'weekly';

  const handleCompleteClick = () => {
    if (mission.completed || isCompleting) return;
    setIsCompleting(true);
    setTimeout(() => {
        onComplete(mission.id);
    }, 500); // Animation duration
  };

  return (
    <div className={`bg-zinc-900 border ${isChallenge ? 'border-amber-700/50' : 'border-zinc-800'} rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-500 ${mission.completed ? 'opacity-50' : ''} ${isCompleting ? 'animate-mission-complete border-green-500/50' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-zinc-800 ${color}`}><Icon className="w-6 h-6" /></div>
        <div>
          <p className="font-bold text-white">{mission.title}</p>
          <p className="text-xs text-zinc-400 font-mono uppercase flex items-center gap-1.5 mt-1">
             {isChallenge && (<><span className="text-amber-500 font-bold flex items-center gap-1"><Award className="w-3 h-3"/>DESAFIO SEMANAL</span><span className="text-zinc-600">•</span></>)}
            <span className={color}>{mission.category}</span>
            <span className="text-zinc-600">•</span>
            <span>+{mission.xp} XP</span>
          </p>
        </div>
      </div>
       <button 
        onClick={handleCompleteClick} 
        disabled={mission.completed || isCompleting} 
        className={`px-4 py-3 w-[120px] sm:w-[130px] text-xs rounded transition-colors active:scale-95 flex items-center justify-center gap-2 font-bold uppercase tracking-wider
          ${mission.completed 
            ? 'bg-zinc-800/50 text-green-500 cursor-default' 
            : isCompleting
            ? 'bg-zinc-800 text-zinc-400 cursor-wait'
            : 'bg-zinc-800 text-white hover:bg-zinc-100 hover:text-zinc-900'
          }
        `}
      >
        {isCompleting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
        ) : mission.completed ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Concluído</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Completar</span>
            <CheckCircle className="w-4 h-4 sm:hidden" />
          </>
        )}
      </button>
    </div>
  );
};

const MissionSkeleton = () => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 animate-pulse">
    <div className="flex items-center gap-4 flex-1">
      <div className="w-10 h-10 rounded-lg bg-zinc-800"></div>
      <div className="flex-1 space-y-2"><div className="h-4 bg-zinc-800 rounded w-3/4"></div><div className="h-3 bg-zinc-800 rounded w-1/2"></div></div>
    </div>
    <div className="w-24 h-10 bg-zinc-800 rounded hidden sm:block"></div>
    <div className="w-10 h-10 bg-zinc-800 rounded sm:hidden"></div>
  </div>
);

const Missions: React.FC = () => {
  const { user, handleCompleteMission, isMissionsLoading: loading } = useUser();
  const { missions } = user;
  const [activeTab, setActiveTab] = useState<MissionType>('daily');

  const missionsToShow = missions.filter(m => m.type === activeTab);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold font-mono flex items-center gap-2 uppercase"><Target className="w-6 h-6" /> Quadro de Missões</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 flex gap-1">
        <button onClick={() => setActiveTab('daily')} className={`flex-1 py-2 text-xs sm:text-sm font-mono uppercase rounded-lg transition-colors ${activeTab === 'daily' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50'}`}>Diárias</button>
        <button onClick={() => setActiveTab('weekly')} className={`flex-1 py-2 text-xs sm:text-sm font-mono uppercase rounded-lg transition-colors ${activeTab === 'weekly' ? 'bg-amber-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50'}`}>Desafios</button>
        <button onClick={() => setActiveTab('milestone')} className={`flex-1 py-2 text-xs sm:text-sm font-mono uppercase rounded-lg transition-colors ${activeTab === 'milestone' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50'}`}>Marcos</button>
      </div>
      <div className="space-y-4">
        {loading ? (
          <><MissionSkeleton /><MissionSkeleton /><MissionSkeleton /><div className="text-center pt-4 pb-2"><p className="text-xs font-mono text-zinc-500 animate-pulse">Oráculo gerando novos protocolos...</p></div></>
        ) : missionsToShow.length > 0 ? (
          missionsToShow.map(mission => <MissionItem key={mission.id} mission={mission} onComplete={handleCompleteMission} />)
        ) : (
          <div className="text-center py-12 text-zinc-500 font-mono border border-zinc-800 border-dashed rounded-xl"><p>Nenhuma missão de <span className="font-bold text-zinc-400">{activeTab}</span> disponível.</p><p className="text-xs mt-1">Aguarde o próximo ciclo.</p></div>
        )}
      </div>
    </div>
  );
};

export default Missions;