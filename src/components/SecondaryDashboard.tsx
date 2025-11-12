import React from 'react';
import { ProtectionModuleId, RoadmapItem, BioData, FocusSession, DailyIntention, KeyConnection } from '../types';
import { PROTECTION_MODULES } from '../constants';
import { RefreshCw, Shield, Briefcase, Activity, CheckCircle, Plus, Lock, Dumbbell, Moon, Droplets, Trash2, Bot, Target, Check, Brain, Zap, HeartHandshake, Compass } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

// --- WIDGETS MOVIDOS PARA CARREGAMENTO ASSÍNCRONO ---

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

const FocusWidget = () => {
    const { user, handleUpdateUser } = useUser();
    const history = user.focusHistory || [];
    const toggle = (id: string) => handleUpdateUser({ focusHistory: history.map(s => s.id === id ? {...s, completed: !s.completed} : s) });

    return (
        <div className="bg-zinc-900/40 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md h-full flex flex-col">
            <h2 className="text-sm font-bold font-mono uppercase text-blue-500 flex items-center gap-2 mb-4"><Brain className="w-4 h-4" /> SÁBIO (Foco)</h2>
             <div className="space-y-2 mb-4 flex-grow overflow-y-auto pr-2 min-h-[100px]">
                {history.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500"><Target className="w-6 h-6 mb-2 mx-auto"/><p className="text-xs font-mono">Nenhuma sessão de foco registrada.</p></div>
                ) : (
                    history.map(session => (
                        <div key={session.id} onClick={() => toggle(session.id)} className={`p-2 rounded border flex items-center gap-3 cursor-pointer ${session.completed ? 'bg-blue-900/10 border-blue-900/20 opacity-60' : 'bg-black/40 border-white/5'}`}>
                            <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${session.completed ? 'bg-blue-600 border-blue-600' : 'border-zinc-600'}`}>
                                {session.completed && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <span className="text-xs font-mono text-zinc-200">{session.task} ({session.duration} min)</span>
                        </div>
                    ))
                )}
             </div>
             <button onClick={() => handleUpdateUser({focusHistory: [...history, {id: Date.now().toString(), task: 'Nova Sessão de Foco', duration: 25, completed: false}]})} className="w-full text-center text-xs bg-white/10 text-white px-4 py-2 rounded font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                Adicionar Sessão
            </button>
        </div>
    );
};

const IntentionWidget = () => {
    const { user, handleUpdateUser } = useUser();
    const [text, setText] = React.useState(user.dailyIntention?.text || '');
    const hasIntention = !!user.dailyIntention;
    
    const handleSet = () => {
        if(text.trim()) {
            handleUpdateUser({ dailyIntention: { id: new Date().toISOString().split('T')[0], text, completed: false } });
        }
    };
    const handleComplete = () => {
        if(user.dailyIntention) {
            handleUpdateUser({ dailyIntention: { ...user.dailyIntention, completed: true } });
        }
    };

    return (
        <div className="bg-zinc-900/40 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-md h-full flex flex-col justify-center">
            <h2 className="text-sm font-bold font-mono uppercase text-purple-500 flex items-center gap-2 mb-4"><Zap className="w-4 h-4" /> MONGE (Intenção)</h2>
            {!hasIntention ? (
                <div className="flex gap-2">
                    <input value={text} onChange={e => setText(e.target.value)} placeholder="Intenção do Dia..." className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-xs font-mono placeholder:text-zinc-600" onKeyDown={e => e.key === 'Enter' && handleSet()}/>
                    <button onClick={handleSet} className="bg-purple-600 text-white px-3 rounded"><Plus className="w-4 h-4"/></button>
                </div>
            ) : (
                <div className="text-center cursor-pointer" onClick={handleComplete}>
                    <p className={`text-lg font-bold text-white mb-2 ${user.dailyIntention?.completed ? 'line-through text-zinc-500' : ''}`}>{user.dailyIntention?.text}</p>
                    <div className={`text-xs uppercase font-bold flex items-center justify-center gap-2 ${user.dailyIntention?.completed ? 'text-green-500' : 'text-zinc-400'}`}>
                        {user.dailyIntention?.completed ? <CheckCircle className="w-4 h-4"/> : <div className="w-4 h-4 border-2 border-zinc-600 rounded-full"/>}
                        {user.dailyIntention?.completed ? 'Concluído' : 'Marcar como Concluído'}
                    </div>
                </div>
            )}
        </div>
    );
};

const ConnectionsWidget = () => {
    const { user, handleUpdateUser } = useUser();
    const connections = user.keyConnections || [];
    
    const toggle = (id: string) => handleUpdateUser({keyConnections: connections.map(c => c.id === id ? {...c, completed: !c.completed} : c)});

    return (
        <div className="bg-zinc-900/40 border border-pink-500/20 rounded-2xl p-6 backdrop-blur-md h-full flex flex-col">
            <h2 className="text-sm font-bold font-mono uppercase text-pink-500 flex items-center gap-2 mb-4"><HeartHandshake className="w-4 h-4" /> LÍDER (Conexões)</h2>
             <div className="space-y-2 flex-grow overflow-y-auto pr-2 min-h-[100px]">
                 {connections.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500"><Target className="w-6 h-6 mb-2 mx-auto"/><p className="text-xs font-mono">Mapeie suas conexões chave.</p></div>
                ) : (
                    connections.map(c => (
                        <div key={c.id} onClick={() => toggle(c.id)} className={`p-2 rounded border flex items-center gap-3 cursor-pointer ${c.completed ? 'bg-pink-900/10 border-pink-900/20 opacity-60' : 'bg-black/40 border-white/5'}`}>
                             <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${c.completed ? 'bg-pink-600 border-pink-600' : 'border-zinc-600'}`}>
                                {c.completed && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <span className={`text-xs font-mono ${c.completed ? 'text-zinc-500' : 'text-zinc-200'}`}>{c.name}</span>
                        </div>
                    ))
                 )}
             </div>
             <button onClick={() => handleUpdateUser({keyConnections: [...connections, {id: Date.now().toString(), name: 'Nova Conexão', completed: false}]})} className="w-full text-center text-xs bg-white/10 text-white px-4 py-2 rounded font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors mt-4">
                Adicionar Conexão
            </button>
        </div>
    );
};

