import React, { useEffect, useState, useMemo, useRef } from 'react';
import { RankTitle, UserState, GuildPost, GuildChannelId, Archetype, Squad } from '../types';
import { Shield, Trophy, MessageSquare, Loader2, Sword, Skull, Sparkles, Crown, Star, Hexagon, Clock, Send, User as UserIcon, Hash, Flame, Zap, Plus, Lock, X, ChevronRight, Menu, Info, MessageCircle, ChevronDown, Users, Target, AlertCircle, Terminal, AlertTriangle, Briefcase } from 'lucide-react';
import { generateBossVictorySpeech, generateChannelInsightAI, generateGuildMemberReply } from '../services/geminiService';
import { GUILD_CHANNELS, ARCHETYPES } from '../constants';
import { getWeekStart, isToday } from '../utils';
import { useUser } from '../contexts/UserContext';

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

const RankInsignia: React.FC<{ rank: RankTitle; size?: 'sm' | 'md' | 'lg' }> = ({ rank, size = 'md' }) => {
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
    { id: 'boss-sys-1', author: 'SISTEMA DE DEFESA', rank: RankTitle.Divino, content: '⚠️ INVASÃO DETECTADA: O Monstro da Procrastinação rompeu o perímetro.\nTodos os heróis devem engajar imediatamente.', channel: 'boss_strategy', likes: 0, reactions: { 'skull': 12, 'fire': 5 }, comments: [], timestamp: Date.now(), isSystem: true, action: 'attack_boss' },
    { id: 'st1', author: 'Comando Central', rank: RankTitle.Lendario, content: 'Atenção, Guilda. O Monstro da Procrastinação foi avistado. Mobilização imediata.', channel: 'boss_strategy', likes: 120, reactions: {'fire': 20, '💪': 15}, comments: [], timestamp: Date.now() - 86400000, isSystem: true },
    { id: 'st2', author: 'Alex O Bravo', rank: RankTitle.Paladino, content: 'O dia começou antes do sol. 5km na conta. Quem está comigo?', channel: 'wins', likes: 45, reactions: {'💪': 12, '🔥': 8}, comments: [], timestamp: Date.now() - 3600000 },
];

const MOCK_LEADERBOARD = [
  { id: 1, name: 'Felipe Titã', rank: RankTitle.Divino, level: 60, archetype: 'O Governante' as Archetype, xp: 250000 },
  { id: 2, name: 'Ricardo M.', rank: RankTitle.Lendario, level: 48, archetype: 'O Sábio' as Archetype, xp: 180000 },
  { id: 3, name: 'Alex O Bravo', rank: RankTitle.Paladino, level: 35, archetype: 'O Herói' as Archetype, xp: 95000 },
];

const MAX_SQUAD_SIZE = 5;
const getMaxSquadsForLevel = (level: number) => Math.min(5, Math.floor(level / 10) + 1);
const MOCK_SQUADS: Squad[] = [ { id: 'sq-1', name: 'Vanguarda Estoica', motto: 'Suportar e Renunciar.', leaderId: '2', leaderName: 'Ricardo M.', members: [ { id: '2', name: 'Ricardo M.', rank: RankTitle.Lendario, level: 48, archetype: 'O Sábio' }, { id: '99', name: 'Membro 2', rank: RankTitle.Aventureiro, level: 12, archetype: 'O Inocente' } ], createdAt: Date.now() - 10000000 } ];

