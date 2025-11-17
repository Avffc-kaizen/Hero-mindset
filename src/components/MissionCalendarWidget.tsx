import React, { useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { Flame } from 'lucide-react';

const MissionCalendarWidget: React.FC = () => {
    const { user } = useUser();

    const { days, activityData, monthLabels } = useMemo(() => {
        const activityMap = new Map<string, number>();
        user.missions.forEach(mission => {
            if (mission.completed && mission.completionDate) {
                const dateStr = new Date(mission.completionDate).toISOString().slice(0, 10);
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
            }
        });

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 364); // Approx 52 weeks

        const days = [];
        const currentMonthLabels = new Map<number, string>();
        let lastMonth = -1;

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
            
            const month = d.getMonth();
            if (month !== lastMonth) {
                currentMonthLabels.set(days.length -1, d.toLocaleString('pt-BR', { month: 'short' }));
                lastMonth = month;
            }
        }
        
        return { days, activityData: activityMap, monthLabels: currentMonthLabels };
    }, [user.missions]);

    const getColorForCount = (count: number) => {
        if (count === 0) return 'bg-zinc-800/50';
        if (count <= 1) return 'bg-green-900/40';
        if (count <= 3) return 'bg-green-800';
        if (count <= 5) return 'bg-green-700';
        return 'bg-green-600';
    };

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-zinc-400" />
                Calendário da Missão
            </h3>
            <div className="flex gap-2">
                 <div className="grid grid-rows-7 gap-1 text-right">
                    {weekDays.map((day, i) => (
                        <div key={i} className="text-[10px] text-zinc-500 font-mono h-[12px] flex items-center justify-end">{ (i % 2 !== 0) ? '' : day}</div>
                    ))}
                 </div>
                <div className="w-full overflow-x-auto no-scrollbar">
                    <div className="relative grid grid-flow-col grid-rows-7 gap-1 w-max">
                        {days.map((day, index) => {
                            const dateStr = day.toISOString().slice(0, 10);
                            const count = activityData.get(dateStr) || 0;
                            const tooltip = `${count} miss${count === 1 ? 'ão' : 'ões'} em ${day.toLocaleDateString('pt-BR')}`;
                            const monthLabel = monthLabels.get(index);
                            return (
                                <div key={index} className="relative">
                                    {monthLabel && <div className="absolute -top-4 left-0 text-[10px] text-zinc-500 font-mono">{monthLabel}</div>}
                                    <div
                                        className={`heatmap-cell w-[12px] h-[12px] rounded-sm ${getColorForCount(count)}`}
                                        data-tooltip-text={tooltip}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
             <div className="flex justify-end items-center gap-2 text-xs text-zinc-500 mt-3 font-mono">
                Menos
                <div className="w-3 h-3 rounded-sm bg-zinc-800/50"></div>
                <div className="w-3 h-3 rounded-sm bg-green-900/40"></div>
                <div className="w-3 h-3 rounded-sm bg-green-800"></div>
                <div className="w-3 h-3 rounded-sm bg-green-700"></div>
                <div className="w-3 h-3 rounded-sm bg-green-600"></div>
                Mais
            </div>
        </div>
    );
};

export default MissionCalendarWidget;
