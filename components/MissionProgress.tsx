import React from 'react';
import { Mission } from '../types';
import { Target, CheckCircle, Flag, CalendarDays } from 'lucide-react';

interface MissionProgressProps {
  missions: Mission[];
}

const ProgressBar: React.FC<{ progress: number; label: string; count: string; color: string; allCompleted: boolean; icon: React.ElementType }> = ({ progress, label, count, color, allCompleted, icon: Icon }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label className="text-xs font-mono text-zinc-400 flex items-center gap-2">
        {allCompleted ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Icon className="w-4 h-4" />}
        {label}
      </label>
      <span className="text-xs font-mono font-bold text-white">{count}</span>
    </div>
    <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800">
      <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

const MissionProgress: React.FC<MissionProgressProps> = ({ missions }) => {
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg space-y-4">
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
        label="Semanais"
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