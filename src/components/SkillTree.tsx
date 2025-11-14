

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { ToolType, MissionCategory, LifeMapCategory, LifeMapCategoriesList, Skill } from '../types';
import { SKILL_TREES } from '../constants';
import { GitMerge, Award, Brain, Dumbbell, Shield, PiggyBank, Lock, CheckCircle, Play, Pause, RotateCcw, Plus, Trash2, Calculator, Briefcase, Smile, Home, Eye, Star, Anchor, HelpCircle, Wind, ListTodo, Zap, Check } from 'lucide-react';

// --- TOOL WIDGETS ---

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
            // TODO: Add sound notification
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
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = (newMode: 'focus' | 'break') => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4">
      <h5 className="text-center font-mono text-zinc-400 mb-4 uppercase text-xs tracking-widest">Timer Pomodoro de Elite</h5>
      <div className="text-5xl font-bold font-mono text-white text-center mb-6">{formatTime(timeLeft)}</div>
      <div className="flex justify-center gap-4 mb-4">
        <button onClick={toggleTimer} className={`p-3 rounded-full ${isActive ? 'bg-yellow-600' : 'bg-green-600'} text-white hover:opacity-90 transition`} aria-label={isActive ? "Pause timer" : "Start timer"}>
          {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
        <button onClick={() => resetTimer(mode)} className="p-3 rounded-full bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition" aria-label="Reset timer">
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => resetTimer('focus')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${mode === 'focus' ? 'bg-red-900 text-red-100' : 'bg-zinc-800 text-zinc-400'}`}>Foco (25m)</button>
        <button onClick={() => resetTimer('break')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${mode === 'break' ? 'bg-blue-900 text-blue-100' : 'bg-zinc-800 text-zinc-400'}`}>Pausa (5m)</button>
      </div>
    </div>
  );
};