const Guild: React.FC = () => {
  const { user, handleUpgrade: onUpgrade, handleAscend, handleBossAttack, handlePunish, showError } = useUser();
  const { hasSubscription } = user;

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
  const [squads, setSquads] = useState<Squad[]>(() => {
      const saved = localStorage.getItem('hero_squads');
      return saved ? JSON.parse(saved) : MOCK_SQUADS;
  });
  const [newSquadName, setNewSquadName] = useState('');
  const [isCreatingSquad, setIsCreatingSquad] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isBossSpeechGenerating, setIsBossSpeechGenerating] = useState(false);
  const [isSimulatingMember, setIsSimulatingMember] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  useEffect(() => { localStorage.setItem('hero_squads', JSON.stringify(squads)); }, [squads]);
  useEffect(() => { if (activeTab === 'channels') { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } }, [posts, activeChannel, activeTab]);
  useEffect(() => { localStorage.setItem('hero_boss_state', JSON.stringify({ lastUpdate: new Date().toISOString(), data: bosses })); }, [bosses]);

  const attackAvailable = useMemo(() => {
    const lastAttackTimestamp = user.lastBossAttacks?.['daily'];
    if (!lastAttackTimestamp) return true;
    return !isToday(lastAttackTimestamp);
  }, [user.lastBossAttacks]);

  const handleAttackBoss = async () => {
    if (!attackAvailable || isBossSpeechGenerating) return;
    const bossType = 'daily';
    const currentBoss = bosses[bossType];
    if (currentBoss.hp > 0) {
      const damage = Math.max(1, Math.floor(user.level / 5) + 1);
      const newHp = Math.max(0, currentBoss.hp - damage);
      setBosses(prev => ({ ...prev, [bossType]: { ...prev[bossType], hp: newHp } }));
      handleBossAttack(bossType);

      if (newHp === 0) {
        setIsBossSpeechGenerating(true);
        try {
            const victoryMessage = await generateBossVictorySpeech(posts.slice(0,5), currentBoss.name);
            const victoryPost: GuildPost = { id: `sys-win-${Date.now()}`, author: 'CRÔNICAS DA GUILDA', rank: RankTitle.Lendario, content: victoryMessage, channel: 'boss_strategy', likes: 999, reactions: {'fire': 100}, comments: [], timestamp: Date.now(), isSystem: true };
            setPosts(prev => [...prev, victoryPost]);
            setTimeout(() => {
              const newMaxHp = Math.floor(currentBoss.maxHp * 1.1);
              setBosses(prev => ({ ...prev, [bossType]: { ...prev[bossType], hp: newMaxHp, maxHp: newMaxHp, name: `${prev[bossType].name.split(' (')[0]} (Lv. Up)` } }));
            }, 5000);
        } finally { setIsBossSpeechGenerating(false); }
      }
    }
  };

  const handleCreateSquad = () => { /* ... */ };
  const handleJoinSquad = (squadId: string) => { /* ... */ };
  
  const filteredPosts = posts.filter(p => p.channel === activeChannel);

  const handlePostSubmit = async () => {
      if (!newPostContent.trim()) return;
      const hasUrl = URL_REGEX.test(newPostContent), hasPhone = PHONE_REGEX.test(newPostContent), hasHandle = HANDLE_REGEX.test(newPostContent);
      const allowLinks = activeChannel === 'protection_360' && user.activeModules.includes('soberano');

      if ((hasUrl || hasPhone || hasHandle) && !allowLinks) {
          setNewPostContent('');
          const postContent = violationCount === 0 ? '⚠️ PROTOCOLO DE COMUNICAÇÃO:\nA Guilda é um santuário hermético. Links externos, redes sociais (@) e telefones são proibidos para manter o foco absoluto.' : `🚫 INFRAÇÃO DETECTADA: Insistência em quebra de protocolo.\n\nPUNIÇÃO APLICADA: -50 XP.`;
          if (violationCount > 0) handlePunish(50);
          const sysPost: GuildPost = { id: `warn-${Date.now()}`, author: 'SISTEMA DE SEGURANÇA', rank: 'SENTINELA', content: postContent, channel: activeChannel, likes: 0, reactions: {}, comments: [], timestamp: Date.now(), isSystem: true };
          setPosts(prev => [...prev, sysPost]);
          setViolationCount(prev => prev + 1);
          return;
      }

      const post: GuildPost = { id: `post-${Date.now()}`, author: user.name, rank: user.rank, content: newPostContent, channel: activeChannel, likes: 0, reactions: {}, comments: [], timestamp: Date.now() };
      setPosts(prev => [...prev, post]);
      setNewPostContent('');

      if (Math.random() > 0.3) {
          setIsSimulatingMember(true);
          setTimeout(async () => {
              try {
                  const simResponse = await generateGuildMemberReply(activeChannel, [...filteredPosts, post]);
                  if (simResponse) {
                      const replyPost: GuildPost = { id: `sim-${Date.now()}`, author: simResponse.author, rank: simResponse.rank, content: simResponse.content, channel: activeChannel, likes: Math.floor(Math.random() * 5), reactions: {}, comments: [], timestamp: Date.now() };
                      setPosts(prev => [...prev, replyPost]);
                  }
              } finally { setIsSimulatingMember(false); }
          }, 3000 + Math.random() * 4000);
      }
  };

  const handleReaction = (postId: string, emoji: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: { ...p.reactions, [emoji]: (p.reactions[emoji] || 0) + 1 } } : p));
  };

  const handleSummonOracle = async () => { /* ... */ };

  const SidebarNav = () => (
    <div className="space-y-6">
        <div>
            <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest font-mono mb-4 px-2">Comunicações</h2>
            <div className="space-y-1">
              {GUILD_CHANNELS.map(channel => {
                  const Icon = channel.icon, isActive = activeTab === 'channels' && activeChannel === channel.id, isLocked = channel.exclusiveModule && !user.activeModules.includes(channel.exclusiveModule);
                  return (
                      <button key={channel.id} onClick={() => { if (!isLocked) { setActiveTab('channels'); setActiveChannel(channel.id); setMobileMenuOpen(false); } }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' : isLocked ? 'opacity-50 cursor-not-allowed text-zinc-500' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}>
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

  const RightPanel = () => ( <div className="space-y-6">{/* ... */}</div> );

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      <aside className="hidden md:block w-64 flex-shrink-0"><SidebarNav /></aside>
      <main className="flex-1 min-w-0 flex flex-col">{/* ... Main content based on activeTab */}</main>
      <aside className="hidden lg:block w-72 flex-shrink-0"><RightPanel /></aside>
      {mobileMenuOpen && ( <div className="md:hidden fixed inset-0 z-50 flex">{/* Mobile Sidebar */}</div> )}
    </div>
  );
};

export default Guild;
