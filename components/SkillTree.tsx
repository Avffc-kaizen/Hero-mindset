

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    <div className="bg-zinc-950 p-4 rounded-lg