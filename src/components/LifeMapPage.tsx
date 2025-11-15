import React from 'react';
import { useUser } from '../contexts/UserContext';
import { LifeMapCategory } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Map, RefreshCw, Target, Bot, ShieldAlert, Zap, TrendingUp, CheckCircle, ListChecks } from 'lucide-react';

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

    if (!user.lifeMapScores || !user.archetype) {
        return (
            <div className="p-6 text-center">
                <p className="text-zinc-400">Dados do Mapa de Vida não encontrados. Por favor, complete o diagnóstico.</p>
                <button onClick={handleRedoDiagnosis} className="mt-4 bg-white text-black px-6 py-2 rounded font-bold">Iniciar Diagnóstico</button>
            </div>
        );
    }
    
    const radarData = Object.entries(user.lifeMapScores).map(([subject, score]) => ({
        subject: subject as LifeMapCategory,
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
        // Fix: Operator '+' cannot be applied to types 'unknown' and 'number'.
        // Explicitly cast `score` to a number to prevent runtime errors and fix the type error. The `score` from `Object.values` on Firestore data is of type `unknown`.
        const sum = scores.reduce((currentSum, score) => currentSum + (Number(score) || 0), 0);
        const avg = sum / scores.length;
        return avg.toFixed(1);
    }, [user.lifeMapScores]);
    
    const analysisSections = React.useMemo(() => {
        const analysisText = user.mapAnalysis || '';
        const shadowDiagnosis = analysisText.match(/1\. \*\*Diagnóstico de Sombra:\*\*([\s\S]*?)(?=\n\n?2\. \*\*|$)/)?.[1].trim();
        const interventionProtocol = analysisText.match(/2\. \*\*Protocolo de Intervenção:\*\*([\s\S]*?)(?=\n\n?3\. \*\*|$)/)?.[1].trim();
        const leveragePoint = analysisText.match(/3\. \*\*Ponto de Alavancagem:\*\*([\s\S]*?)(?=\n\n?4\. \*\*|$)/)?.[1].trim();
        const actionTriadText = analysisText.match(/4\. \*\*Tríade de Ação:\*\*([\s\S]*)/)?.[1].trim();
        const actionTriad = actionTriadText?.split('\n').map(s => s.replace(/^- |^\d\. /, '').trim()).filter(s => s);

        return { shadowDiagnosis, interventionProtocol, leveragePoint, actionTriad };
    }, [user.mapAnalysis]);

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black font-mono uppercase flex items-center gap-3">
                        <Map className="w-8 h-8 text-zinc-400" /> Mapa de Vida 360°
                    </h2>
                    <p className="text-zinc-400 mt-2">Sua configuração atual de poder. Use esta clareza para planejar seu próximo movimento.</p>
                </div>
                <button onClick={handleRedoDiagnosis} className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase text-zinc-400 hover:text-white bg-zinc-900/50 border border-white/10 px-4 py-2.5 rounded-lg">
                    <RefreshCw className="w-3 h-3"/> Recalibrar Diagnóstico
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#404040" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="score" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-sm font-bold font-mono uppercase text-zinc-300 mb-3 flex items-center gap-2"><Target className="w-4 h-4"/> Áreas de Foco (90 Dias)</h3>
                        <ul className="space-y-2">
                            {user.focusAreas.map(area => (
                                <li key={area} className="text-zinc-200 font-mono bg-zinc-800/50 px-3 py-2 rounded-md text-sm">{area}</li>
                            ))}
                        </ul>
                    </div>
                     <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
                        <h3 className="text-sm font-bold font-mono uppercase text-zinc-300 mb-2">Pontuação Geral de Vida</h3>
                        <p className="text-5xl font-black text-white font-mono">{overallScore}</p>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="flex items-center gap-2 mb-4">
                        <Bot className="w-5 h-5 text-yellow-500"/>
                        <h3 className="text-lg font-bold font-mono uppercase text-white">Dossiê Estratégico do Oráculo</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {analysisSections.shadowDiagnosis && (
                            <AnalysisCard icon={ShieldAlert} title="Diagnóstico de Sombra">
                                <p>{analysisSections.shadowDiagnosis}</p>
                            </AnalysisCard>
                        )}
                        {analysisSections.leveragePoint && (
                            <AnalysisCard icon={TrendingUp} title="Ponto de Alavancagem">
                                <p>{analysisSections.leveragePoint}</p>
                            </AnalysisCard>
                        )}
                        {analysisSections.interventionProtocol && (
                            <AnalysisCard icon={Zap} title="Protocolo de Intervenção" className="md:col-span-2">
                                <p>{analysisSections.interventionProtocol}</p>
                            </AnalysisCard>
                        )}
                        {analysisSections.actionTriad && analysisSections.actionTriad.length > 0 && (
                            <AnalysisCard icon={ListChecks} title="Tríade de Ação" className="md:col-span-2">
                                <ul className="space-y-3">
                                    {analysisSections.actionTriad.map((action, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </AnalysisCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LifeMapPage;