
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserState, ToolType, MissionCategory, LifeMapCategory, LifeMapCategoriesList, Skill } from '../types';
import { SKILL_TREES } from '../constants';
import { GitMerge, Award, Brain, Dumbbell, Shield, PiggyBank, Lock, CheckCircle, Play, Pause, RotateCcw, Plus, Trash2, Calculator, Briefcase, Smile, Home, Eye, Star, Anchor, HelpCircle, Wind, ListTodo, Zap, Check, CalendarCheck, CheckSquare, Trash, Edit } from 'lucide-react';

interface SkillTreeProps {
  user: UserState;
  onUnlockSkill: (skillId: string) => void;
}

const categoryIcons: Record<LifeMapCategory, React.ElementType> = {
  'Intelectual': Brain,
  'Saúde & Fitness': Dumbbell,
  'Financeiro': Calculator,
  'Espiritual': Anchor,
  'Emocional': Shield,
  'Carreira': Briefcase,
  'Social': Smile,
  'Amoroso': Star, // Placeholder
  'Família': Home,
  'Caráter': Eye, // Placeholder
  'Qualidade de Vida': Wind,
  'Visão de Vida': Eye
};

// --- TOOLS COMPONENTS ---

const PomodoroTool = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    let interval: number;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play sound or notify
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };
  const setModeHandler = (m: 'focus' | 'break') => {
    setMode(m);
    setIsActive(false);
    setTimeLeft(m === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4">
      <h5 className="text-center font-mono text-zinc-400 mb-4 uppercase text-xs tracking-widest">Timer Pomodoro de Elite</h5>
      <div className="text-5xl font-bold font-mono text-white text-center mb-6">{formatTime(timeLeft)}</div>
      <div className="flex justify-center gap-4 mb-4">
        <button onClick={toggleTimer} className={`p-3 rounded-full ${isActive ? 'bg-yellow-600' : 'bg-green-600'} text-white hover:opacity-90 transition`}>
          {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
        <button onClick={resetTimer} className="p-3 rounded-full bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition">
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setModeHandler('focus')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${mode === 'focus' ? 'bg-red-900 text-red-100' : 'bg-zinc-800 text-zinc-400'}`}>Foco (25m)</button>
        <button onClick={() => setModeHandler('break')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${mode === 'break' ? 'bg-blue-900 text-blue-100' : 'bg-zinc-800 text-zinc-400'}`}>Pausa (5m)</button>
      </div>
    </div>
  );
};

