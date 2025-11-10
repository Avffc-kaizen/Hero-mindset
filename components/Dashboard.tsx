
import React from 'react';
import { UserState } from '../types';
import { ARCHETYPES } from '../constants';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { Award, Compass, BarChart as BarChartIcon, Zap, Bot, RefreshCw, Star, ChevronRight, AlertCircle, Flame, Shield } from 'lucide-react';
import MissionProgress from './MissionProgress';

interface HeroicDashboardProps {
  user: UserState;
  onReset: () => void;
  hasSubscription: boolean;
  onUpgrade: (productId: string) => void;
}

const XP_PER_LEVEL_FORMULA = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

const HeroicDashboard: React.FC<HeroicDashboardProps> = ({ user, onReset, hasSubscription, onUpgrade }) => {
  
  if (!user.archetype || !user.lifeMapScores) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Dados do usuário incompletos. Por favor, reinicie o processo.</p>
        <button onClick={onReset} className="ml-4 p-2 bg-red-500 rounded">Reiniciar</button>
      </div>
    );
  }

  const archetypeInfo = ARCHETYPES[user.archetype];
  const { icon: Icon } = archetypeInfo;

  const scores = Object.entries(user.lifeMapScores);
  // FIX: Ensure values used in arithmetic operation are numbers.
  const sortedScores = [...scores].sort((a, b) => Number(a[1]) - Number(b[1]));
  const focusCategory = { name: sortedScores[0][0], score: sortedScores[0][1] };
  const strengthCategory = { name: sortedScores[scores.length - 1][0], score: sortedScores[scores.length - 1][1] };

  const chartData = scores.map(([name, score]) => ({
    subject: name.replace(' & ', ' & \n'),
    score: score,
    fullMark: 10,
  }));
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-lg z-50">
          <p className="font-bold font-mono text-zinc-100">{label.replace('\n', ' ')}</p>
          <p className="text-sm text-white flex justify-between gap-4 mt-1">
            <span>Pontuação:</span>
            <span className="font-mono font-bold">{payload[0].value} / 10</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const nextLevelXP = XP_PER_LEVEL_FORMULA(user.level);
  const xpProgress = (user.currentXP / nextLevelXP) * 100;

  const renderOracleDecree = () => {
    if (!hasSubscription) {
      return (
        <div className="bg-zinc-900 border border-red-900/30 rounded-xl p-6 text-center flex flex-col justify-center items-center h-full">
            <Bot className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 font-mono uppercase">O Oráculo Está Silencioso</h2>
            <p className="text-zinc-400 max-w-lg mx-auto mb-6 text-sm">
                Desbloqueie o Mentor IA para receber análises estratégicas diárias baseadas em seus dados de batalha.
            </p>
            <button
                onClick={() => onUpgrade('mentor_ia')}
                className="bg-white text-black px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-zinc-200 inline-flex items-center gap-2 transition-transform active:scale-95"
            >
                Consultar o Oráculo <ChevronRight className="w-4 h-4" />
            </button>
        </div>
      );
    }

    if (!user.dailyGuidance) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-center h-full">
                <p className="text-zinc-500 font-mono animate-pulse">Analisando dados táticos...</p>
            </div>
        );
    }

    const { type, content } = user.dailyGuidance;
    let borderColor = "border-zinc-700";
    let iconColor = "text-zinc-400";
    let IconComp = Shield;
    let title = "DECRETO ESTRATÉGICO";

    if (type === 'alert') {
        borderColor = "border-red-600";
        iconColor = "text-red-500";
        IconComp = AlertCircle;
        title = "ALERTA DE COMANDO";
    } else if (type === 'praise') {
        borderColor = "border-green-600";
        iconColor = "text-green-500";
        IconComp = Award;
        title = "HONRA AO MÉRITO";
    } else {
        borderColor = "border-blue-600";
        iconColor = "text-blue-500";
        IconComp = Flame;
        title = "DIRETRIZ TÁTICA";
    }

    return (
        <div className={`bg-zinc-950 border-l-4 ${borderColor} rounded-r-xl p-6 h-full flex flex-col justify-center relative overflow-hidden group`}>
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-transparent opacity-50"></div>
            <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <IconComp className={`w-24 h-24 ${iconColor}`} />
            </div>
            <div className="relative z-10">
                <h3 className={`text-xs font-bold font-mono uppercase mb-2 flex items-center gap-2 ${iconColor}`}>
                    <IconComp className="w-4 h-4" /> {title}
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-white font-mono uppercase leading-tight">
                    "{content}"
                </p>
                <p className="text-zinc-500 text-xs mt-4 font-mono uppercase">
                    Análise baseada em {Object.keys(user.lifeMapScores).length} vetores de dados.
                </p>
            </div>
        </div>
    );
  };

  return (
    <div className="h-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase flex items-center gap-3">
            <Compass className="w-7 h-7 text-zinc-400" />
            Quartel General
          </h1>
          <p className="text-zinc-500">Visão tática do seu progresso e diretrizes.</p>
        </div>
        <button onClick={onReset} className="mt-4 sm:mt-0 flex items-center gap-2 text-xs font-mono uppercase text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-3 py-2 rounded-md active:scale-95">
           <RefreshCw className="w-3 h-3"/> Refazer Diagnóstico
        </button>
      </header>
      
      {/* Proactive Oracle Section */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
             {renderOracleDecree()}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Status da Campanha
                </h3>
                <span className="font-mono text-xs text-zinc-500">{user.rank}</span>
            </div>

            <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800">
                <div className="bg-gradient-to-r from-zinc-300 to-white h-full rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center mt-2 font-mono text-xs">
                <span className="text-zinc-400">NÍVEL <span className="font-bold text-white text-sm sm:text-base">{user.level}</span></span>
                <span className="font-bold text-zinc-200">{user.currentXP.toLocaleString('pt-BR')} / {nextLevelXP.toLocaleString('pt-BR')} XP</span>
                <span className="text-zinc-400">NÍVEL <span className="font-bold text-white text-sm sm:text-base">{user.level + 1}</span></span>
            </div>
          </div>
      </div>

      <div className="mb-6">
        <MissionProgress missions={user.missions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 md:p-6 relative min-h-[350px] md:min-h-[500px]">
            <h2 className="text-base md:text-lg font-bold font-mono uppercase mb-4 text-zinc-300">Estado Heróico Global</h2>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Radar dataKey="score" stroke="#ffffff" fill="#ffffff" fillOpacity={0.1} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <Icon className="w-12 h-12 text-white mx-auto mb-3" />
            <h3 className="text-sm uppercase font-mono text-zinc-500">Seu Arquétipo de Herói</h3>
            <p className="text-xl sm:text-2xl font-bold font-mono text-white mb-2">{archetypeInfo.name}</p>
            <p className="text-xs italic text-zinc-400">"{archetypeInfo.motto}"</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase mb-4 flex items-center gap-2">
              <BarChartIcon className="w-4 h-4" /> Diagnóstico do Herói
            </h3>
            <div className="space-y-3">
              <div className="bg-zinc-950 p-3 rounded-md">
                <p className="text-xs uppercase font-mono text-green-500 flex items-center gap-1"><Award className="w-3 h-3" /> Ponto Forte</p>
                <p className="font-bold text-white text-sm sm:text-base">{strengthCategory.name} <span className="font-mono text-zinc-400">({strengthCategory.score}/10)</span></p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-md">
                <p className="text-xs uppercase font-mono text-yellow-500 flex items-center gap-1"><Zap className="w-3 h-3" /> Ponto de Foco</p>
                <p className="font-bold text-white text-sm sm:text-base">{focusCategory.name} <span className="font-mono text-zinc-400">({focusCategory.score}/10)</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroicDashboard;