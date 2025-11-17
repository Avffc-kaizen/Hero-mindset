import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { LifeMapCategory } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Map, RefreshCw, Target, Bot, ShieldAlert, Zap, TrendingUp, CheckCircle, ListChecks, Share2 } from 'lucide-react';
import { abbreviateCategory } from '../utils';
import { FRONTEND_URL } from '../constants';

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
    
    const radarData = Object.entries(user.lifeMapScores).map(([subject, score]) => ({
        subject: abbreviateCategory(subject as LifeMapCategory),
        score: score,
        fullMark: 10,
    }));

    const overallScore = React.useMemo(() => {
        if (!user.lifeMapScores) {
            return '0.0';
        }
        const scores = Object.values(user.lifeMapScores);
        if (scores.length === 0) {
            return '0.0';
        }
        // FIX: Explicitly typed the accumulator and cast the score to a number in `reduce` to ensure `sum` is a number, resolving downstream type errors.
        const sum = scores.reduce((currentSum: number, score) => currentSum + Number(score), 0);
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
    
    const analysisSections = React.useMemo(() => {
        const analysisText = user.mapAnalysis || '';
        const shadowDiagnosis = analysisText.match(/1\. \*\*Diagnóstico de Sombra:\*\*([\s\S]*?)(?=\n\n?2\. \*\*|$)/)?.[1].trim();
        const interventionProtocol = analysisText.match(/2\. \*\*Protocolo de Intervenção:\*\*([\s\S]*?)(?=\n\n?3\. \*\*|$)/)?.[1].trim();
        const leveragePoint = analysisText.match(/3\. \*\*Ponto de Alavancagem:\*\*([\s\S]*?)(?=\n\n?4\. \*\*|$)/)?.[1].trim();
        const actionTriadText = analysisText.match(/4\. \*\*Tríade de Ação:\*\*([\s\S]*)/)?.[1].trim();
        const actionTriad = actionTriadText?.split('\n').map(s => s.replace(/^- |^\d\. /g, '').trim()).filter(Boolean);
        
        return { shadowDiagnosis, interventionProtocol, leveragePoint, actionTriad };
    }, [user.mapAnalysis]);

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black font-mono uppercase flex items-center gap-3">
                        <Map className="w-8 h-8 text-zinc-400" />
                        Mapa de Vida 360°
                    </h2>
                    <p className="text-zinc-400 mt-2">Sua inteligência de combate para a jornada do herói.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleShare} className="flex items-center gap-2 text-xs font-bold font-mono uppercase text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4" /> {shareText}
                    </button>
                    <button onClick={handleRedoDiagnosis} className="flex items-center gap-2 text-xs font-bold font-mono uppercase text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg transition-colors">
                        <RefreshCw className="w-4 h-4" /> Recalibrar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center">
                    <div className="w-full h-80 lg:h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#27272a" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12, fontFamily: 'JetBrains Mono' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="score" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                            <p className="text-sm font-mono uppercase text-zinc-400">Arquétipo Dominante</p>
                            <p className="text-2xl font-bold font-mono uppercase text-white mt-1">{user.archetype}</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                            <p className="text-sm font-mono uppercase text-zinc-400">Pontuação Geral</p>
                            <p className="text-2xl font-bold font-mono uppercase text-white mt-1">{overallScore} / 10</p>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold font-mono uppercase text-zinc-300 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-zinc-400" /> Áreas de Foco (90 Dias)</h3>
                        <div className="flex flex-wrap gap-3">
                            {user.focusAreas.map(area => (
                                <span key={area} className="bg-zinc-800 text-zinc-100 px-3 py-1.5 rounded-full text-sm font-mono font-bold">{area}</span>
                            ))}
                        </div>
                    </div>
                     <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold font-mono uppercase text-zinc-300 mb-3 flex items-center gap-2"><Bot className="w-4 h-4 text-zinc-400" /> Dossiê Estratégico do Oráculo</h3>
                        <p className="text-zinc-400 text-sm whitespace-pre-wrap">{user.mapAnalysis ? "Análise completa abaixo." : "Complete o diagnóstico para gerar sua análise."}</p>
                    </div>
                </div>
            </div>
            
            {user.mapAnalysis && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnalysisCard icon={ShieldAlert} title="Diagnóstico de Sombra" className="lg:col-span-2">
                        <p>{analysisSections.shadowDiagnosis}</p>
                    </AnalysisCard>
                    <AnalysisCard icon={Zap} title="Protocolo de Intervenção">
                        <p>{analysisSections.interventionProtocol}</p>
                    </AnalysisCard>
                    <AnalysisCard icon={TrendingUp} title="Ponto de Alavancagem">
                         <p>{analysisSections.leveragePoint}</p>
                    </AnalysisCard>
                     <AnalysisCard icon={ListChecks} title="Tríade de Ação" className="lg:col-span-4">
                        <ul className="space-y-2">
                            {analysisSections.actionTriad?.map((action, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0"/>
                                    <span>{action}</span>
                                </li>
                            ))}
                        </ul>
                    </AnalysisCard>
                </div>
            )}
        </div>
    );
};

export default LifeMapPage;