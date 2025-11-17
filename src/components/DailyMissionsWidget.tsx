import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Mission, MissionCategory } from '../types';
import { Target, CheckCircle, Dumbbell, BookOpen, PiggyBank, Brain, Zap, Loader2 } from 'lucide-react';

const categoryIcons: Record<MissionCategory, React.ElementType> = {
  Fitness: Dumbbell,
  Learning: BookOpen,
  Finance: PiggyBank,
  Mindset: Brain,
};

const categoryColors: Record<MissionCategory, string> = {
  Fitness: 'text-red-500',
  Learning: 'text-blue-500',
  Finance: 'text-green-500',
  Mindset: 'text-purple-500',
};

const MissionItem: React.FC<{ mission: Mission; onComplete: (id: string) => void }> = ({ mission, onComplete }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const Icon = categoryIcons[mission.category] || Zap;
  const color = categoryColors[mission.category] || 'text-zinc-400';

  const handleCompleteClick = () => {
    if (mission.completed || isCompleting) return;
    setIsCompleting(true);
    setTimeout(() => {
        onComplete(mission.id);
    }, 500);
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-lg transition-all duration-500 ${mission.completed ? 'opacity-50' : 'hover:border-zinc-700'} ${isCompleting ? 'animate-mission-complete' : ''}`}>
        <div className={`w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center bg-zinc-950 ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-grow">
            <p className={`font-medium text-sm text-zinc-200 ${mission.completed ? 'line-through' : ''}`}>{mission.title}</p>
            <p className="text-xs text-zinc-500 font-mono uppercase">+{mission.xp} XP</p>
        </div>
        <button
            onClick={handleCompleteClick}
            disabled={mission.completed || isCompleting}
            className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed
                ${mission.completed
                    ? 'bg-green-600 border-green-500'
                    : 'border-zinc-600 hover:border-green-500'
                }`}
            aria-label={`Completar missão: ${mission.title}`}
        >
            {isCompleting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <CheckCircle className={`w-5 h-5 ${mission.completed ? 'text-white' : 'text-zinc-600'}`} />}
        </button>
    </div>
  );
};


const DailyMissionsWidget: React.FC = () => {
  const { user, handleCompleteMission, isMissionsLoading } = useUser();
  const dailyMissions = user.missions.filter(m => m.type === 'daily');

  return (
    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
      <h2 className="text-sm font-bold font-mono uppercase text-zinc-300 flex items-center gap-2 mb-4">
        <Target className="w-4 h-4" /> Missões Diárias
      </h2>
      {isMissionsLoading ? (
        <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : dailyMissions.length > 0 ? (
        <div className="space-y-3">
            {dailyMissions.map(mission => (
                <MissionItem key={mission.id} mission={mission} onComplete={handleCompleteMission} />
            ))}
        </div>
      ) : (
        <p className="text-center text-zinc-500 py-8 font-mono text-sm">
            Nenhuma missão diária disponível.
        </p>
      )}
    </div>
  );
};

export default DailyMissionsWidget;
