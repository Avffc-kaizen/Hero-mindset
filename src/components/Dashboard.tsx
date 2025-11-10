
import React, { useState } from 'react';
import { UserState, ProtectionModuleId } from '../types';
import { ARCHETYPES, STRIPE_IA_PRICE_ID, SKILL_TREES, PROTECTION_MODULES } from '../constants';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { Award, Zap, RefreshCw, Star, AlertCircle, Flame, Shield, GitMerge, Activity, Briefcase, TrendingUp, CheckCircle, Plus, Crown, Target, Lock, LayoutGrid, Heart, Brain, Moon, Coffee, Droplets, Book, Smile, HeartHandshake, Dumbbell, ChevronRight, Bot } from 'lucide-react';
import MissionProgress from './MissionProgress';

interface HeroicDashboardProps {
  user: UserState;
  onReset: () => void;
  hasSubscription: boolean;
  onUpgrade: (productId: string) => void;
}

const XP_PER_LEVEL_FORMULA = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

// --- MODULAR WIDGETS ---

const LockedModuleWidget = ({ moduleId, onUnlock }: { moduleId: ProtectionModuleId, onUnlock: () => void }) => {
    const module = PROTECTION_MODULES[moduleId];
    const Icon = module.icon;
    
    // Tailwind color mapping for dynamic classes
    const colorMap: Record<string, string> = {
        yellow: 'text-yellow-500 border-yellow-500/30 hover:border-yellow-500',
        red: 'text-red-500 border-red-500/30 hover:border-red-500',
        blue: 'text-blue-500 border-blue-500/30 hover:border-blue-500',
        purple: 'text-purple-500 border-purple-500/30 hover:border-purple-500',
        pink: 'text-pink-500 border-pink-500/30 hover:border-pink-500',
    };
    const styleClass = colorMap[module.color] || 'text-zinc-400 border-zinc-700';

    return (
        <div 
            onClick={onUnlock} 
            className={`bg-zinc-900/40 border border-dashed rounded-2xl p-6 h-full min-h-[200px] flex flex-col justify-center items-center group cursor-pointer transition-all backdrop-blur-md ${styleClass}`}
            role="button"
            tabIndex={0}
            aria-label={`Desbloquear módulo ${module.name}`}
            onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
        >
            <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-white/5">
                <Lock className="w-5 h-5 opacity-50" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold font-mono uppercase text-zinc-300 mb-1 flex items-center gap-2">
                <Icon className="w-4 h-4" aria-hidden="true" /> {module.name}
            </h2>
            <p className="text-[10px] text-zinc-400 text-center max-w-[200px] mb-4">{module.description}</p>
            <button className="text-[10px] bg-white/10 text-white px-4 py-2 rounded font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-white">
                Ativar Protocolo
            </button>
        </div>
    )
}

const BusinessRoadmapWidget = ({ user }: { user: UserState }) => {
    const [newItem, setNewItem] = useState('');
    const [items, setItems] = useState(user.businessRoadmap || []);

    const handleAdd = () => {
        if (!newItem.trim()) return;
        setItems([...items, { id: Date.now().toString(), title: newItem, completed: false }]);
        setNewItem('');
    };

    const toggle = (id: string) => {
        setItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
    };

    return (
        <div className="bg-zinc-900/40 border border-yellow-500/20 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-md h-full flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-32 h-32 text-yellow-500" aria-hidden="true" />
            </div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                    <h2 className="text-sm font-bold font-mono uppercase text-yellow-500 flex items-center gap-2 tracking-wide">
                        <Briefcase className="w-4 h-4" aria-hidden="true" /> SOBERANO (Business)
                    </h2>
                </div>
                {user.company && (
                    <div className="text-right bg-yellow-500/5 px-3 py-1 rounded border border-yellow-500/10">
                        <p className="text-[10px] font-bold text-yellow-100 uppercase tracking-wider">{user.company.name}</p>
                    </div>
                )}
            </div>
            
            <div className="space-y-2 mb-4 flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-yellow-900/20 relative z-10 min-h-[100px]">
                {items.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-500">
                        <Target className="w-6 h-6 mb-2 opacity-50" aria-hidden="true"/>
                        <p className="text-xs font-mono">Defina metas de expansão.</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => toggle(item.id)} 
                            className={`p-2 rounded border cursor-pointer transition-all flex items-center gap-3 group/item ${item.completed ? 'bg-yellow-900/10 border-yellow-900/20 opacity-60' : 'bg-black/40 border-white/5 hover:border-yellow-500/30 hover:bg-yellow-900/5'}`}
                            role="checkbox"
                            aria-checked={item.completed}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggle(item.id)}
                        >
                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${item.completed ? 'bg-yellow-600 border-yellow-600' : 'border-zinc-600 group-hover/item:border-yellow-500'}`}>
                                {item.completed && <CheckCircle className="w-2 h-2 text-black" aria-hidden="true" />}
                            </div>
                            <span className={`text-[10px] font-mono ${item.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{item.title}</span>
                        </div>
                    ))
                )}
            </div>

            <div className="flex gap-2 relative z-10 mt-auto">
                <input 
                    type="text" 
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/50 transition-colors font-mono placeholder:text-zinc-600"
                    placeholder="Nova diretriz..."
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    aria-label="Nova meta de negócio"
                />
                <button onClick={handleAdd} className="bg-yellow-600 text-black px-3 rounded hover:bg-yellow-500 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"><Plus className="w-4 h-4" aria-label="Adicionar meta" /></button>
            </div>
        </div>
    );
};

