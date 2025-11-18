import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { SKILL_TREES } from '../constants';
import { ToolType, Skill } from '../types';
import { Briefcase, Lock, X, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


// --- Ferramentas Táticas ---

const PomodoroTool: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            if (Notification.permission === "granted") {
                new Notification("Hero Mindset", {
                    body: `Sessão de ${mode === 'focus' ? 'Foco' : 'Descanso'} concluída!`,
                    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230b0b0d'/%3E%3Cpath d='M50 15 L85 30 L85 65 C85 75 60 90 50 90 C40 90 15 75 15 65 L15 30 Z' stroke='%23d6ff3f' stroke-width='5' fill='none'/%3E%3C/svg%3E"
                });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, mode]);
  
  useEffect(() => {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
  }, []);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = (newMode: 'focus' | 'break') => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  return (
    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
      <div className="text-center">
        <div className="font-mono text-6xl font-bold tracking-tighter tabular-nums text-white">{formatTime(timeLeft)}</div>
        <div className="text-sm uppercase text-zinc-400 font-mono tracking-widest">{mode === 'focus' ? 'Sessão de Foco' : 'Intervalo Curto'}</div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-6">
        <button 
            onClick={() => resetTimer('focus')} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase ${mode === 'focus' && !isActive ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}
        >
            Foco (25m)
        </button>
         <button 
            onClick={() => resetTimer('break')} 
            className={`px-4 py-2 rounded text-xs font-bold uppercase ${mode === 'break' && !isActive ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}
        >
            Pausa (5m)
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <button 
            onClick={toggleTimer} 
            className="col-span-1 py-4 rounded text-sm font-bold uppercase bg-white text-black flex items-center justify-center gap-2"
        >
            {isActive ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Iniciar</>}
        </button>
        <button 
            onClick={() => resetTimer(mode)} 
            className="col-span-1 py-4 rounded text-sm font-bold uppercase bg-zinc-800 text-zinc-300 flex items-center justify-center gap-2"
        >
            <RotateCcw className="w-4 h-4" /> Resetar
        </button>
      </div>
    </div>
  );
};


const PlaceholderTool: React.FC<{ name: string }> = ({ name }) => (
    <div className="p-8 text-center text-zinc-500 font-mono">
        <p>Ferramenta <span className="text-white">'{name}'</span> em desenvolvimento.</p>
    </div>
);

// --- Componentes Principais ---

const ToolCard: React.FC<{ skill: Skill; isUnlocked: boolean; onActivate: () => void; onGoToSkills: () => void; }> = ({ skill, isUnlocked, onActivate, onGoToSkills }) => {
    const Icon = skill.icon;
    return (
        <button
            onClick={isUnlocked ? onActivate : onGoToSkills}
            className="group w-full h-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col text-left transition-all duration-300 enabled:hover:border-yellow-500/50 enabled:hover:bg-zinc-900/50"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isUnlocked ? 'bg-zinc-800 text-yellow-500' : 'bg-zinc-800 text-zinc-600'}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {isUnlocked ? (
                    <span className="text-xs font-mono uppercase text-green-500">Desbloqueado</span>
                ) : (
                    <span className="text-xs font-mono uppercase text-zinc-600 flex items-center gap-1.5"><Lock className="w-3 h-3"/> Bloqueado</span>
                )}
            </div>
            <div className="flex-grow">
                <h4 className={`font-bold font-mono uppercase ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>{skill.name}</h4>
                <p className="text-sm text-zinc-400 mt-2">{skill.description}</p>
            </div>
            <p className="text-xs text-zinc-500 mt-4 font-mono">{skill.realBenefit}</p>
        </button>
    );
};


const TacticalArsenal: React.FC = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [activeTool, setActiveTool] = useState<ToolType | null>(null);

    const allSkillsWithTools = Object.values(SKILL_TREES).flat().filter(skill => skill.toolId);

    const renderTool = () => {
        switch (activeTool) {
            case 'pomodoro':
                return <PomodoroTool />;
            case 'breathing':
            case 'eisenhower':
            case 'budget':
                const toolName = allSkillsWithTools.find(s => s.toolId === activeTool)?.name || 'Ferramenta';
                return <PlaceholderTool name={toolName} />;
            default:
                return null;
        }
    };
    
    const activeToolDetails = allSkillsWithTools.find(s => s.toolId === activeTool);

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in">
            <div>
                <h2 className="text-3xl font-black font-mono uppercase flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-zinc-400" />
                    Arsenal Tático
                </h2>
                <p className="text-zinc-400 mt-2">Suas ferramentas desbloqueadas para a execução diária. Desbloqueie mais na <button onClick={() => navigate('/app/skills')} className="font-bold text-white underline">Árvore de Habilidades</button>.</p>
            </div>

            {allSkillsWithTools.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allSkillsWithTools.map(skill => (
                        <ToolCard 
                            key={skill.id}
                            skill={skill}
                            isUnlocked={user.unlockedSkills.includes(skill.id)}
                            onActivate={() => setActiveTool(skill.toolId!)}
                            onGoToSkills={() => navigate('/app/skills')}
                        />
                    ))}
                 </div>
            ) : (
                 <div className="text-center py-10 text-zinc-500 font-mono border border-zinc-800 border-dashed rounded-xl">
                    <p>Nenhuma ferramenta tática disponível no momento.</p>
                </div>
            )}
            
            {activeTool && activeToolDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveTool(null)}></div>
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl animate-in fade-in zoom-in-95">
                       <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                         <h3 className="font-mono font-bold text-white uppercase text-sm flex items-center gap-2">
                            <activeToolDetails.icon className="w-5 h-5 text-yellow-400" /> {activeToolDetails.name}
                         </h3>
                         <button onClick={() => setActiveTool(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                       </header>
                       <div className="p-6">
                         {renderTool()}
                       </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TacticalArsenal;