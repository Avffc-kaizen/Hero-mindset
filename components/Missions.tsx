import React, { useState } from 'react';
import { Mission, MissionCategory, MissionType } from '../types';
import { Target, CheckCircle, Loader2, Dumbbell, BookOpen, PiggyBank, Brain, Zap, Award } from 'lucide-react';

interface MissionsProps {
  missions: Mission[];
  onCompleteMission: (id: string) => void;
  loading: boolean;
}

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
  const Icon = categoryIcons[mission.category] || Zap;
  const color = categoryColors[mission.category] || 'text-zinc-400';
  const isChallenge = mission.type === 'weekly';

  return (
    <div className={`bg-zinc-900 border ${isChallenge ? 'border-amber-700/50' : 'border-zinc-800'} rounded-xl p-4 flex items-center justify-between gap-4 transition-opacity ${mission.completed ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-zinc-800 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold text-white">{mission.title}</p>
          <p className="text-xs text-zinc-400 font-mono uppercase flex items-center gap-1.5 mt-1">
             {isChallenge && (
                <>
                    <span className="text-amber-500 font-bold flex items-center gap-1"><Award className="w-3 h-3"/>DESAFIO SEMANAL</span>
                    <span className="text-zinc-600">•</span>
                </>
            )}
            <span className={color}>{mission.category}</span>
            <span className="text-zinc-600">•</span>
            <span>+{mission.xp} XP</span>
          </p>
        </div>
      </div>
      <button
        onClick={() => onComplete(mission.id)}
        disabled={mission.completed}
        className="px-4 py-3 bg-zinc-800 text-white font-bold uppercase tracking-wider text-xs rounded transition-colors active:scale-95 enabled:hover:bg-zinc-100 enabled:hover:text-zinc-900 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {mission.completed ? <CheckCircle className="w-4 h-4" /> : <span className="hidden sm:inline">Completar</span>}
        {!mission.completed && <CheckCircle className="w-4 h-4 sm:hidden" />}
      </button>
    </div>
  );
};

const Missions: React.FC<MissionsProps> = ({ missions, onCompleteMission, loading }) => {
  const [activeTab, setActiveTab] = useState<MissionType>('daily');

  const dailyMissions = missions.filter(m => m.type === 'daily');
  const weeklyMissions = missions.filter(m => m.type === 'weekly');
  const milestoneMissions = missions.filter(m => m.type === 'milestone');

  const getMissionsToShow = () => {
    switch(activeTab) {
      case 'daily': return dailyMissions;
      case 'weekly': return weeklyMissions;
      case 'milestone': return milestoneMissions;
      default: return [];
    }
  }

  const missionsToShow = getMissionsToShow();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold font-mono flex items-center gap-2 uppercase">
        <Target className="w-6 h-6" /> Quadro de Missões
      </h2>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 flex gap-1">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 text-sm font-mono uppercase rounded-lg transition-colors active:scale-95 ${activeTab === 'daily' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-950 hover:text-zinc-300'}`}
        >
          Diárias
        </button>
         <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-2 text-sm font-mono uppercase rounded-lg transition-colors active:scale-95 ${activeTab === 'weekly' ? 'bg-amber-800 text-white' : 'text-zinc-500 hover:bg-zinc-950 hover:text-zinc-300'}`}
        >
          Desafios Semanais
        </button>
        <button
          onClick={() => setActiveTab('milestone')}
          className={`flex-1 py-2 text-sm font-mono uppercase rounded-lg transition-colors active:scale-95 ${activeTab === 'milestone' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-950 hover:text-zinc-300'}`}
        >
          Marcos
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            <p className="font-mono text-zinc-500">Gerando novas missões personalizadas...</p>
          </div>
        ) : missionsToShow.length > 0 ? (
          missionsToShow.map(mission => (
            <MissionItem key={mission.id} mission={mission} onComplete={onCompleteMission} />
          ))
        ) : (
          <div className="text-center py-12 text-zinc-500 font-mono border border-zinc-800 border-dashed rounded-xl">
            <p>Nenhuma missão de <span className="font-bold text-zinc-400">{activeTab === 'daily' ? 'Diária' : activeTab === 'weekly' ? 'Desafio Semanal' : 'Marco'}</span> disponível.</p>
            <p className="text-xs mt-1">Aguarde o próximo ciclo para novas missões.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Missions;