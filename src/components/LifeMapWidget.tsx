import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { LifeMapCategory } from '../types';
import { TrendingUp, TrendingDown, Heart, Brain, Dumbbell, PiggyBank, Briefcase, Smile, Home, Eye, Star, Anchor, Wind, BarChart3, ChevronRight, Shield, Users, Calculator } from 'lucide-react';

const categoryIcons: Record<LifeMapCategory, React.ElementType> = {
  'Saúde & Fitness': Dumbbell,
  'Intelectual': Brain,
  'Emocional': Shield,
  'Caráter': Eye,
  'Espiritual': Anchor,
  'Amoroso': Star,
  'Social': Smile,
  'Financeiro': Calculator,
  'Carreira': Briefcase,
  'Qualidade de Vida': Wind,
  'Visão de Vida': Eye,
  'Família': Home,
};


const LifeMapWidget: React.FC = () => {
    const { user } = useUser();
    const navigate = useNavigate();

    const { top3, bottom3 } = useMemo(() => {
        if (!user.lifeMapScores) return { top3: [], bottom3: [] };
        
        const sortedScores = Object.entries(user.lifeMapScores)
            .map(([category, score]) => ({ category: category as LifeMapCategory, score }))
            .sort((a, b) => Number(b.score) - Number(a.score));

        return {
            top3: sortedScores.slice(0, 3),
            bottom3: sortedScores.slice(-3).reverse(),
        };
    }, [user.lifeMapScores]);
    
    if (!user.lifeMapScores) return null;

    const AreaItem: React.FC<{ category: LifeMapCategory; score: number }> = ({ category, score }) => {
        const Icon = categoryIcons[category] || BarChart3;
        return (
            <div className="flex items-center gap-3 p-2 bg-zinc-950/50 rounded-lg">
                <Icon className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                <span className="text-sm font-mono text-zinc-300 flex-grow truncate">{category}</span>
                <span className="font-bold font-mono text-white bg-zinc-800/50 px-2 py-0.5 rounded text-xs">{score}/10</span>
            </div>
        );
    };

    return (
        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold font-mono uppercase text-zinc-300">Mapa de Vida 360°</h2>
                <button onClick={() => navigate('/app/mapa')} className="text-xs font-mono uppercase text-zinc-400 hover:text-white flex items-center gap-1">
                    Ver Análise Completa <ChevronRight className="w-4 h-4"/>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xs font-bold font-mono uppercase text-green-500 flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4"/> Pontos Fortes</h3>
                    <div className="space-y-2">
                        {top3.map(item => <AreaItem key={item.category} {...item} />)}
                    </div>
                </div>
                 <div>
                    <h3 className="text-xs font-bold font-mono uppercase text-red-500 flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4"/> Áreas de Melhoria</h3>
                    <div className="space-y-2">
                        {bottom3.map(item => <AreaItem key={item.category} {...item} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LifeMapWidget;