
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { RankTitle, UserState, GuildPost, GuildChannelId, Archetype, Squad } from '../types';
import { Shield, Trophy, MessageSquare, Loader2, Sword, Skull, Sparkles, Crown, Star, Hexagon, Clock, Send, User as UserIcon, Hash, Flame, Zap, Plus, Lock, X, ChevronRight, Menu, Info, MessageCircle, ChevronDown, Users, Target, AlertCircle, Terminal, AlertTriangle, Briefcase } from 'lucide-react';
import { generateBossVictorySpeech, generateChannelInsightAI, generateGuildMemberReply } from '../services/geminiService';
import { GUILD_CHANNELS, ARCHETYPES } from '../constants';

interface GuildProps {
  hasSubscription: boolean;
  onUpgrade: () => void;
  user: UserState;
  onAscend: () => void;
  onBossAttack: (type: 'daily' | 'weekly' | 'monthly') => void;
  onPunish: (amount: number) => void;
}

type BossType = 'daily' | 'weekly' | 'monthly';

interface BossData {
  name: string;
  hp: number;
  maxHp: number;
  active: boolean;
  rewardMultiplier: number;
}

// --- CONSTANTS FOR MODERATION ---
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\.com|\.br|\.net|\.org)/i;
const PHONE_REGEX = /\b(\(?\d{2}\)?\s)?(\d{4,5}[-\s]?\d{4})\b/; // Captures formats like 11 99999-9999, 9999-9999
const HANDLE_REGEX = /@[a-zA-Z0-9_.]+/; // Captures @handles

const initialBossesState: Record<BossType, BossData> = {
    daily: { name: 'O Monstro da Procrastinação', hp: 100, maxHp: 100, active: true, rewardMultiplier: 1 },
    weekly: { name: 'O Leviatã da Distração', hp: 500, maxHp: 500, active: true, rewardMultiplier: 5 },
    monthly: { name: 'O Titã da Mediocridade', hp: 2000, maxHp: 2000, active: true, rewardMultiplier: 20 }
};