const TacticalMapWidget: React.FC<{ onRecalibrate: () => void }> = ({ onRecalibrate }) => {
    return (
        <div className="bg-zinc-900/40 border border-zinc-700/50 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-sm font-bold font-mono uppercase text-zinc-400 flex items-center gap-2 mb-4"><Compass className="w-4 h-4"/> Mapeamento Tático</h2>
            <p className="text-xs text-zinc-500 mb-4">Ganhe clareza e XP aprofundando o mapeamento de cada área da sua vida. O Oráculo recomenda uma recalibração completa a cada 90 dias para ajustar sua estratégia.</p>
            <button onClick={onRecalibrate} className="w-full text-center text-xs bg-white/10 text-white px-4 py-3 rounded font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4"/> Iniciar Recalibração Completa
            </button>
        </div>
    )
};

const SecondaryDashboard: React.FC<{ onRecalibrate: () => void }> = ({ onRecalibrate }) => {
    const { user, handleUpgrade } = useUser();
    const handleModuleUnlock = (moduleId: ProtectionModuleId) => handleUpgrade('protecao_360');

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="space-y-4">
                <h3 className="text-sm font-bold font-mono uppercase text-zinc-400"><Shield className="w-4 h-4 inline mr-2" /> Protocolos de Proteção</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {user.activeModules.includes('soberano') ? <BusinessRoadmapWidget /> : <LockedModuleWidget moduleId='soberano' onUnlock={handleModuleUnlock} />}
                    {user.activeModules.includes('tita') ? <BioShieldWidget /> : <LockedModuleWidget moduleId='tita' onUnlock={handleModuleUnlock} />}
                    {user.activeModules.includes('sabio') ? <FocusWidget /> : <LockedModuleWidget moduleId='sabio' onUnlock={handleModuleUnlock} />}
                    {user.activeModules.includes('monge') ? <IntentionWidget /> : <LockedModuleWidget moduleId='monge' onUnlock={handleModuleUnlock} />}
                    {user.activeModules.includes('lider') ? <ConnectionsWidget /> : <LockedModuleWidget moduleId='lider' onUnlock={handleModuleUnlock}/>}
                </div>
            </div>
            <TacticalMapWidget onRecalibrate={onRecalibrate} />
        </div>
    );
};

export default SecondaryDashboard;