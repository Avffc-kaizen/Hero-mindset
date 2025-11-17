import React, { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { LifeMapCategory, LifeMapCategoriesList } from '../types';
import { abbreviateCategory } from '../utils';
import { BrainCircuit } from 'lucide-react';

interface HeroCompassProps {
    perceivedScores: Record<LifeMapCategory, number>;
    actionScores: Record<LifeMapCategory, number>;
}

const HeroCompass: React.FC<HeroCompassProps> = ({ perceivedScores, actionScores }) => {

    const chartData = useMemo(() => {
        return LifeMapCategoriesList.map(category => ({
            subject: abbreviateCategory(category),
            'Self Percebido': perceivedScores[category] || 0,
            'Self em Ação': actionScores[category] || 0,
            fullMark: 10,
        }));
    }, [perceivedScores, actionScores]);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <BrainCircuit className="w-6 h-6 text-yellow-500" />
                <h3 className="font-bold font-mono text-lg uppercase text-white">Bússola do Herói: Identidade vs. Ação</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6">
                A Bússola revela a lacuna entre sua identidade (quem você acredita ser) e suas ações (o que você realmente faz). Sua missão é alinhar os dois polígonos.
            </p>
            <div className="w-full h-80 lg:h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#27272a" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12, fontFamily: 'JetBrains Mono' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                        
                        <Radar 
                            name="Self Percebido" 
                            dataKey="Self Percebido" 
                            stroke="#a1a1aa" 
                            fill="#a1a1aa" 
                            fillOpacity={0.2} 
                            strokeDasharray="4 4" 
                        />
                        <Radar 
                            name="Self em Ação" 
                            dataKey="Self em Ação" 
                            stroke="#dc2626" 
                            fill="#dc2626" 
                            fillOpacity={0.6} 
                        />
                        
                        <Legend 
                            wrapperStyle={{
                                fontSize: "12px", 
                                fontFamily: "JetBrains Mono", 
                                paddingTop: "20px"
                            }} 
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#141419',
                                border: '1px solid #23232a',
                                borderRadius: '8px',
                                fontFamily: 'JetBrains Mono'
                            }}
                            labelStyle={{ color: '#eaeaea' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HeroCompass;