const BioShieldWidget = ({ user }: { user: UserState }) => {
    return (
        <div className="bg-zinc-900/40 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold font-mono uppercase text-red-500 flex items-center gap-2 tracking-wide">
                    <Activity className="w-4 h-4" aria-hidden="true" /> TITÃ (Bio-Shield)
                </h2>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-black/40 p-3 rounded border border-red-900/20">
                    <Moon className="w-4 h-4 text-indigo-400 mx-auto mb-1" aria-hidden="true" />
                    <p className="text-xl font-bold text-white">{user.bioData?.sleepHours || 0}h</p>
                    <p className="text-[9px] text-zinc-400 uppercase">Sono</p>
                </div>
                <div className="bg-black/40 p-3 rounded border border-red-900/20">
                    <Dumbbell className="w-4 h-4 text-red-400 mx-auto mb-1" aria-hidden="true" />
                    <p className="text-xl font-bold text-white">{user.bioData?.workoutsThisWeek || 0}</p>
                    <p className="text-[9px] text-zinc-400 uppercase">Treinos</p>
                </div>
                <div className="bg-black/40 p-3 rounded border border-red-900/20">
                    <Droplets className="w-4 h-4 text-cyan-400 mx-auto mb-1" aria-hidden="true" />
                    <p className="text-xl font-bold text-white">{user.bioData?.waterIntake || 0}L</p>
                    <p className="text-[9px] text-zinc-400 uppercase">Água</p>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>Recovery</span>
                    <span className="text-green-500">85%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1.5">
                    <div className="bg-green-600 h-full rounded-full" style={{width: '85%'}}></div>
                </div>
            </div>
        </div>
    )
}

const NeuroCoreWidget = ({ user }: { user: UserState }) => {
    return (
        <div className="bg-zinc-900/40 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold font-mono uppercase text-blue-500 flex items-center gap-2 tracking-wide">
                    <Brain className="w-4 h-4" aria-hidden="true" /> SÁBIO (Neuro-Core)
                </h2>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between bg-black/40 p-3 rounded border border-blue-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-900/20 flex items-center justify-center text-blue-400">
                            <Zap className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Deep Work</p>
                            <p className="text-[9px] text-zinc-400">Foco total hoje</p>
                        </div>
                    </div>
                    <p className="text-lg font-mono font-bold text-white">2h 15m</p>
                </div>
                
                <div className="flex items-center justify-between bg-black/40 p-3 rounded border border-blue-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-900/20 flex items-center justify-center text-blue-400">
                            <Book className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Input</p>
                            <p className="text-[9px] text-zinc-400">Páginas lidas</p>
                        </div>
                    </div>
                    <p className="text-lg font-mono font-bold text-white">24</p>
                </div>
            </div>
        </div>
    )
}