const RankInsignia: React.FC<{ rank: RankTitle; size?: 'sm' | 'md' | 'lg' }> = ({ rank, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  const containerSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  
  let bgColor = "bg-zinc-800";
  let iconColor = "text-zinc-400";
  let borderColor = "border-zinc-700";
  let Icon = Shield;
  let SubIcon = null;

  switch (rank) {
    case RankTitle.Iniciante:
      bgColor = "bg-zinc-800"; iconColor = "text-zinc-500"; borderColor = "border-zinc-700"; Icon = Shield;
      break;
    case RankTitle.Aventureiro:
      bgColor = "bg-green-900/30"; iconColor = "text-green-500"; borderColor = "border-green-800"; Icon = Hexagon;
      break;
    case RankTitle.Campeao:
      bgColor = "bg-blue-900/30"; iconColor = "text-blue-500"; borderColor = "border-blue-800"; Icon = Shield; SubIcon = Star;
      break;
    case RankTitle.Paladino:
      bgColor = "bg-purple-900/30"; iconColor = "text-purple-500"; borderColor = "border-purple-800"; Icon = Shield; SubIcon = Sword;
      break;
    case RankTitle.Lendario:
      bgColor = "bg-yellow-900/30"; iconColor = "text-yellow-500"; borderColor = "border-yellow-800"; Icon = Crown;
      break;
    case RankTitle.Divino:
      bgColor = "bg-gradient-to-br from-red-900/50 to-zinc-900"; iconColor = "text-red-500"; borderColor = "border-red-600"; Icon = Crown; SubIcon = Sparkles;
      break;
  }

  return (
    <div className={`relative flex items-center justify-center ${containerSize} rounded bg-opacity-50 border ${borderColor} ${bgColor}`} title={rank} aria-label={`Insígnia de ${rank}`}>
      <Icon className={`${sizeClass} ${iconColor}`} aria-hidden="true" />
      {SubIcon && <SubIcon className={`w-2 h-2 absolute ${iconColor} -bottom-1 -right-1`} aria-hidden="true" />}
    </div>
  );
};

const initialPosts: GuildPost[] = [
    { 
      id: 'boss-sys-1', 
      author: 'SISTEMA DE DEFESA', 
      rank: RankTitle.Divino, 
      content: '⚠️ INVASÃO DETECTADA: O Monstro da Procrastinação rompeu o perímetro.\nTodos os heróis devem engajar imediatamente.', 
      channel: 'boss_strategy', 
      likes: 0, 
      reactions: { 'skull': 12, 'fire': 5 }, 
      comments: [], 
      timestamp: Date.now(), 
      isSystem: true,
      action: 'attack_boss'
    },
    { id: 'st1', author: 'Comando Central', rank: RankTitle.Lendario, content: 'Atenção, Guilda. O Monstro da Procrastinação foi avistado. Mobilização imediata.', channel: 'boss_strategy', likes: 120, reactions: {'fire': 20, '💪': 15}, comments: [], timestamp: Date.now() - 86400000, isSystem: true },
    { id: 'st2', author: 'Alex O Bravo', rank: RankTitle.Paladino, content: 'O dia começou antes do sol. 5km na conta. Quem está comigo?', channel: 'wins', likes: 45, reactions: {'💪': 12, '🔥': 8}, comments: [], timestamp: Date.now() - 3600000 },
    { id: 'st3', author: 'Iniciante Corajoso', rank: RankTitle.Iniciante, content: 'Estou com dificuldade para manter o foco na leitura. Alguma dica?', channel: 'support', likes: 5, reactions: {'🧠': 2}, comments: [], timestamp: Date.now() - 1800000 },
    { id: 'st4', author: 'Marcus Aurelius', rank: RankTitle.Campeao, content: 'O Codex Módulo 2 é brutal, mas necessário. A disciplina é a chave.', channel: 'general', likes: 22, reactions: {'🔥': 5}, comments: [], timestamp: Date.now() - 7200000 },
    { id: 'st5', author: 'CEO Visionário', rank: RankTitle.Divino, content: 'Relatório: Fechamos contrato com multinacional. Estratégia de Negociação Assimétrica validada. #Sucesso360', channel: 'protection_360', likes: 10, reactions: {'🚀': 5}, comments: [], timestamp: Date.now() - 1000000 },
];

const MOCK_LEADERBOARD = [
  { id: 1, name: 'Felipe Titã', rank: RankTitle.Divino, level: 60, archetype: 'O Governante' as Archetype, xp: 250000 },
  { id: 2, name: 'Ricardo M.', rank: RankTitle.Lendario, level: 48, archetype: 'O Sábio' as Archetype, xp: 180000 },
  { id: 3, name: 'Alex O Bravo', rank: RankTitle.Paladino, level: 35, archetype: 'O Herói' as Archetype, xp: 95000 },
  { id: 4, name: 'Sarah Connor', rank: RankTitle.Campeao, level: 22, archetype: 'O Fora-da-lei' as Archetype, xp: 45000 },
  { id: 5, name: 'Neo Anderson', rank: RankTitle.Aventureiro, level: 12, archetype: 'O Mago' as Archetype, xp: 15000 },
];

// --- SQUAD CONSTANTS & HELPERS ---
const MAX_SQUAD_SIZE = 5;

const getMaxSquadsForLevel = (level: number) => {
    // 1-9: 1, 10-19: 2, 20-29: 3, 30-39: 4, 40+: 5
    return Math.min(5, Math.floor(level / 10) + 1);
};

const MOCK_SQUADS: Squad[] = [
    {
        id: 'sq-1',
        name: 'Vanguarda Estoica',
        motto: 'Suportar e Renunciar.',
        leaderId: '2',
        leaderName: 'Ricardo M.',
        members: [
            { id: '2', name: 'Ricardo M.', rank: RankTitle.Lendario, level: 48, archetype: 'O Sábio' },
            { id: '99', name: 'Membro 2', rank: RankTitle.Aventureiro, level: 12, archetype: 'O Inocente' },
            { id: '100', name: 'Membro 3', rank: RankTitle.Campeao, level: 20, archetype: 'O Herói' },
        ],
        createdAt: Date.now() - 10000000
    },
    {
        id: 'sq-2',
        name: 'Lobos da Manhã',
        motto: 'O sol nasce para quem corre.',
        leaderId: '3',
        leaderName: 'Alex O Bravo',
        members: [
            { id: '3', name: 'Alex O Bravo', rank: RankTitle.Paladino, level: 35, archetype: 'O Herói' },
            { id: '101', name: 'Membro 4', rank: RankTitle.Iniciante, level: 5, archetype: 'O Explorador' }
        ],
        createdAt: Date.now() - 5000000
    }
];

const Guild: React.FC<GuildProps> = ({ hasSubscription, onUpgrade, user, onAscend, onBossAttack, onPunish }) => {
  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<'channels' | 'squads'>('channels');
  const [activeChannel, setActiveChannel] = useState<GuildChannelId>('general');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Data State
  const [posts, setPosts] = useState<GuildPost[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [bosses, setBosses] = useState<Record<BossType, BossData>>(() => {
    const savedState = localStorage.getItem('hero_boss_state');
    if (!savedState) return initialBossesState;
    try { return JSON.parse(savedState).data; } catch { return initialBossesState; }
  });
  
  // Squad State - Persisted
  const [squads, setSquads] = useState<Squad[]>(() => {
      const saved = localStorage.getItem('hero_squads');
      return saved ? JSON.parse(saved) : MOCK_SQUADS;
  });
  const [newSquadName, setNewSquadName] = useState('');
  const [isCreatingSquad, setIsCreatingSquad] = useState(false);

  // AI Features State
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isBossSpeechGenerating, setIsBossSpeechGenerating] = useState(false);
  const [isSimulatingMember, setIsSimulatingMember] = useState(false);

  // Moderation State
  const [violationCount, setViolationCount] = useState(0);

  // Persist Squads
  useEffect(() => {
      localStorage.setItem('hero_squads', JSON.stringify(squads));
  }, [squads]);

  // Check for Subscription Loss -> Collapse Squads
  useEffect(() => {
    if (!hasSubscription) {
        const userLedSquads = squads.filter(s => s.leaderName === user.name); // Simple check by name
        
        if (userLedSquads.length > 0) {
            // User lost subscription, collapse their squads
            const idsToRemove = userLedSquads.map(s => s.id);
            setSquads(prev => prev.filter(s => !idsToRemove.includes(s.id)));
            
            userLedSquads.forEach(squad => {
                const bossMessage: GuildPost = {
                    id: `boss-collapse-${Date.now()}-${Math.random()}`,
                    author: bosses.daily.name,
                    rank: 'INIMIGO',
                    content: `A estrutura "${squad.name}" colapsou. O líder ${squad.leaderName} perdeu a conexão neural (IA) necessária. Fraqueza punida.`,
                    channel: 'general',
                    likes: 0,
                    reactions: {'skull': 66},
                    comments: [],
                    timestamp: Date.now(),
                    isSystem: true
                };
                setPosts(prev => [bossMessage, ...prev]);
            });
        }
    }
  }, [hasSubscription, squads, user.name, bosses.daily.name]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (activeTab === 'channels') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [posts, activeChannel, activeTab]);

  // --- Boss Logic ---
  useEffect(() => {
    localStorage.setItem('hero_boss_state', JSON.stringify({ lastUpdate: new Date().toISOString(), data: bosses }));
  }, [bosses]);

  const attackAvailable = useMemo(() => {
    const lastAttackTimestamp = user.lastBossAttacks?.['daily'];
    if (!lastAttackTimestamp) return true;
    const lastAttackDate = new Date(lastAttackTimestamp);
    const today = new Date();
    return lastAttackDate.getUTCDate() !== today.getUTCDate();
  }, [user.lastBossAttacks]);

  const handleAttackBoss = async () => {
    if (!attackAvailable || isBossSpeechGenerating) return;
    const bossType = 'daily';
    const currentBoss = bosses[bossType];
    if (currentBoss.hp > 0) {
      const damage = Math.max(1, Math.floor(user.level / 5) + 1);
      const newHp = Math.max(0, currentBoss.hp - damage);
      setBosses(prev => ({ ...prev, [bossType]: { ...prev[bossType], hp: newHp } }));
      onBossAttack(bossType);

      if (newHp === 0) {
        setIsBossSpeechGenerating(true);
        try {
            const victoryMessage = await generateBossVictorySpeech(posts.slice(0,5), currentBoss.name);
            const victoryPost: GuildPost = { 
                id: `sys-win-${Date.now()}`, 
                author: 'CRÔNICAS DA GUILDA', 
                rank: RankTitle.Lendario, 
                content: victoryMessage, 
                channel: 'boss_strategy',
                likes: 999, 
                reactions: {'fire': 100},
                comments: [], 
                timestamp: Date.now(),
                isSystem: true 
            };
            setPosts(prev => [...prev, victoryPost]);
            setTimeout(() => {
              const newMaxHp = Math.floor(currentBoss.maxHp * 1.1);
              setBosses(prev => ({ ...prev, [bossType]: { ...prev[bossType], hp: newMaxHp, maxHp: newMaxHp, name: `${prev[bossType].name.split(' (')[0]} (Lv. Up)` } }));
            }, 5000);
        } finally {
            setIsBossSpeechGenerating(false);
        }
      }
    }
  };

  // --- Squad Logic ---
  const handleCreateSquad = () => {
      if (!hasSubscription) {
          alert("Protocolo de Criação Bloqueado. Requer Assinatura Neural (IA).");
          onUpgrade();
          return;
      }
      if (!newSquadName.trim()) return;

      // Simulate AI generated motto
      const mottos = ["Força na Unidade.", "Nenhum passo atrás.", "Disciplina é Liberdade.", "Glória aos Bravos.", "Morte à Mediocridade."];
      const randomMotto = mottos[Math.floor(Math.random() * mottos.length)];

      const newSquad: Squad = {
          id: `sq-${Date.now()}`,
          name: newSquadName,
          motto: randomMotto,
          leaderId: 'user-id', // Mock ID
          leaderName: user.name,
          members: [{
              id: 'user-id',
              name: user.name,
              rank: user.rank,
              level: user.level,
              archetype: user.archetype
          }],
          createdAt: Date.now()
      };

      setSquads(prev => [newSquad, ...prev]);
      setNewSquadName('');
      setIsCreatingSquad(false);
      
      // System Announcement
      const sysPost: GuildPost = {
          id: `sys-sq-${Date.now()}`,
          author: 'COMANDO CENTRAL',
          rank: RankTitle.Divino,
          content: `NOVO ESQUADRÃO INVOCADO: "${newSquadName}".\nLíder: ${user.name} (Link IA Ativo).`,
          channel: 'general',
          likes: 0,
          reactions: {},
          comments: [],
          timestamp: Date.now(),
          isSystem: true
      };
      setPosts(prev => [...prev, sysPost]);
  };

  const handleJoinSquad = (squadId: string) => {
      const currentJoinedCount = squads.filter(s => s.members.some(m => m.name === user.name)).length; // Mock check by name
      const maxAllowed = getMaxSquadsForLevel(user.level);

      if (currentJoinedCount >= maxAllowed) {
          alert(`Capacidade neural excedida. Seu nível (${user.level}) permite apenas ${maxAllowed} conexões de esquadrões.`);
          return;
      }

      setSquads(prev => prev.map(s => {
          if (s.id === squadId) {
              if (s.members.length >= MAX_SQUAD_SIZE) return s;
              if (s.members.some(m => m.name === user.name)) return s; // Already joined
              
              return {
                  ...s,
                  members: [...s.members, {
                      id: 'user-id', // Mock ID
                      name: user.name,
                      rank: user.rank,
                      level: user.level,
                      archetype: user.archetype
                  }]
              };
          }
          return s;
      }));
  };

  // --- Feed Logic ---
  const filteredPosts = posts.filter(p => p.channel === activeChannel);

  const handlePostSubmit = async () => {
      if (!newPostContent.trim()) return;

      // --- MODERATION FILTER ---
      const hasUrl = URL_REGEX.test(newPostContent);
      const hasPhone = PHONE_REGEX.test(newPostContent);
      const hasHandle = HANDLE_REGEX.test(newPostContent);

      // Sucesso 360 users might have exceptions, but for now stick to strict rules or allow business links if plan is sucesso360 in specific channel
      const isProtectionChannel = activeChannel === 'protection_360';
      const allowLinks = isProtectionChannel && user.activeModules.includes('soberano');

      if ((hasUrl || hasPhone || hasHandle) && !allowLinks) {
          setNewPostContent(''); // Clear input
          
          if (violationCount === 0) {
              // First Warning
              const warningPost: GuildPost = {
                  id: `warn-${Date.now()}`,
                  author: 'SISTEMA DE SEGURANÇA',
                  rank: 'SENTINELA',
                  content: '⚠️ PROTOCOLO DE COMUNICAÇÃO:\nA Guilda é um santuário hermético. Links externos, redes sociais (@) e telefones são proibidos para manter o foco absoluto.\n\nMantenha a comunicação dentro da plataforma. Sem distrações. Sem ruído externo.\n\nEsta é uma advertência. Reincidências resultarão em punição.',
                  channel: activeChannel,
                  likes: 0,
                  reactions: {},
                  comments: [],
                  timestamp: Date.now(),
                  isSystem: true
              };
              setPosts(prev => [...prev, warningPost]);
          } else {
              // Punishment
              onPunish(50); // Deduct 50 XP
              const punishPost: GuildPost = {
                  id: `punish-${Date.now()}`,
                  author: 'SISTEMA DE SEGURANÇA',
                  rank: 'SENTINELA',
                  content: `🚫 INFRAÇÃO DETECTADA: Insistência em quebra de protocolo.\n\nPUNIÇÃO APLICADA: -50 XP.\n\nA disciplina é inegociável. Sua evolução depende da sua capacidade de seguir regras.`,
                  channel: activeChannel,
                  likes: 0,
                  reactions: {},
                  comments: [],
                  timestamp: Date.now(),
                  isSystem: true
              };
              setPosts(prev => [...prev, punishPost]);
          }
          
          setViolationCount(prev => prev + 1);
          return; // Block the post
      }

      // --- NORMAL POST ---
      const post: GuildPost = {
          id: `post-${Date.now()}`,
          author: user.name,
          rank: user.rank,
          content: newPostContent,
          channel: activeChannel,
          likes: 0,
          reactions: {},
          comments: [],
          timestamp: Date.now()
      };
      setPosts(prev => [...prev, post]);
      setNewPostContent('');

      if (Math.random() > 0.3) {
          setIsSimulatingMember(true);
          setTimeout(async () => {
              try {
                  const simResponse = await generateGuildMemberReply(activeChannel, [...filteredPosts, post]);
                  if (simResponse) {
                      const replyPost: GuildPost = {
                          id: `sim-${Date.now()}`,
                          author: simResponse.author,
                          rank: simResponse.rank,
                          content: simResponse.content,
                          channel: activeChannel,
                          likes: Math.floor(Math.random() * 5),
                          reactions: {},
                          comments: [],
                          timestamp: Date.now()
                      };
                      setPosts(prev => [...prev, replyPost]);
                  }
              } catch (e) {
              } finally {
                  setIsSimulatingMember(false);
              }
          }, 3000 + Math.random() * 4000);
      }
  };

  const handleReaction = (postId: string, emoji: string) => {
    setPosts(prev => prev.map(p => {
        if (p.id === postId) {
            const currentReactions = p.reactions || {};
            return { 
                ...p, 
                reactions: { 
                    ...currentReactions, 
                    [emoji]: (currentReactions[emoji] || 0) + 1 
                } 
            };
        }
        return p;
    }));
  };

  // --- AI Insight Logic ---
  const handleSummonOracle = async () => {
      if(!hasSubscription) {
          onUpgrade();
          return;
      }
      if(isGeneratingInsight) return;

      setIsGeneratingInsight(true);
      try {
          const channelName = GUILD_CHANNELS.find(c => c.id === activeChannel)?.name || 'Canal';
          const insight = await generateChannelInsightAI(channelName, filteredPosts.slice(-10));
          
          const oraclePost: GuildPost = {
              id: `oracle-${Date.now()}`,
              author: 'O ORÁCULO',
              rank: RankTitle.Lendario,
              content: insight,
              channel: activeChannel,
              likes: 99,
              reactions: {'zap': 10},
              comments: [],
              timestamp: Date.now(),
              isSystem: true,
              aiAnalysis: 'true'
          };
          setPosts(prev => [...prev, oraclePost]);
      } catch (error) {
          console.error(error);
      } finally {
          setIsGeneratingInsight(false);
      }
  };

  // --- Layout Components ---

  const SidebarNav = () => (
      <div className="space-y-6">
          <div>
              <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest font-mono mb-4 px-2">Comunicações</h2>
              <div className="space-y-1">
                {GUILD_CHANNELS.map(channel => {
                    const Icon = channel.icon;
                    const isActive = activeTab === 'channels' && activeChannel === channel.id;
                    const isLocked = channel.exclusiveModule && !user.activeModules.includes(channel.exclusiveModule);

                    return (
                        <button
                            key={channel.id}
                            onClick={() => { 
                                if (!isLocked) {
                                    setActiveTab('channels'); 
                                    setActiveChannel(channel.id); 
                                    setMobileMenuOpen(false); 
                                }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
                                isActive ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' : 
                                isLocked ? 'opacity-50 cursor-not-allowed text-zinc-500' :
                                'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 active:scale-95'
                            }`}
                            aria-label={`Canal ${channel.name}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : isLocked ? 'text-zinc-600' : ''}`} aria-hidden="true" />
                                <div className="text-left">
                                    <p className={`text-sm font-mono font-bold uppercase ${isActive ? 'text-white' : 'text-zinc-400'}`}>{channel.name}</p>
                                </div>
                            </div>
                            {isLocked && <Lock className="w-3 h-3 text-zinc-600" aria-hidden="true" />}
                        </button>
                    )
                })}
              </div>
          </div>

          <div>
              <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest font-mono mb-4 px-2">Operações</h2>
              <button
                onClick={() => { setActiveTab('squads'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${activeTab === 'squads' ? 'bg-zinc-800 text-white shadow-md border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                aria-label="Esquadrões"
                aria-current={activeTab === 'squads' ? 'page' : undefined}
              >
                  <Users className={`w-4 h-4 ${activeTab === 'squads' ? 'text-yellow-500' : ''}`} aria-hidden="true" />
                  <div className="text-left">
                      <p className={`text-sm font-mono font-bold uppercase ${activeTab === 'squads' ? 'text-white' : 'text-zinc-400'}`}>Esquadrões</p>
                  </div>
              </button>
          </div>
      </div>
  );

  const RightPanel = () => {
      return (
        <div className="space-y-6">
            {/* Boss Status Widget */}
            <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent"></div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-red-500 text-xs font-bold uppercase font-mono flex items-center gap-2">
                        <Skull className="w-4 h-4" aria-hidden="true" /> Alvo Ativo
                    </h3>
                    <span className="text-xs font-mono text-red-400">{bosses.daily.hp}/{bosses.daily.maxHp} HP</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-3 truncate">{bosses.daily.name}</h4>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 mb-4" role="progressbar" aria-valuenow={bosses.daily.hp} aria-valuemin={0} aria-valuemax={bosses.daily.maxHp}>
                    <div className="bg-red-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(bosses.daily.hp / bosses.daily.maxHp) * 100}%` }}></div>
                </div>
                <button 
                    onClick={handleAttackBoss}
                    disabled={!attackAvailable || bosses.daily.hp === 0}
                    className="w-full py-2 bg-red-900/50 hover:bg-red-800 border border-red-800 text-white text-xs font-bold uppercase rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Atacar chefe diário"
                >
                    {attackAvailable ? <><Sword className="w-3 h-3" aria-hidden="true" /> Atacar</> : <><Clock className="w-3 h-3" aria-hidden="true" /> Descansando</>}
                </button>
            </div>

            {/* Leaderboard Widget */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-zinc-400 text-xs font-bold uppercase font-mono mb-3 flex items-center gap-2">
                    <Trophy className="w-3 h-3 text-yellow-500" aria-hidden="true" /> Ranking da Guilda
                </h3>
                <div className="space-y-3">
                    {MOCK_LEADERBOARD.map((hero, idx) => {
                        const ArchIcon = ARCHETYPES[hero.archetype].icon;
                        let rankColor = "text-zinc-500";
                        if (idx === 0) rankColor = "text-yellow-500";
                        if (idx === 1) rankColor = "text-zinc-300";
                        if (idx === 2) rankColor = "text-amber-700";

                        return (
                            <div key={hero.id} className="flex items-center justify-between bg-zinc-950/30 p-2 rounded hover:bg-zinc-900 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className={`font-mono font-bold text-sm w-4 ${rankColor}`}>{idx + 1}</span>
                                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0" title={hero.archetype}>
                                        <ArchIcon className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-zinc-200 font-bold truncate">{hero.name}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                                            <span className="uppercase">{hero.rank}</span> • Lvl {hero.level}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end ml-2">
                                    <RankInsignia rank={hero.rank} size="sm" />
                                    <span className="text-[9px] text-zinc-500 font-mono mt-1 whitespace-nowrap">
                                        {(hero.xp / 1000).toFixed(1)}k XP
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] sm:h-full overflow-hidden max-w-7xl mx-auto">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950/50 p-4 gap-6">
          <SidebarNav />
          <div className="mt-auto">
             <button onClick={onUpgrade} className="w-full bg-gradient-to-r from-yellow-900/20 to-transparent border border-yellow-900/30 p-3 rounded-lg text-left group hover:border-yellow-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500">
                 <p className="text-yellow-500 text-xs font-bold uppercase mb-1 flex items-center gap-2"><Crown className="w-3 h-3" aria-hidden="true"/> Membro Premium</p>
                 <p className="text-[10px] text-zinc-400 group-hover:text-zinc-300">Acesso total ao Oráculo e canais exclusivos.</p>
             </button>
          </div>
      </aside>

      {/* Mobile Header / Channel Selector */}
      <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-zinc-950 border-b border-zinc-800 p-2 flex items-center justify-between px-4">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex items-center gap-2 text-white font-bold uppercase font-mono text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded p-1">
              {activeTab === 'channels' 
                ? <><Hash className="w-4 h-4 text-zinc-500" aria-hidden="true" /> {GUILD_CHANNELS.find(c => c.id === activeChannel)?.name}</>
                : <><Users className="w-4 h-4 text-yellow-500" aria-hidden="true" /> Esquadrões</>
              }
              <ChevronRight className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
          </button>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-zinc-900 rounded border border-zinc-800 text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500" aria-label="Informações">
              <Info className="w-4 h-4" aria-hidden="true" />
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-zinc-950/95 backdrop-blur-sm pt-24 px-6 md:hidden animate-in fade-in slide-in-from-top-10">
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                  <h2 className="text-white font-bold uppercase font-mono">Navegação</h2>
                  <button onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu"><X className="w-6 h-6 text-zinc-500"/></button>
              </div>
              <SidebarNav />
              <div className="mt-8 border-t border-zinc-800 pt-8">
                  <RightPanel />
              </div>
          </div>
      )}

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative mt-10 md:mt-0">
          {activeTab === 'channels' ? (
            <>
                {/* Channel Header */}
                <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-zinc-500" aria-hidden="true" />
                        <div>
                            <h1 className="text-lg font-bold text-white font-mono uppercase">{GUILD_CHANNELS.find(c => c.id === activeChannel)?.name}</h1>
                            <p className="text-xs text-zinc-500">{GUILD_CHANNELS.find(c => c.id === activeChannel)?.description}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSummonOracle}
                        disabled={isGeneratingInsight}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold uppercase font-mono transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            hasSubscription 
                            ? 'bg-zinc-900 border-purple-900/50 text-purple-400 hover:bg-purple-900/20' 
                            : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-white'
                        }`}
                    >
                        {isGeneratingInsight ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true"/> : <Sparkles className="w-3 h-3" aria-hidden="true" />}
                        {hasSubscription ? 'Invocar Oráculo' : 'Oráculo Bloqueado'}
                    </button>
                </header>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                    {filteredPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-50">
                            <MessageCircle className="w-12 h-12 mb-2" aria-hidden="true" />
                            <p className="text-sm font-mono uppercase">Canal Silencioso. Inicie a transmissão.</p>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <div key={post.id} className={`group flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${post.isSystem ? 'bg-red-950/5 border border-red-900/20 p-3 rounded-lg' : ''}`}>
                                <div className="flex-shrink-0 mt-1">
                                    {post.isSystem 
                                        ? <div className="w-10 h-10 bg-red-900/20 rounded flex items-center justify-center border border-red-900/50"><AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true"/></div>
                                        : <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center"><UserIcon className="w-5 h-5 text-zinc-500" aria-hidden="true"/></div>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className={`font-bold text-sm truncate ${post.isSystem ? 'text-red-400 font-mono' : 'text-zinc-200'}`}>{post.author}</span>
                                        {!post.isSystem && <RankInsignia rank={post.rank as RankTitle} size="sm" />}
                                        <span className="text-[10px] text-zinc-500 ml-auto">{new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${post.isSystem ? 'text-red-200/80 italic' : 'text-zinc-300'}`}>
                                        {post.content}
                                    </p>
                                    
                                    {/* Boss Attack Action */}
                                    {post.action === 'attack_boss' && (
                                        <div className="mt-3 bg-zinc-950/50 p-4 rounded-lg border border-red-900/30">
                                            <div className="flex justify-between items-center mb-2 text-xs font-mono uppercase text-zinc-400">
                                                <span>HP DO INIMIGO</span>
                                                <span className="text-red-500 font-bold">{bosses.daily.hp}/{bosses.daily.maxHp}</span>
                                            </div>
                                            <div className="w-full bg-zinc-900 rounded-full h-2 mb-4 border border-zinc-800" role="progressbar" aria-valuenow={bosses.daily.hp} aria-valuemin={0} aria-valuemax={bosses.daily.maxHp}>
                                                <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${(bosses.daily.hp / bosses.daily.maxHp) * 100}%` }}></div>
                                            </div>
                                            <button 
                                                onClick={handleAttackBoss}
                                                disabled={!attackAvailable || bosses.daily.hp === 0}
                                                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-xs rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                            >
                                                {bosses.daily.hp === 0 ? 'Inimigo Derrotado' : !attackAvailable ? 'Descansando...' : <><Sword className="w-4 h-4" aria-hidden="true" /> Juntar-se ao Ataque</>}
                                            </button>
                                        </div>
                                    )}

                                    {/* Reactions Bar */}
                                    <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar opacity-70 hover:opacity-100 transition-opacity">
                                        {['🔥', '💪', '💀', '🧠'].map(emoji => (
                                            <button 
                                                key={emoji}
                                                onClick={() => handleReaction(post.id, emoji)}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors active:scale-95 text-[10px] border ${
                                                    post.reactions?.[emoji] 
                                                    ? 'bg-zinc-800/80 text-white border-zinc-700' 
                                                    : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-800'
                                                }`}
                                                aria-label={`Reagir com ${emoji}`}
                                            >
                                                <span>{emoji}</span>
                                                {post.reactions?.[emoji] && <span className="font-mono">{post.reactions[emoji]}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    
                    {isSimulatingMember && (
                        <div className="flex gap-3 animate-pulse p-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center"><Loader2 className="w-4 h-4 text-zinc-600 animate-spin" aria-hidden="true"/></div>
                            <div className="space-y-2 flex-1 py-2">
                                <div className="h-2 bg-zinc-800 rounded w-24"></div>
                                <div className="h-2 bg-zinc-800 rounded w-full"></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                    <div className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePostSubmit()}
                            placeholder={`Mensagem para #${GUILD_CHANNELS.find(c => c.id === activeChannel)?.name}...`}
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all placeholder:text-zinc-600"
                            aria-label="Nova mensagem"
                        />
                        <button 
                            onClick={handlePostSubmit}
                            disabled={!newPostContent.trim()}
                            className="absolute right-2 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md disabled:opacity-0 disabled:pointer-events-none transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            aria-label="Enviar mensagem"
                        >
                            <Send className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2 text-center font-mono flex items-center justify-center gap-2">
                        <Lock className="w-3 h-3" aria-hidden="true" /> Canal criptografado.
                    </p>
                </div>
            </>
          ) : (
            /* --- SQUADS TAB (FARMING SYSTEM) --- */
            <div className="flex-1 flex flex-col h-full bg-zinc-950 p-4 overflow-y-auto">
                <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white font-mono uppercase flex items-center gap-2">
                            <Users className="w-6 h-6 text-yellow-500" aria-hidden="true" /> Esquadrões de Elite
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1 max-w-md">
                            Grupos táticos de até 5 heróis para farm intensivo. Liderança exige conexão IA.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <p className="text-[10px] text-zinc-500 font-mono bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">
                                Limite de Alistamento: {getMaxSquadsForLevel(user.level)} esquadrões (Nível {user.level})
                            </p>
                            {!hasSubscription && (
                                <span className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1">
                                    <Lock className="w-3 h-3" aria-hidden="true"/> IA Requerida para Liderar
                                </span>
                            )}
                        </div>
                    </div>
                    {!isCreatingSquad ? (
                        <button 
                            onClick={() => setIsCreatingSquad(true)}
                            className="bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold uppercase text-xs flex items-center gap-2 transition-colors shadow-lg shadow-yellow-900/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                            <Terminal className="w-4 h-4" aria-hidden="true" /> Invocar Esquadrão
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded border border-yellow-500/30 w-full md:w-auto animate-in fade-in slide-in-from-right-5">
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Nome do Protocolo..." 
                                className="bg-transparent text-white text-sm px-2 outline-none w-full font-mono"
                                value={newSquadName}
                                onChange={e => setNewSquadName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateSquad()}
                                aria-label="Nome do novo esquadrão"
                            />
                            <button onClick={handleCreateSquad} className="text-yellow-500 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded" aria-label="Confirmar criação"><Plus className="w-5 h-5"/></button>
                            <button onClick={() => setIsCreatingSquad(false)} className="text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded" aria-label="Cancelar criação"><X className="w-5 h-5"/></button>
                        </div>
                    )}
                </header>

                {/* Squad List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {squads.map(squad => {
                        const isMember = squad.members.some(m => m.name === user.name); // Mock check
                        const isFull = squad.members.length >= MAX_SQUAD_SIZE;
                        
                        return (
                            <div key={squad.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors relative overflow-hidden">
                                {isMember && <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-yellow-600/20 border-l-[40px] border-l-transparent"></div>}
                                
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-white font-bold font-mono uppercase text-sm">{squad.name}</h3>
                                        <p className="text-[10px] text-zinc-500 italic">"{squad.motto}"</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                                        <Users className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                                        <span className={`text-xs font-mono font-bold ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                                            {squad.members.length}/{MAX_SQUAD_SIZE}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">Líder: <span className="text-yellow-500">{squad.leaderName}</span> <Zap className="w-3 h-3 text-yellow-500" aria-hidden="true" /></p>
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {squad.members.map((m, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[8px] text-zinc-400 font-bold font-mono" title={`${m.name} (${m.rank})`}>
                                                {m.name.charAt(0)}
                                            </div>
                                        ))}
                                        {Array.from({ length: MAX_SQUAD_SIZE - squad.members.length }).map((_, i) => (
                                            <div key={`empty-${i}`} className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 border-dashed flex items-center justify-center">
                                                <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                                        <Sparkles className="w-3 h-3" aria-hidden="true" /> Status: <span className="text-green-500/80">Mantido por IA</span>
                                    </div>
                                    {!isMember && (
                                        <button 
                                            onClick={() => handleJoinSquad(squad.id)}
                                            disabled={isFull}
                                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                        >
                                            {isFull ? 'Lotado' : 'Alistar-se'}
                                        </button>
                                    )}
                                    {isMember && (
                                        <span className="text-xs font-bold text-yellow-600 uppercase flex items-center gap-1">
                                            <SquadCheckIcon className="w-3 h-3" aria-hidden="true" /> Membro
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          )}
      </main>

      {/* Right Panel (Desktop Only) */}
      <aside className="hidden lg:block w-72 border-l border-zinc-800 bg-zinc-950/30 p-4">
          <RightPanel />
      </aside>
    </div>
  );
};

function SquadCheckIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
}

export default Guild;
