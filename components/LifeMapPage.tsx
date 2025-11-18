import React, { useState, useMemo } from 'react';
// FIX: Corrected relative import paths.
import { useUser } from '../contexts/UserContext';
import { LifeMapCategory, LifeMapCategoriesList } from '../types';
import { Map, RefreshCw, Target, Bot, ShieldAlert, Zap, TrendingUp, CheckCircle, ListChecks, Share2 } from 'lucide-react';
// FIX: Corrected relative import path.
import { calculateActionScores } from '../src/utils';
import { FRONTEND_URL } from '../constants';
import HeroCompass from './HeroCompass';

const AnalysisCard: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode; className?: string }> = ({ icon: Icon, title, children, className = '' }) => (
    <div className={`bg-zinc-950/50 border border-zinc-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
            <Icon className="w-5 h-5 text-yellow-500" />
            <h4 className="font-bold font-mono text-sm uppercase text-white">{title}</h4>
        </div>
        <div className="text-zinc-400 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
);


const LifeMapPage: React.FC = () => {
    const { user, handleRedoDiagnosis } = useUser();
    const [shareText, setShareText] = useState('Compartilhar Análise');

    if (!user.lifeMapScores || !user.archetype) {
        return (
            <div className="p-6 text-center">
                <p className="text-zinc-400">Dados do Mapa de Vida não encontrados. Por favor, complete o diagnóstico.</p>
                <button onClick={handleRedoDiagnosis} className="mt-4 bg-white text-black px-6 py-2 rounded font-bold">Iniciar Diagnóstico</button>
            </div>
        );
    }

    const actionScores = useMemo(() => calculateActionScores(user.missions), [user.missions]);

    const overallScore = useMemo(() => {
        if (!user.lifeMapScores) return '0.0';
        const scores = Object.values(user.lifeMapScores);
        if (scores.length === 0) return '0.0';
        const sum = scores.reduce<number>((currentSum, score) => currentSum + Number(score || 0), 0);
        const avg = sum / scores.length;
        return avg.toFixed(1);
    }, [user.lifeMapScores]);

    const handleShare = async () => {
        const shareData = {
            title: `Meu Mapa de Vida 360° - Hero Mindset`,
            text: `Meu Mapa de Vida 360° no Hero Mindset:\n\nArquétipo: ${user.archetype}\nPontuação Geral: ${overallScore}/10\nFoco atual: ${user.focusAreas.join(', ')}\n\nDescubra o seu e forje sua lenda.`,
            url: FRONTEND_URL,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                setShareText('Copiado!');
                setTimeout(() => setShareText('Compartilhar Análise'), 2000);
            }
        } catch (error) {
            console.error('Share failed:', error);
            setShareText('Falhou!');
            setTimeout(() => setShareText('Compartilhar Análise'), 2000);
        }
    };
    
    // FIX: The component was not closed and the file was incomplete.
    // I am completing the component with a valid return statement.
    return (
      <div className="space-y-8 animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-3xl font-black font-mono uppercase flex items-center gap-3"><Map className="w-8 h-8 text-zinc-400" /> Mapa de Vida 360°</h2>
              <div className="flex gap-2">
                  <button onClick={handleShare} className="px-4 py-2 bg-zinc-800 text-xs font-bold uppercase rounded-lg flex items-center gap-2"><Share2 className="w-4 h-4"/> {shareText}</button>
                  <button onClick={handleRedoDiagnosis} className="px-4 py-2 bg-zinc-800 text-xs font-bold uppercase rounded-lg flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Refazer</button>
              </div>
          </div>

          <HeroCompass perceivedScores={user.lifeMapScores} actionScores={actionScores} />

          {user.mapAnalysis && (
            <div className="grid md:grid-cols-2 gap-6">
                 <AnalysisCard icon={Bot} title="Dossiê do Oráculo">
                    <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: user.mapAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                 </AnalysisCard>
                 <AnalysisCard icon={Target} title="Áreas de Foco (90 Dias)">
                    <ul className="list-none space-y-3">
                        {user.focusAreas.map(area => (
                            <li key={area} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /> <span>{area}</span></li>
                        ))}
                    </ul>
                 </AnalysisCard>
            </div>
          )}
      </div>
    );
};

export default LifeMapPage;