const SocialRadarWidget = ({ user }: { user: UserState }) => {
    return (
        <div className="bg-zinc-900/40 border border-pink-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold font-mono uppercase text-pink-500 flex items-center gap-2 tracking-wide">
                    <HeartHandshake className="w-4 h-4" aria-hidden="true" /> LÍDER (Social-Radar)
                </h2>
            </div>
            
            <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">Próximas Conexões</div>
                <div className="flex items-center gap-3 bg-black/40 p-2 rounded border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-xs text-zinc-300 flex-1">Jantar c/ Pais</p>
                    <p className="text-[9px] text-zinc-500">Hoje, 20h</p>
                </div>
                <div className="flex items-center gap-3 bg-black/40 p-2 rounded border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <p className="text-xs text-zinc-300 flex-1">Call Networking</p>
                    <p className="text-[9px] text-zinc-500">Amanhã</p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>NPS Relacionamento</span>
                        <span className="text-pink-400">9.2/10</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- MAIN DASHBOARD COMPONENT ---

const HeroicDashboard: React.FC<HeroicDashboardProps> = ({ user, onReset, hasSubscription, onUpgrade }) => {
  const [activeView, setActiveView] = useState<'radar' | 'bars'>('radar');

  if (!user.archetype || !user.lifeMapScores) return null;

  const themeColor = "text-red-500"; 
  const themeBorder = "border-white/10";
  const themeBg = "bg-red-600";

  const archetypeInfo = ARCHETYPES[user.archetype];
  const { icon: Icon } = archetypeInfo;

  const scores = Object.entries(user.lifeMapScores) as [string, number][];
  const chartData = scores.map(([name, score]) => ({
    subject: name.substring(0, 3).toUpperCase(),
    fullName: name,
    score: score,
    fullMark: 10,
  }));
  
  const nextLevelXP = XP_PER_LEVEL_FORMULA(user.level);
  const xpProgress = (user.currentXP / nextLevelXP) * 100;

  const renderOracleDecree = () => {
    if (!hasSubscription) {
      return (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center h-full min-h-[180px] group hover:border-zinc-700 transition-all backdrop-blur-md">
            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-white/5">
                <Lock className="w-5 h-5 text-zinc-500" aria-hidden="true" />
            </div>
            <h2 className="text-xs font-bold font-mono uppercase text-zinc-400 mb-1">Link Neural Inativo</h2>
            <p className="text-[10px] text-zinc-500 max-w-[200px] text-center mb-4">O Oráculo requer permissão de nível superior.</p>
            <button onClick={() => onUpgrade(STRIPE_IA_PRICE_ID)} className="text-[10px] bg-white text-black px-5 py-2.5 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-white">
                Ativar Oráculo
            </button>
        </div>
      );
    }

    const { type, content } = user.dailyGuidance || { type: 'strategy', content: 'Analisando dados...' };
    let borderColor = "border-white/5";
    let accentColor = "bg-zinc-800";
    let IconComp = Zap;
    let title = "DIRETRIZ OPERACIONAL";

    if (type === 'alert') { borderColor = "border-red-500/30"; accentColor="bg-red-500"; IconComp = AlertCircle; title = "ALERTA TÁTICO"; } 
    else if (type === 'praise') { borderColor = "border-green-500/30"; accentColor="bg-green-500"; IconComp = Award; title = "HONRA AO MÉRITO"; }
    else { borderColor = "border-blue-500/30"; accentColor = "bg-blue-500"; IconComp = Flame; title = "ESTRATÉGIA DO DIA"; }

    return (
        <div className={`bg-zinc-900/40 border ${borderColor} rounded-2xl p-6 h-full min-h-[180px] flex flex-col justify-center relative overflow-hidden shadow-lg backdrop-blur-md`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`}></div>
            <div className={`absolute -right-10 -top-10 w-40 h-40 ${accentColor} blur-[80px] opacity-10 rounded-full`}></div>
            
            <div className="relative z-10">
                <h3 className={`text-[10px] font-black font-mono uppercase mb-3 flex items-center gap-2 tracking-widest text-zinc-400`}>
                    <IconComp className="w-3 h-3" aria-hidden="true" /> {title}
                </h3>
                <p className="text-xl md:text-2xl font-bold text-white font-mono uppercase leading-tight tracking-tight drop-shadow-md">"{content}"</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-4 text-right flex items-center justify-end gap-2">
                    <Activity className="w-3 h-3" aria-hidden="true" /> ANÁLISE EM TEMPO REAL
                </p>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <h1 className="text-3xl font-black font-mono uppercase text-white tracking-tighter">
                Central <span className="text-zinc-600">360°</span>
             </h1>
          </div>
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-wide">Quartel General • {user.name}</p>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={onReset} className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase text-zinc-500 hover:text-white transition-colors bg-zinc-900/50 border border-white/10 px-4 py-2.5 rounded-lg hover:border-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-zinc-500">
                <RefreshCw className="w-3 h-3" aria-hidden="true"/> Recalibrar
            </button>
        </div>
      </header>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
             {renderOracleDecree()}
          </div>

          <div className={`bg-zinc-900/40 border ${themeBorder} rounded-2xl p-6 flex flex-col justify-between min-h-[180px] relative overflow-hidden backdrop-blur-md`}>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Patente Atual</p>
                    <div className="flex items-center gap-2">
                        <Star className={`w-4 h-4 ${themeColor} fill-current`} aria-hidden="true" />
                        <span className="text-lg font-black text-white uppercase tracking-wide">{user.rank}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-black text-zinc-200 tracking-tighter block leading-none">{user.level}</span>
                    <span className="text-[9px] text-zinc-600 uppercase font-mono">Nível</span>
                </div>
            </div>

            <div className="relative z-10 mt-4">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
                    <span>Progresso</span>
                    <span className="text-white">{Math.floor(xpProgress)}%</span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/5" role="progressbar" aria-valuenow={Math.floor(xpProgress)} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`h-full rounded-full transition-all duration-700 ${themeBg}`} style={{ width: `${xpProgress}%` }}></div>
                </div>
                <p className="text-[9px] text-zinc-600 mt-1.5 font-mono text-right">Próximo nível: {nextLevelXP - user.currentXP} XP</p>
            </div>
          </div>
      </div>

      {/* PROTECTION GRID - 360 MODULES */}
      <div>
          <h3 className="text-sm font-bold font-mono uppercase text-zinc-400 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" aria-hidden="true" /> Protocolos de Proteção Ativos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Módulo Financeiro (Soberano) */}
              {user.activeModules.includes('soberano') 
                ? <BusinessRoadmapWidget user={user} />
                : <LockedModuleWidget moduleId='soberano' onUnlock={() => alert("Upsell Sucesso 360")} />
              }

              {/* Módulo Saúde (Tita) */}
              {user.activeModules.includes('tita')
                ? <BioShieldWidget user={user} />
                : <LockedModuleWidget moduleId='tita' onUnlock={() => alert("Upsell Vigor 360")} />
              }

              {/* Módulo Intelectual (Sabio) */}
              {user.activeModules.includes('sabio')
                ? <NeuroCoreWidget user={user} />
                : <LockedModuleWidget moduleId='sabio' onUnlock={() => alert("Upsell Neuro 360")} />
              }
              
              {/* Módulo Social (Lider) */}
              {user.activeModules.includes('lider')
                ? <SocialRadarWidget user={user} />
                : <LockedModuleWidget moduleId='lider' onUnlock={() => alert("Upsell Tribo 360")} />
              }
          </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Radar & Metrics */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Radar Chart Container */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col backdrop-blur-md shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-bold font-mono uppercase text-zinc-300 flex items-center gap-2 tracking-wide">
                        <Activity className={`w-4 h-4 ${themeColor}`} aria-hidden="true" /> Relatório de Status
                    </h2>
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                        <button onClick={() => setActiveView('radar')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 ${activeView === 'radar' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Radar</button>
                        <button onClick={() => setActiveView('bars')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 ${activeView === 'bars' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Barras</button>
                    </div>
                </div>

                <div className="flex-grow flex items-center justify-center">
                    {activeView === 'radar' ? (
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                    <PolarGrid stroke="#27272a" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }} />
                                    <Radar 
                                        name="Hero" 
                                        dataKey="score" 
                                        stroke="#dc2626" 
                                        fill="#dc2626" 
                                        fillOpacity={0.2} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="w-full grid grid-cols-2 gap-x-8 gap-y-4">
                            {scores.map(([name, score]) => (
                                <div key={name} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[10px] font-mono uppercase text-zinc-400">
                                        <span>{name}</span>
                                        <span className={score >= 8 ? 'text-green-500' : score <= 4 ? 'text-red-500' : 'text-zinc-200'}>{score}</span>
                                    </div>
                                    <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${score >= 8 ? 'bg-green-600' : score <= 4 ? 'bg-red-600' : 'bg-zinc-500'}`} style={{ width: `${score * 10}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <MissionProgress missions={user.missions} />
        </div>

        {/* RIGHT COLUMN: Profile & Specifics */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* Archetype Card */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-center relative overflow-hidden group hover:border-white/10 transition-colors backdrop-blur-md h-[300px] flex flex-col justify-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent opacity-50"></div>
                <div className="w-20 h-20 mx-auto bg-black rounded-full flex items-center justify-center mb-4 border border-zinc-800 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                    <Icon className="w-10 h-10 text-zinc-200" aria-hidden="true" />
                </div>
                <h3 className="text-[10px] uppercase font-mono text-zinc-500 tracking-[0.2em] mb-2">Arquétipo</h3>
                <p className="text-2xl font-black font-mono text-white uppercase mb-4">{archetypeInfo.name}</p>
                <div className="bg-black/40 p-3 rounded border border-white/5">
                    <p className="text-xs text-zinc-400 font-mono italic leading-relaxed">"{archetypeInfo.motto}"</p>
                </div>
            </div>

            {/* Skill Progress */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 font-mono uppercase flex items-center gap-2 tracking-wide">
                            <GitMerge className="w-3 h-3 text-blue-500" aria-hidden="true" /> Arsenal de Skills
                        </h3>
                        <p className="text-zinc-500 text-[10px] font-mono mt-1">Ferramentas desbloqueadas</p>
                    </div>
                    <span className="text-xl font-black text-white font-mono">
                        {Math.round((user.unlockedSkills.length / Object.values(SKILL_TREES).reduce((acc, skills) => acc + skills.length, 0)) * 100)}%
                    </span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-1.5 border border-white/5 mb-4 relative z-10 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${(user.unlockedSkills.length / Object.values(SKILL_TREES).reduce((acc, skills) => acc + skills.length, 0)) * 100}%` }}></div>
                </div>
                <button onClick={() => window.location.hash = '#/app/skills'} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500">
                    Acessar Árvore
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default HeroicDashboard;
