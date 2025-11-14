import React from 'react';
import { Target, CheckCircle, Flag, CalendarDays } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const ProgressBar: React.FC<{ progress: number; label: string; count: string; color: string; allCompleted: boolean; icon: React.ElementType }> = ({ progress, label, count, color, allCompleted, icon: Icon }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label className="text-xs font-mono text-zinc-400 flex items-center gap-2">
        {allCompleted ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Icon className="w-4 h-4" />}
        {label}
      </label>
      <span className="text-xs font-mono font-bold text-white">{count}</span>
    </div>
    <div className="w-full bg-black/50 rounded-full h-2 border border-white/5 overflow-hidden">
      <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

const MissionProgress: React.FC = () => {
  const { user } = useUser();
  const { missions } = user;

  const dailyMissions = missions.filter(m => m.type === 'daily');
  const weeklyMissions = missions.filter(m => m.type === 'weekly');
  const milestoneMissions = missions.filter(m => m.type === 'milestone');

  const completedDaily = dailyMissions.filter(m => m.completed).length;
  const totalDaily = dailyMissions.length;
  const dailyProgress = totalDaily > 0 ? (completedDaily / totalDaily) * 100 : 0;

  const completedWeekly = weeklyMissions.filter(m => m.completed).length;
  const totalWeekly = weeklyMissions.length;
  const weeklyProgress = totalWeekly > 0 ? (completedWeekly / totalWeekly) * 100 : 0;

  const completedMilestones = milestoneMissions.filter(m => m.completed).length;
  const totalMilestones = milestoneMissions.length;
  const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md">
      <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase flex items-center gap-2">
        <Target className="w-4 h-4 text-zinc-400" />
        Progresso das Missões
      </h3>
      <ProgressBar
        label="Diárias"
        progress={dailyProgress}
        count={`${completedDaily}/${totalDaily}`}
        color="bg-gradient-to-r from-red-600 to-red-500"
        allCompleted={totalDaily > 0 && completedDaily === totalDaily}
        icon={Target}
      />
      <ProgressBar
        label="Desafios"
        progress={weeklyProgress}
        count={`${completedWeekly}/${totalWeekly}`}
        color="bg-gradient-to-r from-blue-600 to-blue-500"
        allCompleted={totalWeekly > 0 && completedWeekly === totalWeekly}
        icon={CalendarDays}
      />
      <ProgressBar
        label="Marcos"
        progress={milestoneProgress}
        count={`${completedMilestones}/${totalMilestones}`}
        color="bg-gradient-to-r from-yellow-600 to-yellow-500"
        allCompleted={totalMilestones > 0 && completedMilestones === totalMilestones}
        icon={Flag}
      />
    </div>
  );
};

export default MissionProgress;
