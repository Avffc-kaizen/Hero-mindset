import React, { useState, useEffect } from 'react';
import { ProtectionModuleId, RoadmapItem, BioData, DailyIntention } from '../types';
import { PROTECTION_MODULES, ARCHETYPES } from '../constants';
import { Award, Zap, RefreshCw, Star, AlertCircle, Flame, Shield, Briefcase, Activity, TrendingUp, CheckCircle, Plus, Lock, Dumbbell, Moon, Droplets, Trash2, Bot, Target, Check, AlertTriangle, Send, Loader2, X } from 'lucide-react';
// FIX: Corrected relative import paths.
import { XP_PER_LEVEL_FORMULA } from '../src/utils';
import { useUser } from '../contexts/UserContext';
import { useError } from '../contexts/ErrorContext';
// FIX: Changed to named import for MissionProgress to resolve module loading error.
import { MissionProgress } from './MissionProgress';
import LifeMapWidget from './LifeMapWidget';
import LiteYouTubeEmbed from './LiteYouTubeEmbed';
import MissionCalendarWidget from './MissionCalendarWidget';


// --- MODULAR WIDGETS ---

const QuickChatWidget: React.FC = () => {
    const { user, handleSendMentorMessage } = useUser();
    const { showError } = useError();
    const [input, setInput] = useState('');
    const [lastResponse, setLastResponse] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;
        setIsSending(true);
        const question = input;
        setInput('');
        setLastResponse('');
        try {
            await handleSendMentorMessage(question, true); // `true` to indicate it's a quick chat
        } catch (err: any) {
            showError(err.message || 'Erro ao contatar o Oráculo.');
            setInput(question); // Add message back to input
        } finally {
            setIsSending(false);
        }
    };
    
    const lastUserMessage = user.mentorChatHistory.filter(m => m.role === 'user' && m.isQuickChat).slice(-1)[0];
    const lastModelMessage = user.mentorChatHistory.filter(m => m.role === 'model' && m.isQuickChat).slice(-1)[0];
    
    if (!user.hasSubscription) return null;

    return (
        <div className="bg-zinc-900/40 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md h-full flex flex-col">
            <h2 className="text-sm font-bold font-mono uppercase text-blue-500 flex items-center gap-2 mb-4"><Bot className="w-4 h-4" /> Chat Rápido com Oráculo</h2>
            <div className="flex-grow space-y-2 mb-4 overflow-y-auto text-sm">
                 {isSending && <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-blue-400"/></div>}
                 {!isSending && lastUserMessage && (
                     <p className="text-zinc-400 font-mono text-xs">Você: "{lastUserMessage.text}"</p>
                 )}
                 {!isSending && lastModelMessage && (
                     <p className="text-blue-200">{lastModelMessage.text}</p>
                 )}
                  {!isSending && !lastUserMessage && (
                    <p className="text-zinc-500 text-center text-xs font-mono pt-4">Faça uma pergunta direta ao seu mentor.</p>
                  )}
            </div>
            <div className="flex items-center gap-2 mt-auto">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Sua pergunta..."
                    className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-sm font-mono placeholder:text-zinc-600"
                    disabled={isSending}
                />
                <button onClick={handleSend} disabled={isSending || !input.trim()} className="p-2 bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50">
                    <Send className="w-4 h-4 text-white"/>
                </button>
            </div>
        </div>
    );
};


