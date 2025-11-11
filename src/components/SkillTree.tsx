import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ToolType, MissionCategory, LifeMapCategory, LifeMapCategoriesList, Skill } from '../types';
import { SKILL_TREES } from '../constants';
import { GitMerge, Award, Brain, Dumbbell, Shield, PiggyBank, Lock, CheckCircle, Play, Pause, RotateCcw, Plus, Trash2, Calculator, Briefcase, Smile, Home, Eye, Star, Anchor, HelpCircle, Wind, ListTodo, Zap, Check, CalendarCheck, CheckSquare, Trash, Edit } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

// ... (Tool components remain unchanged)
const PomodoroTool = () => { /* ... */ };
const BreathingTool = () => { /* ... */ };
const EisenhowerTool = () => { /* ... */ };
const BudgetTool = () => { /* ... */ };
const HabitTrackerTool = () => { /* ... */ };

const categoryIcons: Record<LifeMapCategory, React.ElementType> = { 'Intelectual': Brain, 'Saúde & Fitness': Dumbbell, 'Financeiro': Calculator, 'Espiritual': Anchor, 'Emocional': Shield, 'Carreira': Briefcase, 'Social': Smile, 'Amoroso': Star, 'Família': Home, 'Caráter': Eye, 'Qualidade de Vida': Wind, 'Visão de Vida': Eye };

const SkillCardTooltip = ({ children, title, description, requirements }: { children?: React.ReactNode, title: string, description: string, requirements: React.ReactNode }) => { /* ... */ };
const renderTool = (toolId: ToolType) => { /* ... */ };

const SkillItem = React.memo(({ skill, isUnlocked, missionsCompleted, reqMet, canAfford, onUnlock, isActiveTool, onToggleTool }: { skill: Skill, isUnlocked: boolean, missionsCompleted: number, reqMet: boolean, canAfford: boolean, onUnlock: (id: string) => void, isActiveTool: boolean, onToggleTool: (id: ToolType | null) => void }) => { /* ... */ });

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
        <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-md border border-zinc-700">
          <Award className="w-5 h-5" />
          <span className="text-2xl font-bold font-mono text-white">{user.skillPoints}</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2">
        <div ref={scrollRef} className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
          {LifeMapCategoriesList.map(cat => {
            const Icon = categoryIcons[cat] || Brain;
            const isActive = activeTab === cat;
            return (
              <button key={cat} onClick={() => setActiveTab(cat)} className={`flex-shrink-0 py-2 px-4 text-xs sm:text-sm font-mono uppercase rounded-lg transition-colors flex items-center gap-2 border ${isActive ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-500' : ''}`} /> {cat}
              </button>
            );
          })}
        </div>
        <div className="p-2 sm:p-4 bg-zinc-950/30 rounded-lg">
          <h3 className="text-sm font-bold text-zinc-400 uppercase font-mono mb-4 pl-2 border-l-2 border-yellow-600">Protocolos: {activeTab}</h3>
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
