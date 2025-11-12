import React from 'react';
import { ProtectionModuleId, RoadmapItem, BioData } from '../types';
import { PROTECTION_MODULES } from '../constants';
import { Award, Zap, RefreshCw, Star, AlertCircle, Flame, Shield, Briefcase, Activity, TrendingUp, CheckCircle, Plus, Lock, Dumbbell, Moon, Droplets, Trash2, Bot, Target, Check } from 'lucide-react';
import { XP_PER_LEVEL_FORMULA } from '../utils';
import { useUser } from '../contexts/UserContext';
import MissionProgress from './MissionProgress';

// --- MODULAR WIDGETS ---

const LockedModuleWidget = ({ moduleId, onUnlock }: { moduleId: ProtectionModuleId, onUnlock: (moduleId: ProtectionModuleId) => void }) => {
    const module = PROTECTION_MODULES[moduleId];
    const Icon = module.icon;
    
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
            onClick={() => onUnlock(moduleId)}
            className={`bg-zinc-900/40 border border-dashed rounded-2xl p-6 h-full min-h-[200px] flex flex-col justify-center items-center group cursor-pointer transition-all backdrop-blur-md ${styleClass}`}
            role="button"
            tabIndex={0}
            aria-label={`Desbloquear módulo ${module.name}`}
            onKeyDown={(e) => e.key === 'Enter' && onUnlock(moduleId)}
        >
            <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-white/5">
                <Lock className="w-5 h-5 opacity-50" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold font-mono uppercase text-zinc-300 mb-1 flex items-center gap-2">
                <Icon className="w-4 h-4" aria-hidden="true" /> {module.name}
            </h2>
            <p className="text-[10px] text-zinc-400 text-center max-w-[200px] mb-4">{module.description}</p>
            <div className="text-[10px] bg-white/10 text-white px-4 py-2 rounded font-bold uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-white">
                Ativar Protocolo
            </div>
        </div>
    )
}

const BusinessRoadmapWidget = () => {
    const { user, handleUpdateUser } = useUser();
    const [newItem, setNewItem] = React.useState('');
    const items = user.businessRoadmap || [];

    const handleUpdate = (newItems: RoadmapItem[]) => {
        handleUpdateUser({ businessRoadmap: newItems });
    };

    const handleAdd = () => {
        if (!newItem.trim()) return;
        handleUpdate([...items, { id: Date.now().toString(), title: newItem, completed: false }]);
        setNewItem('');
    };

    const toggle = (id: string) => handleUpdate(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
    const remove = (id: string) => handleUpdate(items.filter(i => i.id !== id));

    return (
        <div className="bg-zinc-900/40 border border-yellow-500/20 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-md h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold font-mono uppercase text-yellow-500 flex items-center gap-2"><Briefcase className="w-4 h-4" /> SOBERANO (Business)</h2>
                {user.company && <div className="text-[10px] font-bold text-yellow-100 uppercase">{user.company.name}</div>}
            </div>
            <div className="space-y-2 mb-4 flex-grow overflow-y-auto pr-2 min-h-[100px]">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500"><Target className="w-6 h-6 mb-2 mx-auto"/><p className="text-xs font-mono">Defina metas de expansão.</p></div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className={`p-2 rounded border flex items-center gap-3 group/item ${item.completed ? 'bg-yellow-900/10 border-yellow-900/20 opacity-60' : 'bg-black/40 border-white/5 hover:border-yellow-500/30'}`}>
                            <div onClick={() => toggle(item.id)} className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center cursor-pointer flex-shrink-0 ${item.completed ? 'bg-yellow-600 border-yellow-600' : 'border-zinc-600'}`}>
                                {item.completed && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <span className={`text-xs font-mono flex-grow ${item.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{item.title}</span>
                             <button onClick={() => remove(item.id)} className="opacity-0 group-hover/item:opacity-50 hover:opacity-100"><Trash2 className="w-3 h-3 text-red-500"/></button>
                        </div>
                    ))
                )}
            </div>
            <div className="flex gap-2 mt-auto">
                <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-xs font-mono placeholder:text-zinc-600" placeholder="Nova diretriz..." onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                <button onClick={handleAdd} className="bg-yellow-600 text-black px-3 rounded"><Plus className="w-4 h-4" /></button>
            </div>
        </div>
    );
};

const BioShieldWidget = () => {
    const { user, handleUpdateUser } = useUser();
    const bioData = user.bioData || { sleepHours: 0, workoutsThisWeek: 0, waterIntake: 0 };
    const handleUpdate = (field: keyof BioData, increment: number) => handleUpdateUser({ bioData: { ...bioData, [field]: Math.max(0, parseFloat(((bioData[field] || 0) + increment).toFixed(2))) }});
    
    const StatButton: React.FC<{field: keyof BioData, value: number, label: string, icon: React.ElementType, color: string, increment: number}> = ({field, value, label, icon: Icon, color, increment}) => (
        <div className="bg-black/40 p-3 rounded border border-red-900/20 text-center group relative">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-[9px] text-zinc-400 uppercase">{label}</p>
            <div className="absolute inset-0 flex justify-between items-center px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleUpdate(field, -increment)} className="w-6 h-6 rounded-full bg-black/50 text-white">-</button>
                 <button onClick={() => handleUpdate(field, +increment)} className="w-6 h-6 rounded-full bg-black/50 text-white">+</button>
            </div>
        </div>
    );

    return (
        <div className="bg-zinc-900/40 border border-red-500/20 rounded-2xl p-6 backdrop-blur-md h-full">
            <h2 className="text-sm font-bold font-mono uppercase text-red-500 flex items-center gap-2 mb-4"><Activity className="w-4 h-4" /> TITÃ (Bio-Shield)</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
                <StatButton field="sleepHours" value={bioData.sleepHours} label="Sono (h)" icon={Moon} color="text-indigo-400" increment={0.5} />
                <StatButton field="workoutsThisWeek" value={bioData.workoutsThisWeek} label="Treinos" icon={Dumbbell} color="text-red-400" increment={1} />
                <StatButton field="waterIntake" value={bioData.waterIntake} label="Água (L)" icon={Droplets} color="text-cyan-400" increment={0.25} />
            </div>
        </div>
    )
}