const DailyIntentionWidget = () => {
    const { user, handleUpdateUser } = useUser();
    const [text, setText] = useState('');

    const todayStr = new Date().toISOString().split('T')[0];
    const intentionForToday = user.dailyIntention && user.dailyIntention.id === todayStr;

    const handleSet = () => {
        if (text.trim()) {
            handleUpdateUser({
                dailyIntention: {
                    id: todayStr,
                    text: text.trim(),
                    completed: false
                }
            });
            setText('');
        }
    };

    const handleToggle = () => {
        if (user.dailyIntention && intentionForToday) {
            handleUpdateUser({
                dailyIntention: { ...user.dailyIntention, completed: !user.dailyIntention.completed }
            });
        }
    };

    return (
        <div className="bg-zinc-900/40 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-md h-full flex flex-col justify-center">
            <h2 className="text-sm font-bold font-mono uppercase text-purple-500 flex items-center gap-2 mb-4"><Zap className="w-4 h-4" /> Intenção Única Diária</h2>
            {!intentionForToday ? (
                <div className="flex gap-2 animate-in fade-in">
                    <input 
                        value={text} 
                        onChange={e => setText(e.target.value)} 
                        placeholder="Qual é a sua missão mais importante hoje?" 
                        className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-sm font-mono placeholder:text-zinc-600" 
                        onKeyDown={e => e.key === 'Enter' && handleSet()}
                    />
                    <button onClick={handleSet} className="bg-purple-600 text-white px-4 rounded font-bold uppercase text-xs tracking-wider hover:bg-purple-500 transition-colors">Definir</button>
                </div>
            ) : (
                <div className="flex items-center gap-4 cursor-pointer group animate-in fade-in" onClick={handleToggle}>
                    <div className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${user.dailyIntention?.completed ? 'bg-purple-600 border-purple-500' : 'border-zinc-600 group-hover:border-purple-400'}`}>
                        {user.dailyIntention?.completed && <Check className="w-5 h-5 text-white" />}
                    </div>
                    <p className={`text-lg font-bold text-white transition-all ${user.dailyIntention?.completed ? 'line-through text-zinc-500' : ''}`}>{user.dailyIntention?.text}</p>
                </div>
            )}
        </div>
    );
};

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
  const { user, handleRedoDiagnosis, handlePurchase, isProcessingPayment } = useUser();
  const [showRecalibrateModal, setShowRecalibrateModal] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  useEffect(() => {
    const hasSeenBanner = localStorage.getItem('heroWelcomeBannerDismissed');
    if (!hasSeenBanner) {
        setShowWelcomeBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
      setShowWelcomeBanner(false);
      localStorage.setItem('heroWelcomeBannerDismissed', 'true');
  };
  
  if (!user.archetype || !user.lifeMapScores) return null;

  const themeColor = "text-red-500"; 
  const nextLevelXP = XP_PER_LEVEL_FORMULA(user.level);
  const xpProgress = nextLevelXP > 0 ? (user.currentXP / nextLevelXP) * 100 : 0;
  const xpRemaining = nextLevelXP > 0 ? Math.max(0, nextLevelXP - user.currentXP) : 0;


  const handleModuleUnlock = (moduleId: ProtectionModuleId) => handlePurchase('plano_heroi_total');

  const onConfirmRecalibrate = () => {
    handleRedoDiagnosis();
    setShowRecalibrateModal(false);
  };

  const renderOracleDecree = () => {
    if (!user.hasSubscription) {
      return (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center h-full min-h-[180px] group hover:border-zinc-700 backdrop-blur-md">
            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 border border-white/5"><Lock className="w-5 h-5 text-zinc-500" /></div>
            <h2 className="text-xs font-bold font-mono uppercase text-zinc-400 mb-1">Link Neural Inativo</h2>
            <p className="text-[10px] text-zinc-500 mb-4">O Oráculo requer o Plano Herói Total.</p>
            <button 
              onClick={() => handlePurchase('plano_heroi_total')} 
              disabled={!!isProcessingPayment}
              className="text-[10px] bg-white text-black px-5 py-2.5 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 shadow-lg disabled:opacity-50 flex items-center justify-center"
            >
              {isProcessingPayment === 'plano_heroi_total' ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Ativar Plano Total'}
            </button>
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
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-wide">Bem-vindo, {user.archetype ? ` ${user.archetype}` : user.name}. Lema: {user.archetype ? `"${ARCHETYPES[user.archetype]?.motto || 'Execute.'}"` : 'Execute.'}</p>
        </div>
        <button onClick={() => setShowRecalibrateModal(true)} className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase text-zinc-500 hover:text-white bg-zinc-900/50 border border-white/10 px-4 py-2.5 rounded-lg backdrop-blur-sm"><RefreshCw className="w-3 h-3"/> Recalibrar</button>
      </header>

      {showWelcomeBanner && (
        <div className="relative bg-gradient-to-r from-zinc-900 via-zinc-950 to-black border border-yellow-500/30 rounded-xl p-6 animate-in fade-in shadow-lg shadow-yellow-500/10">
            <button onClick={handleDismissBanner} className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors" aria-label="Dispensar banner">
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
                <Shield className="w-10 h-10 text-yellow-500 flex-shrink-0 animate-pulse" />
                <div>
                    <h2 className="text-lg font-bold font-mono text-white">Bem-vindo de volta, Herói.</h2>
                    <p className="text-zinc-400 text-sm mt-1">Sua central de comando está operacional. Execute sua missão diária e avance em sua jornada.</p>
                </div>
            </div>
        </div>
      )}

      <div className="p-1 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-2xl animate-in fade-in">
        <div className="bg-zinc-950 rounded-xl p-1">
          <div className="aspect-video w-full relative">
             <LiteYouTubeEmbed videoId="cWrWyPtsllM" title="Comunicado do Comando" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {renderOracleDecree()}
            <DailyIntentionWidget />
            <QuickChatWidget />
            <LifeMapWidget />
          </div>
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
                  <p className="text-[9px] text-zinc-600 mt-1.5 font-mono text-right">Faltam {xpRemaining} XP</p>
              </div>
            </div>
            <MissionProgress />
            <MissionCalendarWidget />
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

      {showRecalibrateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-zinc-950 border border-yellow-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-yellow-500 mb-2 font-mono flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Confirmação Necessária</h2>
            <p className="text-zinc-400 mb-6 text-sm">Tem certeza de que deseja recalibrar seu Mapeamento 360? Você precisará refazer o diagnóstico para definir um novo arquétipo e áreas de foco.</p>
            <div className="flex gap-4">
                <button onClick={() => setShowRecalibrateModal(false)} className="flex-1 py-3 bg-zinc-800 rounded font-bold uppercase text-xs hover:bg-zinc-700">Cancelar</button>
                <button onClick={onConfirmRecalibrate} className="flex-1 py-3 bg-yellow-600 text-black rounded font-bold uppercase text-xs hover:bg-yellow-500">Confirmar Recalibração</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroicDashboard;