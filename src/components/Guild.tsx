import React, { useEffect, useState, useMemo, useRef } from 'react';
import { RankTitle, UserState, GuildPost, GuildChannelId, Archetype, Squad, SquadMember } from '../types';
import { Shield, Trophy, MessageSquare, Loader2, Sword, Skull, Sparkles, Crown, Star, Hexagon, Clock, Send, User as UserIcon, Hash, Flame, Zap, Plus, Lock, X, ChevronRight, Menu, Info, MessageCircle, ChevronDown, Users, Target, AlertCircle, Terminal, AlertTriangle, Briefcase, LogOut, CheckCircle, Heart } from 'lucide-react';
import { generateBossVictorySpeech, generateChannelInsightAI, generateGuildMemberReply } from '../services/geminiService';
import { GUILD_CHANNELS, ARCHETYPES, MIN_LEVEL_TO_CREATE_SQUAD, MAX_SQUAD_SIZE } from '../constants';
import { isToday } from '../utils';
import { useUser } from '../contexts/UserContext';
import { useError } from '../contexts/ErrorContext';

type BossType = 'daily' | 'weekly' | 'monthly';

interface BossData {
  name: string;
  hp: number;
  maxHp: number;
  active: boolean;
  rewardMultiplier: number;
}

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\.com|\.br|\.net|\.org)/i;
const PHONE_REGEX = /\b(\(?\d{2}\)?\s)?(\d{4,5}[-\s]?\d{4})\b/;
const HANDLE_REGEX = /@[a-zA-Z0-9_.]+/;

const initialBossesState: Record<BossType, BossData> = {
    daily: { name: 'O Monstro da Procrastinação', hp: 100, maxHp: 100, active: true, rewardMultiplier: 1 },
    weekly: { name: 'O Leviatã da Distração', hp: 500, maxHp: 500, active: true, rewardMultiplier: 5 },
    monthly: { name: 'O Titã da Mediocridade', hp: 2000, maxHp: 2000, active: true, rewardMultiplier: 20 }
};