const HeroicDashboard: React.FC = () => {
  const { user, handleRedoDiagnosis: onReset, handleUpgrade } = useUser();
  
  if (!user.archetype || !user.lifeMapScores) return null;

  const themeColor = "text-red-500"; 
  const nextLevelXP = XP_PER_LEVEL_FORMULA(user.level);
  const xpProgress = (user.currentXP / nextLevelXP) * 100;

  const handleModuleUnlock = (moduleId: ProtectionModuleId) => handleUpgrade('sucesso_360');

  const renderOracleDecree = () => {
    if (!user.hasSubscription) {
      return (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center h-full min-h-[180px] group hover:border-zinc-700 backdrop-blur-md">
            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 border border-white/5"><Lock className="w-5 h-5 text-zinc-500" /></div>
            <h2 className="text-xs font-bold font-mono uppercase text-zinc-400 mb-1">Link Neural Inativo</h2>
            <p className="text-[10px] text-zinc-500 mb-4">O Oráculo requer permissão superior.</p>
            <button onClick={() => handleUpgrade('mentor_ia')} className="text-[10px] bg-white text-black px-5 py-2.5 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 shadow-lg">Ativar Oráculo</button>
        </div>
      );
    }
    const { type, content } = user.dailyGuidance || { type: 'strategy', content: 'Analisando dados...' };
    let borderColor = "border-white/5", accentColor = "bg-zinc-800", IconComp = Zap;
    if (type === 'alert') { borderColor = "border-red-500/30"; accentColor="bg-red-500"; IconComp = AlertCircle; } 
    else if (type === 'praise') { borderColor = "border-green-500/30"; accentColor="bg-green-500"; IconComp = Award; }
    else { borderColor = "border-blue-500/30"; accentColor = "bg-blue-500"; IconComp = Flame; }

    return (
        <div className={`bg-zinc-900/40 border ${borderColor} rounded-2xl p-6 h-full min-h-[180px] flex flex-col justify-center relative overflow-hidden backdrop-blur-md`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`}></div>
            <h3 className="text-[10px] font-black font-mono uppercase mb-3 flex items-center gap-2 tracking-widest text-zinc-400"><IconComp className="w-3 h-3" /> DIRETRIZ OPERACIONAL</h3>
            <p className="text-xl md:text-2xl font-bold text-white font-mono uppercase leading-tight tracking-tight">"{content}"</p>
        </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-mono uppercase text-white tracking-tighter">Central <span className="text-zinc-600">360°</span></h1>
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-wide">Quartel General • {user.name}</p>
        </div>
        <button onClick={onReset} className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase text-zinc-500 hover:text-white bg-zinc-900/50 border border-white/10 px-4 py-2.5 rounded-lg backdrop-blur-sm"><RefreshCw className="w-3 h-3"/> Recalibrar</button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">{renderOracleDecree()}</div>
          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Patente</p>
                      <div className="flex items-center gap-2"><Star className={`w-4 h-4 ${themeColor} fill-current`} /><span className="text-lg font-black text-white uppercase">{user.rank}</span></div>
                  </div>
                  <div className="text-right"><span className="text-4xl font-black text-zinc-200">{user.level}</span><span className="text-[9px] text-zinc-600 uppercase font-mono">Nível</span></div>
              </div>
              <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1.5"><span>Progresso</span><span className="text-white">{Math.floor(xpProgress)}%</span></div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 border border-white/5 overflow-hidden"><div className={`h-full rounded-full bg-red-600`} style={{ width: `${xpProgress}%` }}></div></div>
                  <p className="text-[9px] text-zinc-600 mt-1.5 font-mono text-right">Faltam {nextLevelXP - user.currentXP} XP</p>
              </div>
            </div>
            <MissionProgress />
          </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold font-mono uppercase text-zinc-400"><Shield className="w-4 h-4 inline mr-2" /> Protocolos de Proteção</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {user.activeModules.includes('soberano') ? <BusinessRoadmapWidget /> : <LockedModuleWidget moduleId='soberano' onUnlock={handleModuleUnlock} />}
            {user.activeModules.includes('tita') ? <BioShieldWidget /> : <LockedModuleWidget moduleId='tita' onUnlock={handleModuleUnlock} />}
            <LockedModuleWidget moduleId='sabio' onUnlock={handleModuleUnlock} />
            <LockedModuleWidget moduleId='lider' onUnlock={handleModuleUnlock} />
        </div>
      </div>
    </div>
  );
};

export default HeroicDashboard;