const BreathingTool: React.FC = () => {
  const [stage, setStage] = useState<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2'>('idle');
  const [count, setCount] = useState(4);
  const intervalRef = useRef<number | null>(null);

  const startCycle = () => {
    setStage('inhale');
    setCount(4);
  };

  const stopCycle = () => {
    setStage('idle');
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (stage !== 'idle') {
      intervalRef.current = window.setInterval(() => {
        setCount(prevCount => {
          if (prevCount > 1) return prevCount - 1;
          setStage(currentStage => {
            switch (currentStage) {
              case 'inhale': return 'hold1';
              case 'hold1': return 'exhale';
              case 'exhale': return 'hold2';
              case 'hold2': return 'inhale';
              default: return 'idle';
            }
          });
          return 4;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [stage]);

  const instructionText = { idle: 'Toque para Iniciar', inhale: 'Inspire...', hold1: 'Segure...', exhale: 'Expire...', hold2: 'Segure...' };

  return (
    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4 text-center cursor-pointer" onClick={stage === 'idle' ? startCycle : stopCycle}>
      <h5 className="font-mono text-zinc-400 mb-4 uppercase text-xs tracking-widest">Respiração Tática (Box)</h5>
      <div className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${
        stage === 'inhale' ? 'border-blue-500 scale-110 bg-blue-900/20' :
        stage === 'exhale' ? 'border-green-500 scale-90 bg-green-900/20' :
        stage === 'idle' ? 'border-zinc-700' : 'border-yellow-500'
      }`}>
        <span className="text-2xl font-bold font-mono text-white">{stage === 'idle' ? <Play className="w-8 h-8 ml-1"/> : count}</span>
      </div>
      <p className="mt-4 text-white font-bold uppercase animate-pulse">{instructionText[stage]}</p>
    </div>
  );
};

const EisenhowerTool: React.FC = () => {
    const [tasks, setTasks] = useState<{id: number, text: string, quadrant: 1|2|3|4}[]>([]);
    const [input, setInput] = useState('');
    const [quad, setQuad] = useState<1|2|3|4>(1);

    const addTask = () => {
        if(!input.trim()) return;
        setTasks(prev => [...prev, { id: Date.now(), text: input, quadrant: quad }]);
        setInput('');
    };
    const removeTask = (id: number) => setTasks(prev => prev.filter(t => t.id !== id));

    const quadrantInfo = {
        1: { label: 'FAZER AGORA', color: 'border-red-500/50' },
        2: { label: 'AGENDAR', color: 'border-blue-500/50' },
        3: { label: 'DELEGAR', color: 'border-yellow-500/50' },
        4: { label: 'ELIMINAR', color: 'border-zinc-700' },
    };

    return (
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4">
             <h5 className="text-center font-mono text-zinc-400 mb-4 uppercase text-xs tracking-widest">Matriz Tática</h5>
             <div className="flex gap-2 mb-4">
                 <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm text-white" placeholder="Nova tarefa..." />
                 <select value={quad} onChange={e => setQuad(Number(e.target.value) as any)} className="bg-zinc-800 text-white text-xs rounded border border-zinc-700">
                     <option value={1}>Q1: Urgente/Imp</option>
                     <option value={2}>Q2: Não Urg/Imp</option>
                     <option value={3}>Q3: Urgente/Não Imp</option>
                     <option value={4}>Q4: Nem Urg/Nem Imp</option>
                 </select>
                 <button onClick={addTask} className="bg-green-700 p-2 rounded"><Plus className="w-4 h-4 text-white"/></button>
             </div>
             <div className="grid grid-cols-2 gap-2">
                 {([1,2,3,4] as const).map(q => (
                     <div key={q} className={`bg-zinc-900 p-2 rounded min-h-[60px] border ${quadrantInfo[q].color}`}>
                         <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">{quadrantInfo[q].label}</p>
                         {tasks.filter(t => t.quadrant === q).map(t => (
                             <div key={t.id} className="flex justify-between items-center text-xs text-zinc-300 mb-1 bg-zinc-800/50 px-1 rounded group">
                                 <span className="truncate pr-1">{t.text}</span>
                                 <button onClick={() => removeTask(t.id)} className="opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-500"/></button>
                             </div>
                         ))}
                     </div>
                 ))}
             </div>
        </div>
    );
};

const BudgetTool: React.FC = () => {
    const [income, setIncome] = useState(5000);
    const needs = income * 0.50, wants = income * 0.30, savings = income * 0.20;

    return (
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4">
            <h5 className="text-center font-mono text-zinc-400 mb-4 uppercase text-xs tracking-widest">Calculadora 50/30/20</h5>
            <div className="flex items-center gap-2 mb-6">
                <label className="text-zinc-400 text-sm font-mono whitespace-nowrap" htmlFor="income-input">Renda Mensal:</label>
                <input id="income-input" type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="bg-zinc-800 text-white px-2 py-1 rounded w-full text-right font-mono border border-zinc-700"/>
            </div>
            <div className="space-y-3">
                 <div className="flex justify-between items-center"><span className="text-sm text-zinc-300">Necessidades (50%)</span><span className="font-bold text-green-400 font-mono">R$ {needs.toFixed(2)}</span></div>
                 <div className="w-full bg-zinc-900 h-2 rounded-full"><div className="bg-green-600 h-2 rounded-full" style={{width: '100%'}}></div></div>
                 <div className="flex justify-between items-center"><span className="text-sm text-zinc-300">Desejos (30%)</span><span className="font-bold text-yellow-400 font-mono">R$ {wants.toFixed(2)}</span></div>
                 <div className="w-full bg-zinc-900 h-2 rounded-full"><div className="bg-yellow-600 h-2 rounded-full" style={{width: '100%'}}></div></div>
                 <div className="flex justify-between items-center"><span className="text-sm text-zinc-300">Investimentos (20%)</span><span className="font-bold text-blue-400 font-mono">R$ {savings.toFixed(2)}</span></div>
                 <div className="w-full bg-zinc-900 h-2 rounded-full"><div className="bg-blue-600 h-2 rounded-full" style={{width: '100%'}}></div></div>
            </div>
        </div>
    );
};

const HabitTrackerTool: React.FC = () => {
    const [habits, setHabits] = useState<{ id: number; text: string; completed: boolean }[]>([]);
    const [input, setInput] = useState('');
  
    const addHabit = () => {
      if (!input.trim()) return;
      setHabits([...habits, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    };
    const toggleHabit = (id: number) => setHabits(habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
    const removeHabit = (id: number) => setHabits(habits.filter(h => h.id !== id));
  
    return (
      <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4">
        <h5 className="text-center font-mono text-zinc-400 mb-4 uppercase text-xs tracking-widest">Rastreador de Hábitos</h5>
        <div className="flex gap-2 mb-4">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit()} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm text-white" placeholder="Novo hábito..." />
          <button onClick={addHabit} className="bg-green-700 p-2 rounded"><Plus className="w-4 h-4 text-white"/></button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {habits.map(habit => (
            <div key={habit.id} className={`flex items-center justify-between p-2 rounded transition-colors group ${habit.completed ? 'bg-green-900/20' : 'bg-zinc-800/50'}`}>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${habit.completed ? 'border-green-600 bg-green-600' : 'border-zinc-600'}`}>
                  {habit.completed && <Check className="w-3 h-3 text-black"/>}
                </div>
                <span className={`text-sm ${habit.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{habit.text}</span>
              </div>
              <button onClick={() => removeHabit(habit.id)} className="opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-500"/></button>
            </div>
          ))}
        </div>
      </div>
    );
};

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

const categoryIcons: Record<LifeMapCategory, React.ElementType> = { 'Intelectual': Brain, 'Saúde & Fitness': Dumbbell, 'Financeiro': Calculator, 'Espiritual': Anchor, 'Emocional': Shield, 'Carreira': Briefcase, 'Social': Smile, 'Amoroso': Star, 'Família': Home, 'Caráter': Eye, 'Qualidade de Vida': Wind, 'Visão de Vida': Eye };

const SkillTree: React.FC = () => {
  const { user, handleUnlockSkill: onUnlockSkill } = useUser();
  const [activeTab, setActiveTab] = useState<LifeMapCategory>('Intelectual');
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getCompletedMissionsCount = useCallback((category: MissionCategory) => {
      return user.missions.filter(m => m.category === category && m.completed).length;
  }, [user.missions]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold font-mono flex items-center gap-2 uppercase"><GitMerge className="w-6 h-6" /> Arsenal de Habilidades</h2>
        <p className="text-zinc-400">Prove seu valor nas missões para liberar ferramentas de elite.</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
        <h3 className="text-lg font-bold font-mono">Pontos Disponíveis</h3>
        <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-md border border-zinc-700"><Award className="w-5 h-5" /><span className="text-2xl font-bold font-mono text-white">{user.skillPoints}</span></div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2">
        <div ref={scrollRef} className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
          {LifeMapCategoriesList.map(cat => {
            const Icon = categoryIcons[cat] || Brain;
            const isActive = activeTab === cat;
            return ( <button key={cat} onClick={() => setActiveTab(cat)} className={`flex-shrink-0 py-2 px-4 text-xs sm:text-sm font-mono uppercase rounded-lg transition-colors flex items-center gap-2 border ${isActive ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}><Icon className={`w-4 h-4 ${isActive ? 'text-yellow-500' : ''}`} /> {cat}</button> );
          })}
        </div>
        <div className="p-2 sm:p-4 bg-zinc-950/30 rounded-lg">
          <h3 className="text-sm font-bold text-zinc-400 uppercase font-mono mb-4 pl-2 border-l-2 border-yellow-600">Protocolos: {activeTab}</h3>
          <div className="space-y-6 relative before:content-[''] before:absolute before:w-0.5 before:bg-zinc-800 before:top-6 before:bottom-6 before:left-4">
            {(SKILL_TREES[activeTab] || []).map((skill) => {
              const isUnlocked = user.unlockedSkills.includes(skill.id);
              const missionsCompleted = getCompletedMissionsCount(skill.missionCategoryReq);
              const reqMet = missionsCompleted >= skill.missionCountReq;
              const canAfford = user.skillPoints >= skill.cost;
              const isAvailable = !isUnlocked && reqMet;
              const IconToRender = skill.icon;
              return (
                <div key={skill.id} className="relative pl-12">
                  <div className={`absolute top-1/2 -translate-y-1/2 left-4 w-12 h-0.5 ${isUnlocked ? 'bg-yellow-600' : 'bg-zinc-800'}`}></div>
                  <div className={`absolute top-1/2 -translate-y-1/2 left-4 w-3 h-3 rounded-full ${isUnlocked ? 'bg-yellow-600' : 'bg-zinc-800'}`}></div>
                  <div className={`p-4 rounded-xl border transition-all duration-300 ${isUnlocked ? 'bg-zinc-900 border-yellow-500/50' : isAvailable ? 'bg-zinc-900 border-zinc-600' : 'bg-zinc-950 border-zinc-800 opacity-70'}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4"><div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${isUnlocked ? 'bg-yellow-500/20' : 'bg-zinc-800'}`}><IconToRender className={`w-6 h-6 ${isUnlocked ? 'text-yellow-500' : 'text-zinc-500'}`} /></div><div><h4 className="font-bold text-white font-mono flex items-center gap-2">{skill.name} {isUnlocked && <CheckCircle className="w-4 h-4 text-green-500" />}</h4><p className="text-sm text-zinc-400 mt-1">{isUnlocked && skill.realBenefit ? skill.realBenefit : skill.description}</p></div></div>
                      <div>
                        {!isUnlocked ? (
                          <button onClick={() => onUnlockSkill(skill.id)} disabled={!isAvailable || !canAfford} className="px-4 py-3 bg-zinc-100 text-black font-bold uppercase tracking-wider text-xs rounded transition-colors enabled:hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {isAvailable ? <>Desbloquear <span className="font-mono">({skill.cost} Pts)</span></> : <> <Lock className="w-3 h-3" /> Requisito</>}
                          </button>
                        ) : skill.toolId && skill.toolId !== 'passive_buff' ? (
                          <button onClick={() => setActiveTool(activeTool === skill.toolId ? null : skill.toolId as ToolType)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs uppercase font-bold rounded">{activeTool === skill.toolId ? 'Ocultar' : 'Ativar'}</button>
                        ) : null}
                      </div>
                    </div>
                    {!isUnlocked && <div className={`mt-2 text-xs font-mono flex items-center gap-1 ${reqMet ? 'text-green-500' : 'text-zinc-500'}`}>{reqMet ? <CheckCircle className="w-3 h-3"/> : <Lock className="w-3 h-3"/>} Req: {missionsCompleted}/{skill.missionCountReq} missões de {skill.missionCategoryReq}</div>}
                    {isUnlocked && activeTool === skill.toolId && skill.toolId && skill.toolId !== 'passive_buff' && <div className="mt-2 animate-in fade-in">{renderTool(skill.toolId)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTree;