const RankInsignia: React.FC<{ rank: RankTitle | string; size?: 'sm' | 'md' | 'lg' }> = ({ rank, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  const containerSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  
  let bgColor = "bg-zinc-800", iconColor = "text-zinc-400", borderColor = "border-zinc-700", Icon = Shield, SubIcon = null;

  switch (rank) {
    case RankTitle.Iniciante: iconColor = "text-zinc-500"; break;
    case RankTitle.Aventureiro: bgColor = "bg-green-900/30"; iconColor = "text-green-500"; borderColor = "border-green-800"; Icon = Hexagon; break;
    case RankTitle.Campeao: bgColor = "bg-blue-900/30"; iconColor = "text-blue-500"; borderColor = "border-blue-800"; SubIcon = Star; break;
    case RankTitle.Paladino: bgColor = "bg-purple-900/30"; iconColor = "text-purple-500"; borderColor = "border-purple-800"; SubIcon = Sword; break;
    case RankTitle.Lendario: bgColor = "bg-yellow-900/30"; iconColor = "text-yellow-500"; borderColor = "border-yellow-800"; Icon = Crown; break;
    case RankTitle.Divino: bgColor = "bg-gradient-to-br from-red-900/50 to-zinc-900"; iconColor = "text-red-500"; borderColor = "border-red-600"; Icon = Crown; SubIcon = Sparkles; break;
  }

  return (
    <div className={`relative flex items-center justify-center ${containerSize} rounded bg-opacity-50 border ${borderColor} ${bgColor}`} title={rank} aria-label={`Insígnia de ${rank}`}>
      <Icon className={`${sizeClass} ${iconColor}`} aria-hidden="true" />
      {SubIcon && <SubIcon className={`w-2 h-2 absolute ${iconColor} -bottom-1 -right-1`} aria-hidden="true" />}
    </div>
  );
};

const initialPosts: GuildPost[] = [
    { id: 'boss-sys-1', author: 'SISTEMA DE DEFESA', authorId: 'system', rank: RankTitle.Divino, content: '⚠️ INVASÃO DETECTADA: O Monstro da Procrastinação rompeu o perímetro.\nTodos os heróis devem engajar imediatamente.', channel: 'boss_strategy', likes: 0, reactions: { 'skull': 12, 'fire': 5 }, comments: [], timestamp: Date.now(), isSystem: true, action: 'attack_boss' },
    { id: 'st1', author: 'Comando Central', authorId: 'system', rank: RankTitle.Lendario, content: 'Bem-vindos à Guilda, Heróis. Este é o canal para comunicados e discussões gerais. Mantenham a disciplina.', channel: 'general', likes: 120, reactions: {'fire': 20, 'muscle': 15}, comments: [], timestamp: Date.now() - 86400000, isSystem: true },
    { id: 'st2', author: 'Alex O Bravo', authorId: 'user-alex', rank: RankTitle.Paladino, content: 'O dia começou antes do sol. 5km na conta. Quem está comigo?', channel: 'wins', likes: 45, likedBy: [], reactions: {'muscle': 12, 'fire': 8}, comments: [], timestamp: Date.now() - 3600000 },
];

const MOCK_LEADERBOARD = [
  { id: 1, name: 'Felipe Titã', rank: RankTitle.Divino, level: 60, archetype: 'O Governante' as Archetype, xp: 250000 },
  { id: 2, name: 'Ricardo M.', rank: RankTitle.Lendario, level: 48, archetype: 'O Sábio' as Archetype, xp: 180000 },
  { id: 3, name: 'Alex O Bravo', rank: RankTitle.Paladino, level: 35, archetype: 'O Herói' as Archetype, xp: 95000 },
];

const Guild: React.FC = () => {
  const { user, squads, handlePurchase, handleAscend, handlePunish, handleCreateSquad, handleJoinSquad, handleLeaveSquad, handleBossAttack } = useUser();
  const { showError } = useError();

  const [activeTab, setActiveTab] = useState<'channels' | 'squads'>('channels');
  const [activeChannel, setActiveChannel] = useState<GuildChannelId>('general');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<GuildPost[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [bosses, setBosses] = useState<Record<BossType, BossData>>(() => {
    const savedState = localStorage.getItem('hero_boss_state');
    if (!savedState) return initialBossesState;
    try { return JSON.parse(savedState).data; } catch { return initialBossesState; }
  });
  const [showCreateSquadModal, setShowCreateSquadModal] = useState(false);
  const [isBossSpeechGenerating, setIsBossSpeechGenerating] = useState(false);
  const [isSimulatingMember, setIsSimulatingMember] = useState(false);
  const [isSummoningInsight, setIsSummoningInsight] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  useEffect(() => { if (activeTab === 'channels') { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } }, [posts, activeChannel, activeTab]);
  useEffect(() => { localStorage.setItem('hero_boss_state', JSON.stringify({ lastUpdate: new Date().toISOString(), data: bosses })); }, [bosses]);

  const attackAvailable = useMemo(() => {
    const lastAttackTimestamp = user.lastBossAttacks?.['daily'];
    if (!lastAttackTimestamp) return true;
    return !isToday(lastAttackTimestamp);
  }, [user.lastBossAttacks]);
  
  const filteredPosts = posts.filter(p => p.channel === activeChannel);
  
  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId && !p.isSystem) {
          const likedBy = p.likedBy || [];
          const isLiked = likedBy.includes(user.uid);
          return {
            ...p,
            likes: isLiked ? p.likes - 1 : p.likes + 1,
            likedBy: isLiked ? likedBy.filter(id => id !== user.uid) : [...likedBy, user.uid]
          };
        }
        return p;
      })
    );
  };

  const handleSummonInsight = async () => {
      if (isSummoningInsight || !user.hasSubscription) return;
      setIsSummoningInsight(true);
      try {
          const insight = await generateChannelInsightAI(activeChannel, filteredPosts);
          const insightPost: GuildPost = {
              id: `insight-${Date.now()}`,
              author: 'Oráculo',
              authorId: 'system-oracle',
              rank: 'Mentor IA',
              content: insight,
              channel: activeChannel,
              likes: 0,
              reactions: { 'zap': 1 },
              comments: [],
              timestamp: Date.now(),
              isSystem: true,
          };
          setPosts(prev => [...prev, insightPost]);
      } catch (e: any) {
          showError(e.message || "Falha ao invocar o Oráculo.");
      } finally {
          setIsSummoningInsight(false);
      }
  };


  const handlePostSubmit = async () => {
      if (!newPostContent.trim()) return;
      const hasUrl = URL_REGEX.test(newPostContent), hasPhone = PHONE_REGEX.test(newPostContent), hasHandle = HANDLE_REGEX.test(newPostContent);
      const allowLinks = activeChannel === 'protection_360' && user.activeModules.includes('soberano');

      if ((hasUrl || hasPhone || hasHandle) && !allowLinks) {
          setNewPostContent('');
          const postContent = violationCount === 0 ? '⚠️ PROTOCOLO DE COMUNicação:\nA Guilda é um santuário hermético. Links externos, redes sociais (@) e telefones são proibidos para manter o foco absoluto.' : `🚫 INFRAÇÃO DETECTADA: Insistência em quebra de protocolo.\n\nPUNIÇÃO APLICADA: -50 XP.`;
          if (violationCount > 0) handlePunish(50);
          const sysPost: GuildPost = { id: `warn-${Date.now()}`, author: 'SISTEMA DE SEGURANÇA', authorId: 'system', rank: 'SENTINELA', content: postContent, channel: activeChannel, likes: 0, reactions: {}, comments: [], timestamp: Date.now(), isSystem: true };
          setPosts(prev => [...prev, sysPost]);
          setViolationCount(prev => prev + 1);
          return;
      }

      const post: GuildPost = { id: `post-${Date.now()}`, author: user.name, authorId: user.uid, rank: user.rank, content: newPostContent, channel: activeChannel, likes: 0, likedBy: [], reactions: {}, comments: [], timestamp: Date.now() };
      setPosts(prev => [...prev, post]);
      setNewPostContent('');

      if (user.hasSubscription && Math.random() > 0.3) {
          setIsSimulatingMember(true);
          setTimeout(async () => {
              try {
                  const simResponse = await generateGuildMemberReply(activeChannel, [...filteredPosts, post]);
                  if (simResponse) {
                      const replyPost: GuildPost = { id: `sim-${Date.now()}`, authorId: `sim-${Date.now()}`, author: simResponse.author, rank: simResponse.rank, content: simResponse.content, channel: activeChannel, likes: Math.floor(Math.random() * 5), likedBy: [], reactions: {}, comments: [], timestamp: Date.now() };
                      setPosts(prev => [...prev, replyPost]);
                  }
              } finally { setIsSimulatingMember(false); }
          }, 3000 + Math.random() * 4000);
      }
  };
  
  const SidebarNav = () => (
    <div className="space-y-6">
        <div>
            <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest font-mono mb-4 px-2">Comunicações</h2>
            <div className="space-y-1">
              {GUILD_CHANNELS.map(channel => {
                  const Icon = channel.icon, isActive = activeTab === 'channels' && activeChannel === channel.id, isLocked = channel.exclusiveModule && !user.activeModules.includes(channel.exclusiveModule);
                  return (
                      <button key={channel.id} onClick={() => { if (isLocked) { handlePurchase('protecao_360'); } else { setActiveTab('channels'); setActiveChannel(channel.id); setMobileMenuOpen(false); } }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' : isLocked ? 'opacity-50 cursor-pointer text-zinc-500 hover:bg-zinc-800/50' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}>
                          <div className="flex items-center gap-3"><Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : ''}`} /><p className={`text-sm font-mono font-bold uppercase ${isActive ? 'text-white' : 'text-zinc-400'}`}>{channel.name}</p></div>
                          {isLocked && <Lock className="w-3 h-3 text-zinc-600" />}
                      </button>
                  )
              })}
            </div>
        </div>
        <div>
            <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest font-mono mb-4 px-2">Operações</h2>
            <button onClick={() => { setActiveTab('squads'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'squads' ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}>
                <Users className={`w-4 h-4 ${activeTab === 'squads' ? 'text-yellow-500' : ''}`} /><p className={`text-sm font-mono font-bold uppercase ${activeTab === 'squads' ? 'text-white' : 'text-zinc-400'}`}>Esquadrões</p>
            </button>
        </div>
    </div>
  );

  const RightPanel = () => (
    <div className="space-y-6">
        {user.level >= 50 && (
            <div className={`bg-gradient-to-br from-red-900/50 to-zinc-900 border-2 rounded-xl p-4 text-center ${user.isAscended ? 'border-red-700/50' : 'border-yellow-500/50 animate-pulse'}`}>
                <Crown className={`w-8 h-8 mx-auto mb-2 ${user.isAscended ? 'text-red-500' : 'text-yellow-500'}`} />
                <h3 className="font-bold uppercase font-mono text-sm">{user.isAscended ? 'Herói Ascendido' : 'Ascensão Disponível'}</h3>
                {!user.isAscended ? ( <button onClick={() => handleAscend()} className="mt-3 w-full text-xs bg-yellow-500 text-black font-bold uppercase py-2 rounded">Ascender Agora</button>) : (<p className="text-xs text-zinc-400 mt-1">Multiplicador Panteão: {Math.floor(user.paragonPoints / 2) + 1}x</p>)}
            </div>
        )}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-fit">
          <h3 className="font-bold mb-4 flex items-center gap-2 uppercase font-mono text-sm text-zinc-400"> <Trophy className="w-4 h-4 text-yellow-500" /> Top Heróis </h3>
          <div className="space-y-3">
            {MOCK_LEADERBOARD.map((u, index) => <div key={u.id} className="flex items-center justify-between p-2 bg-zinc-950/50 rounded"> <div className="flex items-center gap-2"> <span className="text-sm font-bold text-zinc-600 font-mono">#{index + 1}</span> <div className="flex items-center gap-2"> <RankInsignia rank={u.rank as RankTitle} size="sm" /> <div> <p className="text-sm font-bold text-zinc-200">{u.name}</p> <p className="text-xs text-zinc-500">{u.rank}</p> </div> </div> </div> <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded">Nível {u.level}</span> </div>)}
            <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded border border-zinc-700 mt-4"> <div className="flex items-center gap-2"> <span className="text-sm font-bold text-zinc-500 font-mono">#99</span> <div className="flex items-center gap-2"> <RankInsignia rank={user.rank} size="sm" /> <div> <p className="text-sm font-bold text-white">Você</p> <p className="text-xs text-zinc-500">{user.rank}</p> </div> </div> </div> <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded">Nível {user.level}</span> </div>
          </div>
        </div>
    </div>
  );
  
  const SquadsTab = () => {
    const mySquads = squads.filter(s => user.joinedSquadIds.includes(s.id));
    const otherSquads = squads.filter(s => !user.joinedSquadIds.includes(s.id));
    const canCreate = user.level >= MIN_LEVEL_TO_CREATE_SQUAD;

    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold font-mono uppercase flex items-center gap-3"><Users className="w-6 h-6 text-yellow-500" /> Esquadrões de Elite</h2>
          <button onClick={() => setShowCreateSquadModal(true)} disabled={!canCreate} className="w-full sm:w-auto px-4 py-2.5 bg-yellow-600 text-black font-bold uppercase tracking-wider text-xs rounded transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed">
            {canCreate ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            Criar Esquadrão { !canCreate && `(Lvl ${MIN_LEVEL_TO_CREATE_SQUAD})`}
          </button>
        </div>
        
        {mySquads.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold font-mono uppercase text-sm text-zinc-400 border-l-2 border-yellow-500 pl-3">Meus Esquadrões</h3>
            {mySquads.map(squad => <SquadCard key={squad.id} squad={squad} isMember={true} onJoin={handleJoinSquad} onLeave={handleLeaveSquad} />)}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-bold font-mono uppercase text-sm text-zinc-400 border-l-2 border-zinc-600 pl-3">Recrutar</h3>
          {otherSquads.length > 0 ? (
            otherSquads.map(squad => <SquadCard key={squad.id} squad={squad} isMember={false} onJoin={handleJoinSquad} onLeave={handleLeaveSquad} />)
          ) : (
            <div className="text-center py-10 text-zinc-500 font-mono border border-zinc-800 border-dashed rounded-xl">Nenhum esquadrão disponível para recrutamento.</div>
          )}
        </div>

        {showCreateSquadModal && <CreateSquadModal onClose={() => setShowCreateSquadModal(false)} onCreate={handleCreateSquad} />}
      </div>
    );
  };
  
  const SquadCard: React.FC<{squad: Squad, isMember: boolean, onJoin: (id: string) => void, onLeave: (id: string) => void}> = ({ squad, isMember, onJoin, onLeave }) => (
    <div className={`bg-zinc-900 border rounded-xl p-4 ${isMember ? 'border-yellow-700/50' : 'border-zinc-800'}`}>
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-bold text-white font-mono flex items-center gap-2">{squad.name}</h4>
                <p className="text-xs text-zinc-400 italic mt-1">"{squad.motto}"</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-mono font-bold text-white">{squad.members.length} / {MAX_SQUAD_SIZE}</p>
                <p className="text-[10px] text-zinc-500">Membros</p>
            </div>
        </div>
        <div className="h-px bg-zinc-800 my-3"></div>
        <div className="flex justify-between items-center">
            <div className="text-xs text-zinc-500 font-mono flex items-center gap-2"><Crown className="w-3 h-3 text-yellow-500" /> Líder: <span className="text-zinc-300 font-bold">{squad.leaderName}</span></div>
            {isMember ? (
                <button onClick={() => onLeave(squad.id)} className="px-3 py-1.5 bg-red-900 text-red-300 text-[10px] font-bold uppercase rounded hover:bg-red-800">Sair</button>
            ) : (
                <button onClick={() => onJoin(squad.id)} disabled={squad.members.length >= MAX_SQUAD_SIZE} className="px-3 py-1.5 bg-green-900 text-green-300 text-[10px] font-bold uppercase rounded hover:bg-green-800 disabled:bg-zinc-800 disabled:text-zinc-500">Entrar</button>
            )}
        </div>
    </div>
  );

  const CreateSquadModal: React.FC<{onClose: () => void, onCreate: (name: string, motto: string) => void}> = ({ onClose, onCreate }) => {
      const [name, setName] = useState('');
      const [motto, setMotto] = useState('');

      const handleSubmit = () => {
          if (name.trim() && motto.trim()) {
              onCreate(name, motto);
              onClose();
          }
      };

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl p-6 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold font-mono uppercase mb-4">Forjar Novo Esquadrão</h3>
              <div className="space-y-4">
                  <div>
                      <label className="text-xs font-mono uppercase text-zinc-400">Nome do Esquadrão</label>
                      <input value={name} onChange={e => setName(e.target.value)} maxLength={30} className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded mt-1" />
                  </div>
                   <div>
                      <label className="text-xs font-mono uppercase text-zinc-400">Grito de Guerra (Motto)</label>
                      <input value={motto} onChange={e => setMotto(e.target.value)} maxLength={50} className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded mt-1" />
                  </div>
              </div>
              <div className="flex gap-4 mt-6">
                  <button onClick={onClose} className="flex-1 py-3 bg-zinc-800 rounded font-bold uppercase text-xs">Cancelar</button>
                  <button onClick={handleSubmit} disabled={!name.trim() || !motto.trim()} className="flex-1 py-3 bg-yellow-600 text-black rounded font-bold uppercase text-xs disabled:opacity-50">Confirmar</button>
              </div>
          </div>
        </div>
      )
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      <aside className="hidden md:block w-64 flex-shrink-0"><SidebarNav /></aside>

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-2 bg-zinc-900 border-b border-zinc-800 rounded-lg mb-4">
            <h2 className="text-lg font-bold font-mono uppercase text-white">{activeTab === 'channels' ? `# ${activeChannel}` : 'Esquadrões'}</h2>
            <button onClick={() => setMobileMenuOpen(true)}><Menu className="w-6 h-6"/></button>
        </div>

        {activeTab === 'channels' ? (
            <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                 <header className="p-3 border-b border-zinc-800 flex items-center justify-between gap-2">
                    <h3 className="font-bold font-mono uppercase text-white"># {activeChannel}</h3>
                    <button onClick={handleSummonInsight} disabled={isSummoningInsight || !user.hasSubscription} className="flex items-center gap-2 text-xs font-mono uppercase bg-zinc-800/70 text-zinc-300 px-3 py-1.5 rounded-md hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={!user.hasSubscription ? "Requer Assinatura Mentor IA" : "Invocar Oráculo"}>
                        {isSummoningInsight ? <Loader2 className="w-4 h-4 animate-spin"/> : <Terminal className="w-4 h-4"/>}
                        <span className="hidden sm:inline">Invocar Insight</span>
                    </button>
                 </header>
                 <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {filteredPosts.map(post => {
                        const isUserPost = post.authorId === user.uid;
                        const isOracle = post.author === 'Oráculo';
                        const isSecurity = post.author === 'SISTEMA DE SEGURANÇA';
                        const isLiked = post.likedBy?.includes(user.uid);

                        let postClasses = 'p-3 rounded-xl max-w-lg transition-colors ';
                        if (post.isSystem) {
                            postClasses += 'bg-zinc-950/70 border border-zinc-800 text-left w-full font-mono text-sm ';
                            if(isOracle) postClasses += 'border-l-4 border-yellow-500';
                            else if(isSecurity) postClasses += 'border-l-4 border-red-500';
                            else postClasses += 'border-l-4 border-zinc-600';
                        } else if (isUserPost) {
                            postClasses += 'bg-red-900/40 rounded-br-none';
                        } else {
                            postClasses += 'bg-zinc-950 border border-zinc-800 rounded-bl-none hover:bg-zinc-900';
                        }

                        return (
                            <div key={post.id} className={`flex gap-3 items-start ${isUserPost ? 'flex-row-reverse' : ''}`}>
                               {!post.isSystem && <RankInsignia rank={post.rank} />}
                               <div className={postClasses}>
                                   <div className="flex items-center gap-2 mb-1">
                                     <p className={`font-bold text-sm ${isOracle ? 'text-yellow-500' : isSecurity ? 'text-red-400' : 'text-white'}`}>{post.author}</p>
                                     <p className="text-xs text-zinc-500">{new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                   </div>
                                   <p className="text-zinc-300 whitespace-pre-wrap">{post.content}</p>
                                   {!post.isSystem && (
                                    <div className="mt-3">
                                        <button 
                                            onClick={() => handleLike(post.id)} 
                                            className={`flex items-center gap-1.5 text-xs group transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}
                                            aria-label="Curtir post"
                                        >
                                            <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-current' : ''}`} />
                                            <span className="font-mono font-bold w-6 text-left">{post.likes > 0 ? post.likes : ''}</span>
                                        </button>
                                    </div>
                                   )}
                               </div>
                            </div>
                        )
                    })}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                        <input value={newPostContent} onChange={e => setNewPostContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePostSubmit()} placeholder={`Mensagem em #${activeChannel}`} className="flex-1 bg-transparent focus:outline-none text-white" />
                        <button onClick={handlePostSubmit} disabled={!newPostContent.trim()} className="p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 disabled:opacity-50"><Send className="w-4 h-4 text-white"/></button>
                    </div>
                </div>
            </div>
        ) : (
            <SquadsTab />
        )}
      </main>

      <aside className="hidden lg:block w-72 flex-shrink-0"><RightPanel /></aside>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/80" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-64 bg-zinc-950 p-4 border-r border-zinc-800">
             <button onClick={() => setMobileMenuOpen(false)} className="absolute top-2 right-2 p-2"><X/></button>
             <SidebarNav />
          </div>
        </div>
      )}
    </div>
  );
};

export default Guild;
