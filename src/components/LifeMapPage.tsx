import React from 'react';
import { useUser } from '../contexts/UserContext';
import { LifeMapCategory } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Map, RefreshCw, Target, Bot } from 'lucide-react';

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
    
    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold font-mono uppercase text-zinc-300 mb-4">Dossiê Estratégico do Oráculo</h3>
                    <div className="prose prose-sm prose-invert max-w-none prose-p:text-zinc-400 prose-headings:text-white prose-strong:text-zinc-200">
                        {user.mapAnalysis ? (
                            user.mapAnalysis.split('\n').map((line, index) => {
                                if (line.startsWith('**')) {
                                    return <strong key={index} className="block text-red-500 font-mono my-2">{line.replace(/\*\*/g, '')}</strong>;
                                }
                                return <p key={index}>{line}</p>;
                            })
                        ) : (
                            <p>A análise do Oráculo não está disponível. Recalibre o diagnóstico para gerar um novo dossiê.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
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
                </div>
            </div>
        </div>
    );
};

export default LifeMapPage;
