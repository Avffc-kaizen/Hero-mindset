


import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: Corrected import paths to point to files within the 'src' directory.
import { useUser } from './src/contexts/UserContext';
import { ToolType, MissionCategory, LifeMapCategory, LifeMapCategoriesList, Skill } from './src/types';
import { SKILL_TREES } from './src/constants';
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
    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
      <div className="text-center">
        <div className="font-mono text-6xl font-bold tracking-tighter tabular-nums">{formatTime(timeLeft)}</div>
        <div className="text-sm uppercase text-zinc-400 font-mono tracking-widest">{mode === 'focus' ? 'Foco' : 'Descanso'}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <button onClick={toggleTimer} className={`col-span-1 py-2 rounded text-sm font-bold uppercase ${isActive ? 'bg-yellow-600 text-black' : 'bg-white text-black'}`}>{isActive ? <Pause className="w-4 h-4 mx-auto" /> : <Play className="w-4 h-4 mx-auto" />}</button>
        <button onClick={() => resetTimer('focus')} className="col-span-1 py-2 rounded text-sm font-bold uppercase bg-zinc-800 text-zinc-300"><RotateCcw className="w-4 h-4 mx-auto" /></button>
        <button onClick={() => resetTimer('break')} disabled={isActive} className="col-span-1 py-2 rounded text-sm font-bold uppercase bg-zinc-800 text-zinc-300 disabled:opacity-50">Break</button>
      </div>
    </div>
  );
};

export const SkillTree: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold font-mono flex items-center gap-2 uppercase">
                <GitMerge className="w-6 h-6" /> Arsenal de Habilidades
            </h2>
            <div className="text-center py-10 text-zinc-500 font-mono border border-zinc-800 border-dashed rounded-xl">
              <p>O Arsenal de Habilidades está em desenvolvimento.</p>
              <p className="text-xs mt-1">Volte em breve para desbloquear novas ferramentas.</p>
            </div>
        </div>
    );
};