const BreathingTool = () => {
  const [stage, setStage] = useState<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2'>('idle');
  const [count, setCount] = useState(4);

  useEffect(() => {
    if (stage === 'idle') return;
    
    const timer = window.setInterval(() => {
      setCount((c) => {
        if (c === 1) {
          // Transition
          switch (stage) {
            case 'inhale': setStage('hold1'); return 4;
            case 'hold1': setStage('exhale'); return 4;
            case 'exhale': setStage('hold2'); return 4;
            case 'hold2': setStage('inhale'); return 4;
            default: return 4;
          }
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  const getInstruction = () => {
    switch(stage) {
      case 'idle': return 'Toque para Iniciar';
      case 'inhale': return 'Inspire...';
      case 'hold1': return 'Segure...';
      case 'exhale': return 'Expire...';
      case 'hold2': return 'Segure...';
    }
  }

  return (
    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4 text-center cursor-pointer" onClick={() => setStage(stage === 'idle' ? 'inhale' : 'idle')}>
      <h5 className="font-mono text-zinc-400 mb-4 uppercase text-xs tracking-widest">Respiração Tática (Box)</h5>
      <div className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${
        stage === 'inhale' ? 'border-blue-500 scale-110 bg-blue-900/20' :
        stage === 'exhale' ? 'border-green-500 scale-90 bg-green-900/20' :
        stage === 'idle' ? 'border-zinc-700' : 'border-yellow-500'
      }`}>
        <span className="text-2xl font-bold font-mono text-white">{stage === 'idle' ? <Play className="w-8 h-8 ml-1"/> : count}</span>
      </div>
      <p className="mt-4 text-white font-bold uppercase animate-pulse">{getInstruction()}</p>
    </div>
  );
};

const EisenhowerTool = () => {
    const [tasks, setTasks] = useState<{id: number, text: string, quadrant: 1|2|3|4, completed: boolean}[]>([
        { id: 1, text: "Projeto Urgente", quadrant: 1, completed: false },
        { id: 2, text: "Exercício Físico", quadrant: 2, completed: false },
    ]);
    const [input, setInput] = useState('');
    const [quad, setQuad] = useState<1|2|3|4>(1);
    const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, taskId: number | null }>({ visible: false, x: 0, y: 0, taskId: null });

    // Fecha o menu ao clicar fora
    useEffect(() => {
        const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [contextMenu]);

    const addTask = () => {
        if(!input.trim()) return;
        setTasks([...tasks, { id: Date.now(), text: input, quadrant: quad, completed: false }]);
        setInput('');
    };
    
    const removeTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
        setContextMenu({ ...contextMenu, visible: false });
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        setContextMenu({ ...contextMenu, visible: false });
    };

    const handleContextMenu = (e: React.MouseEvent, taskId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            taskId
        });
    };

    return (
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4 relative">
             <h5 className="text-center font-mono text-zinc-400 mb-4 uppercase text-xs tracking-widest">Matriz Tática</h5>
             <div className="flex gap-2 mb-4">
                 <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm text-white" placeholder="Nova tarefa..." />
                 <select value={quad} onChange={e => setQuad(Number(e.target.value) as any)} className="bg-zinc-800 text-white text-xs rounded">
                     <option value={1}>Q1: Urgente/Imp</option>
                     <option value={2}>Q2: Não Urg/Imp</option>
                     <option value={3}>Q3: Urgente/Não Imp</option>
                     <option value={4}>Q4: Nem Urg/Nem Imp</option>
                 </select>
                 <button onClick={addTask} className="bg-green-700 p-2 rounded"><Plus className="w-4 h-4 text-white"/></button>
             </div>
             <div className="grid grid-cols-2 gap-2">
                 {[1,2,3,4].map(q => (
                     <div key={q} className="bg-zinc-900 p-2 rounded min-h-[60px]">
                         <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Q{q}</p>
                         {tasks.filter(t => t.quadrant === q).map(t => (
                             <div 
                                key={t.id} 
                                onContextMenu={(e) => handleContextMenu(e, t.id)}
                                className={`flex justify-between items-center text-xs text-zinc-300 mb-1 bg-zinc-800/50 px-2 py-1.5 rounded cursor-context-menu hover:bg-zinc-800 transition-colors group ${t.completed ? 'opacity-50' : ''}`}
                             >
                                 <span className={`truncate ${t.completed ? 'line-through text-zinc-500' : ''}`}>{t.text}</span>
                                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeTask(t.id)}><Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-500"/></button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 ))}
             </div>

             {/* Custom Context Menu */}
             {contextMenu.visible && (
                 <div 
                    style={{ top: contextMenu.y, left: contextMenu.x }} 
                    className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[150px] py-1 animate-in fade-in zoom-in-95 duration-100"
                 >
                     <button 
                        onClick={() => contextMenu.taskId && toggleTask(contextMenu.taskId)}
                        className="w-full text-left px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700 flex items-center gap-2"
                     >
                         <CheckSquare className="w-3 h-3" />
                         {tasks.find(t => t.id === contextMenu.taskId)?.completed ? 'Reabrir' : 'Concluir'}
                     </button>
                     <button 
                        onClick={() => contextMenu.taskId && removeTask(contextMenu.taskId)}
                        className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                     >
                         <Trash className="w-3 h-3" /> Excluir
                     </button>
                 </div>
             )}
        </div>
    )
}

const BudgetTool = () => {
    const [income, setIncome] = useState(5000);
    
    const needs = income * 0.50;
    const wants = income * 0.30;
    const savings = income * 0.20;

    return (
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4">
            <h5 className="text-center font-mono text-zinc-400 mb-4 uppercase text-xs tracking-widest">Calculadora 50/30/20</h5>
            <div className="flex items-center gap-2 mb-6">
                <span className="text-zinc-400 text-sm">Renda Mensal:</span>
                <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="bg-zinc-800 text-white px-2 py-1 rounded w-full text-right font-mono"/>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-300">Necessidades (50%)</span>
                    <span className="font-bold text-green-400 font-mono">R$ {needs.toFixed(2)}</span>
                </div>
                 <div className="w-full bg-zinc-900 h-2 rounded-full"><div className="bg-green-600 h-2 rounded-full" style={{width: '50%'}}></div></div>
                 
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-300">Desejos (30%)</span>
                    <span className="font-bold text-yellow-400 font-mono">R$ {wants.toFixed(2)}</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full"><div className="bg-yellow-600 h-2 rounded-full" style={{width: '30%'}}></div></div>

                 <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-300">Investimentos (20%)</span>
                    <span className="font-bold text-blue-400 font-mono">R$ {savings.toFixed(2)}</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full"><div className="bg-blue-600 h-2 rounded-full" style={{width: '20%'}}></div></div>
            </div>
        </div>
    )
}

const HabitTrackerTool = () => {
  // Helper to get local date string YYYY-MM-DD to avoid timezone issues
  const getDayKey = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  const [completedDates, setCompletedDates] = useState<string[]>(() => {
    const saved = localStorage.getItem('hero_habit_tracker');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [streak, setStreak] = useState(0);
  
  // Habit Name State
  const [habitName, setHabitName] = useState(() => localStorage.getItem('hero_habit_name') || 'Hábito Angular');
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(habitName);

  useEffect(() => {
    localStorage.setItem('hero_habit_tracker', JSON.stringify(completedDates));
    calculateStreak();
  }, [completedDates]);

  useEffect(() => {
    localStorage.setItem('hero_habit_name', habitName);
  }, [habitName]);

  const calculateStreak = () => {
    const today = new Date();
    const todayKey = getDayKey(today);
    const isTodayDone = completedDates.includes(todayKey);
    
    let streakCount = isTodayDone ? 1 : 0;
    
    // Robust Calculation:
    // 1. Start from yesterday
    let tempDate = new Date(today);
    tempDate.setDate(tempDate.getDate() - 1);
    
    while (true) {
        const key = getDayKey(tempDate);
        if (completedDates.includes(key)) {
            streakCount++;
            tempDate.setDate(tempDate.getDate() - 1);
        } else {
            // If yesterday is done but today isn't, the streak is still active from yesterday's perspective
            // But if yesterday isn't done, streak is 0 (unless today is done, then it's 1)
            // My initial logic `let streakCount = isTodayDone ? 1 : 0` handles the "today" part.
            // This loop adds past consecutive days.
            break;
        }
    }
    setStreak(streakCount);
  };

  const toggleDate = (date: Date) => {
    const dateStr = getDayKey(date);
    if (completedDates.includes(dateStr)) {
      setCompletedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setCompletedDates(prev => [...prev, dateStr]);
    }
  };

  const handleSaveHabit = () => {
      if(tempName.trim()) {
          setHabitName(tempName);
          setIsEditing(false);
      }
  };

  const getPastDays = (days: number) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // Normalize time to avoid DST issues when just needing dates
      d.setHours(12,0,0,0); 
      dates.push(d);
    }
    return dates;
  };

  const weekDays = getPastDays(7);

  return (
    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4">
        <div className="flex items-center justify-between mb-4">
             <div className="flex-1">
                 {isEditing ? (
                     <div className="flex items-center gap-2">
                         <input 
                            autoFocus
                            type="text" 
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none w-full max-w-[150px] font-mono"
                            placeholder="Nome do hábito..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveHabit()}
                         />
                         <button onClick={handleSaveHabit} className="text-green-500 hover:text-green-400 bg-zinc-900 p-1 rounded border border-zinc-800"><Check className="w-3 h-3"/></button>
                     </div>
                 ) : (
                     <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                        <h5 className="font-mono text-zinc-400 uppercase text-xs tracking-widest">{habitName}</h5>
                        <button className="text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit className="w-3 h-3" />
                        </button>
                     </div>
                 )}
             </div>
             <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="font-mono font-bold text-white text-xs">{streak} dias</span>
            </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date, idx) => {
                const dateStr = getDayKey(date);
                const isCompleted = completedDates.includes(dateStr);
                const dayName = date.toLocaleDateString('pt-BR', { weekday: 'narrow' }).charAt(0);
                const dayNum = date.getDate();
                const isToday = idx === 6;

                return (
                    <button 
                        key={dateStr}
                        onClick={() => toggleDate(date)}
                        className={`flex flex-col items-center justify-center p-2 rounded border transition-all active:scale-95 ${
                            isCompleted 
                            ? 'bg-green-900/30 border-green-500 text-green-500' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                        } ${isToday ? 'ring-1 ring-white/40' : ''}`}
                    >
                        <span className="text-[10px] font-mono uppercase opacity-50 mb-1">{dayName}</span>
                        {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{dayNum}</span>}
                    </button>
                )
            })}
        </div>
    </div>
  );
};

const SkillCardTooltip = ({ children, title, description, requirements }: { children?: React.ReactNode, title: string, description: string, requirements: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative w-full" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
           <h4 className="font-bold text-white text-sm mb-1 font-mono uppercase flex items-center gap-2">
             {title}
           </h4>
           <p className="text-zinc-400 text-xs mb-3 leading-relaxed border-b border-zinc-800 pb-2">{description}</p>
           <div>
             <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Status dos Requisitos</p>
             {requirements}
           </div>
           {/* Triangle */}
           <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-zinc-800"></div>
        </div>
      )}
    </div>
  )
}

const renderTool = (toolId: ToolType) => {
    switch(toolId) {
        case 'pomodoro': return <PomodoroTool />;
        case 'breathing': return <BreathingTool />;
        case 'eisenhower': return <EisenhowerTool />;
        case 'budget': return <BudgetTool />;
        case 'habit_tracker': return <HabitTrackerTool />;
        default: return null;
    }
}

// Extracted and Memoized Skill Item Component
const SkillItem = React.memo(({ 
  skill, 
  isUnlocked, 
  missionsCompleted, 
  reqMet, 
  canAfford, 
  onUnlock,
  isActiveTool,
  onToggleTool
}: { 
  skill: Skill, 
  isUnlocked: boolean, 
  missionsCompleted: number, 
  reqMet: boolean, 
  canAfford: boolean, 
  onUnlock: (id: string) => void,
  isActiveTool: boolean,
  onToggleTool: (id: ToolType | null) => void
}) => {
  const progressPercent = isUnlocked 
    ? 100 
    : Math.min(100, (missionsCompleted / skill.missionCountReq) * 100);

  // Mystery Logic: Only show generic icon and generic description if locked
  const IconToRender = isUnlocked ? skill.icon : Lock;
  const descToRender = isUnlocked && skill.realBenefit ? skill.realBenefit : skill.description;
  const nameToRender = skill.name;

  return (
    <div className="relative pl-12">
       <div className="absolute top-8 -translate-y-1/2 left-4 w-8 h-0.5 bg-zinc-800"></div>
      <div 
        className={`p-4 rounded-xl border transition-all duration-500 group ${
          isUnlocked 
            ? 'bg-zinc-900 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:border-yellow-500' 
            : reqMet 
            ? 'bg-zinc-900 border-zinc-600'
            : 'bg-zinc-950 border-zinc-800 opacity-70'
        }`}
      >
        <SkillCardTooltip
            title={skill.name}
            description={skill.description}
            requirements={(
                <p className={`flex items-center gap-1 text-xs font-mono ${reqMet ? 'text-green-400' : 'text-red-400'}`}>
                    {reqMet ? <CheckCircle className="w-3 h-3"/> : <Lock className="w-3 h-3"/>}
                    {reqMet 
                        ? 'Requisitos Cumpridos' 
                        : `${missionsCompleted}/${skill.missionCountReq} missões de ${skill.missionCategoryReq}`
                    }
                </p>
            )}
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-grow">
                    <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-visible ${isUnlocked ? 'bg-yellow-500/10' : 'bg-zinc-800'}`}>
                        {isUnlocked && <div className="absolute inset-0 bg-yellow-500/20 blur-lg rounded-full animate-pulse"></div>}
                        <IconToRender className={`w-6 h-6 relative z-10 ${isUnlocked ? 'text-yellow-400 drop-shadow-[0_0_3px_rgba(234,179,8,0.5)]' : 'text-zinc-500'}`} />
                    </div>
                    <div className="w-full">
                        <h4 className={`font-bold font-mono flex items-center gap-2 transition-colors ${isUnlocked ? 'text-yellow-100 text-shadow-sm' : 'text-white'}`}>
                            {nameToRender}
                            {isUnlocked && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </h4>
                        <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2 mb-2">
                            {!isUnlocked && <HelpCircle className="w-3 h-3"/>}
                            {descToRender}
                        </p>
                        
                        {/* Visual Progress Bar */}
                        <div className="w-full max-w-xs">
                           <div className="flex justify-between text-[10px] font-mono mb-1 uppercase text-zinc-500">
                               <span>{isUnlocked ? 'Maestria' : 'Progresso'}</span>
                               <span className={isUnlocked ? 'text-yellow-500 font-bold' : 'text-zinc-400'}>
                                 {Math.floor(progressPercent)}%
                               </span>
                           </div>
                           <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800/50 overflow-hidden">
                               <div 
                                 className={`h-full rounded-full transition-all duration-500 ${
                                    isUnlocked ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                                    reqMet ? 'bg-green-500' : 'bg-zinc-700'
                                 }`}
                                 style={{ width: `${progressPercent}%` }}
                               />
                           </div>
                        </div>

                        {!isUnlocked && (
                            <div className="mt-2 text-xs font-mono hidden sm:block">
                                <p className={`flex items-center gap-1 ${reqMet ? 'text-green-500' : 'text-red-500'}`}>
                                    {reqMet ? <CheckCircle className="w-3 h-3"/> : <Lock className="w-3 h-3"/>}
                                    Req: {missionsCompleted}/{skill.missionCountReq} missões de {skill.missionCategoryReq}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full sm:w-auto flex flex-col gap-2 flex-shrink-0">
                    {!isUnlocked ? (
                        <button
                            onClick={() => onUnlock(skill.id)}
                            disabled={!reqMet || !canAfford}
                            className="w-full sm:w-auto px-4 py-3 bg-zinc-100 text-black font-bold uppercase tracking-wider text-xs rounded transition-colors active:scale-95 enabled:hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {reqMet ? `Desbloquear (${skill.cost} Pts)` : 'Bloqueado'}
                        </button>
                    ) : (
                        skill.toolId && skill.toolId !== 'passive_buff' && (
                            <button
                                onClick={() => onToggleTool(isActiveTool ? null : skill.toolId as ToolType)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs uppercase font-bold rounded transition-colors"
                            >
                                {isActiveTool ? 'Ocultar Ferramenta' : 'Abrir Ferramenta'}
                            </button>
                        )
                    )}
                </div>
            </div>
        </SkillCardTooltip>

        {isUnlocked && isActiveTool && skill.toolId && skill.toolId !== 'passive_buff' && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-2 relative z-10">
                {renderTool(skill.toolId)}
            </div>
        )}
      </div>
    </div>
  );
});

const SkillTree: React.FC<SkillTreeProps> = ({ user, onUnlockSkill }) => {
  const [activeTab, setActiveTab] = useState<LifeMapCategory>('Intelectual');
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate completed missions by category for requirements - Memoized callback
  const getCompletedMissionsCount = useCallback((category: MissionCategory) => {
      return user.missions.filter(m => m.category === category && m.completed).length;
  }, [user.missions]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold font-mono flex items-center gap-2 uppercase">
          <GitMerge className="w-6 h-6 text-zinc-100" /> Arsenal de Habilidades
        </h2>
        <p className="text-zinc-400">Prove seu valor nas missões para liberar ferramentas de elite.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
        <h3 className="text-lg font-bold font-mono text-zinc-200">Pontos Disponíveis</h3>
        <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-md border border-zinc-700">
          <Award className="w-5 h-5 text-zinc-300" />
          <span className="text-2xl font-bold font-mono text-white">{user.skillPoints}</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2">
        <div 
            ref={scrollRef}
            className="flex gap-2 mb-4 overflow-x-auto pb-4 sm:pb-2 no-scrollbar snap-x snap-mandatory px-2"
        >
          {LifeMapCategoriesList.map(cat => {
            const Icon = categoryIcons[cat] || Brain;
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`flex-shrink-0 snap-center py-2 px-4 text-xs sm:text-sm font-mono uppercase rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap border ${
                  isActive 
                  ? 'bg-zinc-800 text-white border-zinc-600 shadow-md' 
                  : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-500' : ''}`} /> {cat}
              </button>
            );
          })}
        </div>
        <div className="p-2 sm:p-4 bg-zinc-950/30 rounded-lg">
          <h3 className="text-sm font-bold text-zinc-400 uppercase font-mono mb-4 pl-2 border-l-2 border-yellow-600">
            Protocolos: {activeTab}
          </h3>
          
          <div className="space-y-6 relative before:content-[''] before:absolute before:w-0.5 before:bg-zinc-800 before:top-6 before:bottom-6 before:left-4">
            {(SKILL_TREES[activeTab] || []).map((skill) => (
              <SkillItem 
                key={skill.id}
                skill={skill}
                isUnlocked={user.unlockedSkills.includes(skill.id)}
                missionsCompleted={getCompletedMissionsCount(skill.missionCategoryReq)}
                reqMet={getCompletedMissionsCount(skill.missionCategoryReq) >= skill.missionCountReq}
                canAfford={user.skillPoints >= skill.cost}
                onUnlock={onUnlockSkill}
                isActiveTool={activeTool === skill.toolId}
                onToggleTool={setActiveTool}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTree;
