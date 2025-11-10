
import React, { useEffect, useState, useMemo } from 'react';
import { RankTitle, UserState, GuildPost } from '../types';
import { Shield, Trophy, ThumbsUp, MessageSquare, Loader2, Sword, Skull, Sparkles, Crown, Star, Hexagon, Clock, Send, User as UserIcon } from 'lucide-react';
import { generateBossVictorySpeech } from '../services/geminiService';

interface GuildProps {
  hasSubscription: boolean;
  onUpgrade: () => void;
  user: UserState;
  onAscend: () => void;
  onBossAttack: (type: 'daily' | 'weekly' | 'monthly') => void;
}

type BossType = 'daily' | 'weekly' | 'monthly';

interface BossData {
  name: string;
  hp: number;
  maxHp: number;
  active: boolean;
  rewardMultiplier: number;
}

const getWeekStart = (date: Date): string => {
  const d = new Date(date.getTime());
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};

const initialBossesState: Record<BossType, BossData> = {
    daily: { name: 'O Monstro da Procrastinação', hp: 100, maxHp: 100, active: true, rewardMultiplier: 1 },
    weekly: { name: 'O Leviatã da Distração', hp: 500, maxHp: 500, active: true, rewardMultiplier: 5 },
    monthly: { name: 'O Titã da Mediocridade', hp: 2000, maxHp: 2000, active: true, rewardMultiplier: 20 }
};

const RankInsignia: React.FC<{ rank: RankTitle; size?: 'sm' | 'md' | 'lg' }> = ({ rank, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  const containerSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  
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
    <div className={`relative flex items-center justify-center ${containerSize} rounded-lg ${bgColor} border ${borderColor}`}>
      <Icon className={`${sizeClass} ${iconColor}`} />
      {SubIcon && <SubIcon className={`w-3 h-3 absolute ${iconColor} -bottom-1 -right-1`} />}
    </div>
  );
};

const initialPosts: GuildPost[] = [
    { id: 'st1', author: 'Guardião da Guilda', rank: RankTitle.Lendario, content: 'Bem-vindos, heróis. Que suas jornadas sejam repletas de glória.', likes: 120, comments: [], timestamp: Date.now() - 86400000, isSystem: true },
    { id: 'st2', author: 'Alex O Bravo', rank: RankTitle.Paladino, content: 'O dia começou antes do sol. Desafio de fitness concluído. Sem desculpas.', likes: 45, comments: [], timestamp: Date.now() - 3600000 },
    { id: 'st3', author: 'Iniciante Corajoso', rank: RankTitle.Iniciante, content: 'Primeiro dia no modo Hardcore. É difícil, mas a recompensa será grande.', likes: 15, comments: [], timestamp: Date.now() - 1800000 },
];

const Guild: React.FC<GuildProps> = ({ hasSubscription, onUpgrade, user, onAscend, onBossAttack }) => {
  const [activeTab, setActiveTab] = useState<'boss' | 'feed'>('boss');
  const [activeBossTab, setActiveBossTab] = useState<BossType>('daily');
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  
  // Feed State
  const [posts, setPosts] = useState<GuildPost[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');

  const [bosses, setBosses] = useState<Record<BossType, BossData>>(() => {
    const savedState = localStorage.getItem('hero_boss_state');
    if (!savedState) return initialBossesState;

    try {
      const { lastUpdate, data } = JSON.parse(savedState);
      const lastUpdateDate = new Date(lastUpdate);
      const now = new Date();
      const updatedBosses = { ...data };

      if (lastUpdateDate.getUTCFullYear() !== now.getUTCFullYear() || lastUpdateDate.getUTCMonth() !== now.getUTCMonth() || lastUpdateDate.getUTCDate() !== now.getUTCDate()) {
        updatedBosses.daily.hp = updatedBosses.daily.maxHp;
      }
      if (getWeekStart(lastUpdateDate) !== getWeekStart(now)) {
        updatedBosses.weekly.hp = updatedBosses.weekly.maxHp;
      }
      if (lastUpdateDate.getUTCFullYear() !== now.getUTCFullYear() || lastUpdateDate.getUTCMonth() !== now.getUTCMonth()) {
        updatedBosses.monthly.hp = updatedBosses.monthly.maxHp;
      }
      return updatedBosses;
    } catch (e) {
      return initialBossesState;
    }
  });

  useEffect(() => {
    localStorage.setItem('hero_boss_state', JSON.stringify({
      lastUpdate: new Date().toISOString(),
      data: bosses
    }));
  }, [bosses]);

  const leaderboard = [
    { id: 1, name: 'Felipe Titã', rank: RankTitle.Divino, level: 52 },
    { id: 2, name: 'Alex O Bravo', rank: RankTitle.Paladino, level: 32 },
    { id: 3, name: 'Marcus Aurelius', rank: RankTitle.Campeao, level: 28 },
  ];

  const attackAvailable = useMemo(() => {
    const lastAttackTimestamp = user.lastBossAttacks?.[activeBossTab];
    if (!lastAttackTimestamp) return true;
    const lastAttackDate = new Date(lastAttackTimestamp);
    const today = new Date();

    if (activeBossTab === 'daily') return lastAttackDate.getUTCFullYear() !== today.getUTCFullYear() || lastAttackDate.getUTCMonth() !== today.getUTCMonth() || lastAttackDate.getUTCDate() !== today.getUTCDate();
    if (activeBossTab === 'weekly') return getWeekStart(lastAttackDate) !== getWeekStart(today);
    if (activeBossTab === 'monthly') return lastAttackDate.getUTCFullYear() !== today.getUTCFullYear() || lastAttackDate.getUTCMonth() !== today.getUTCMonth();
    return true;
  }, [user.lastBossAttacks, activeBossTab]);

  const calculateDamage = () => Math.max(1, Math.floor(user.level / 5) + 1);

  const handleAttackBoss = async () => {
    if (!attackAvailable || isGeneratingSpeech) return;
    const currentBoss = bosses[activeBossTab];
    if (currentBoss.hp > 0) {
      const damage = calculateDamage();
      const newHp = Math.max(0, currentBoss.hp - damage);
      setBosses(prev => ({ ...prev, [activeBossTab]: { ...prev[activeBossTab], hp: newHp } }));
      onBossAttack(activeBossTab);

      if (newHp === 0) {
        setIsGeneratingSpeech(true);
        try {
            const victoryMessage = await generateBossVictorySpeech(posts, currentBoss.name);
            const victoryPost: GuildPost = { 
                id: `sys-win-${Date.now()}`, 
                author: 'CRÔNICAS DA GUILDA', 
                rank: RankTitle.Lendario, 
                content: victoryMessage, 
                likes: 999, 
                comments: [], 
                timestamp: Date.now(),
                isSystem: true 
            };
            setPosts(prev => [victoryPost, ...prev]);
            setTimeout(() => {
              const newMaxHp = Math.floor(currentBoss.maxHp * 1.5);
              setBosses(prev => ({ ...prev, [activeBossTab]: { ...prev[activeBossTab], hp: newMaxHp, maxHp: newMaxHp, name: `${prev[activeBossTab].name.split(' (')[0]} (Renascido)` } }));
            }, 3000);
        } catch (error) {
            // Fallback
        } finally {
            setTimeout(() => setIsGeneratingSpeech(false), 3000);
        }
      }
    }
  };

  // Feed Handlers
  const handlePostSubmit = () => {
      if (!newPostContent.trim()) return;
      const post: GuildPost = {
          id: `post-${Date.now()}`,
          author: user.name,
          rank: user.rank,
          content: newPostContent,
          likes: 0,
          comments: [],
          timestamp: Date.now()
      };
      setPosts(prev => [post, ...prev]);
      setNewPostContent('');
  };

  const handleLike = (postId: string) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleCommentSubmit = (postId: string) => {
      if (!newCommentContent.trim()) return;
      setPosts(prev => prev.map(p => {
          if (p.id === postId) {
              return {
                  ...p,
                  comments: [...p.comments, {
                      id: `c-${Date.now()}`,
                      author: user.name,
                      content: newCommentContent,
                      timestamp: Date.now()
                  }]
              };
          }
          return p;
      }));
      setNewCommentContent('');
      setCommentingPostId(null);
  };
  
  const currentBoss = bosses[activeBossTab];
  const damage = calculateDamage();

  const renderAscensionSection = () => {
    if (user.isAscended) {
      return (
        <div key="ascended-panel" className="bg-zinc-900 border border-red-800 rounded-xl p-4 flex items-center gap-3">
          <RankInsignia rank={RankTitle.Divino} size="lg" />
          <div>
            <h3 className="font-bold text-red-500 uppercase font-mono text-sm">Herói Ascendido</h3>
            <p className="text-xs text-zinc-400">Multiplicador Panteão: {Math.floor(user.currentXP / 1000) + 1}x</p>
          </div>
        </div>
      );
    }
    if (user.level >= 50) {
      return (
        <div key="ascension-prompt" className="bg-gradient-to-br from-red-900/50 to-zinc-900 border border-red-700/50 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-3"> <Crown className="w-6 h-6 text-red-500" /> <h3 className="font-bold text-red-500 uppercase font-mono">Ascensão Disponível</h3> </div>
          <p className="text-sm text-zinc-300 mb-4">Você atingiu o ápice. Deseja transcender e resetar seu nível para ganhar poder infinito no Panteão?</p>
          <button onClick={onAscend} className="w-full py-3 bg-red-600 hover:bg-red-700 transition-colors active:scale-95 text-white font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2"> <Crown className="w-4 h-4" /> Ascender Agora </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        
        {/* Main Tabs */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button onClick={() => setActiveTab('boss')} className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition ${activeTab === 'boss' ? 'bg-red-900 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Desafio do Chefe</button>
            <button onClick={() => setActiveTab('feed')} className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition ${activeTab === 'feed' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Chat da Guilda</button>
        </div>

        {activeTab === 'boss' ? (
            <>
                <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                {(['daily', 'weekly', 'monthly'] as const).map(type => <button key={type} onClick={() => setActiveBossTab(type)} className={`flex-1 py-2 text-xs font-mono uppercase rounded transition active:scale-95 ${activeBossTab === type ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>{type === 'daily' ? 'Diário' : type === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}
                </div>
                
                <div key={activeBossTab} className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 relative overflow-hidden shadow-lg shadow-red-900/20">
                <div className="flex justify-between items-center mb-2"> <h3 className="text-red-500 font-bold uppercase font-mono flex items-center gap-2 text-sm sm:text-base"><Skull className="w-5 h-5" /> {currentBoss.name}</h3> <span className="font-mono text-sm text-zinc-400">{currentBoss.hp}/{currentBoss.maxHp} HP</span> </div>
                <div className="w-full bg-zinc-900 rounded-full h-3 mb-4"> <div className="bg-red-600 h-3 rounded-full transition-all duration-300" style={{ width: `${(currentBoss.hp / currentBoss.maxHp) * 100}%` }}></div> </div>
                <button onClick={handleAttackBoss} disabled={currentBoss.hp === 0 || isGeneratingSpeech || !attackAvailable} className="w-full py-4 bg-red-800 hover:bg-red-700 transition text-white font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed">
                    {isGeneratingSpeech ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando Feito...</> : !attackAvailable ? <><Clock className="w-4 h-4" /> Descansando...</> : <><Sword className="w-4 h-4" /> Enfrentar Desafio (Dano: {damage})</>}
                </button>
                {!attackAvailable && !isGeneratingSpeech && <p className="text-xs text-center mt-2 text-zinc-500 font-mono">Você já contribuiu com este desafio hoje.</p>}
                </div>
            </>
        ) : (
            <div className="space-y-6 animate-in fade-in">
                {/* New Post Input */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                             <UserIcon className="w-6 h-6 text-zinc-500"/>
                        </div>
                        <div className="flex-grow">
                             <textarea 
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Compartilhe sua vitória ou aprendizado..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-zinc-600 min-h-[80px]"
                             />
                             <div className="flex justify-end mt-2">
                                 <button 
                                    onClick={handlePostSubmit}
                                    disabled={!newPostContent.trim()}
                                    className="bg-zinc-100 text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-wider hover:bg-white transition disabled:opacity-50"
                                 >
                                     Postar
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Feed List */}
                <div className="space-y-4">
                    {posts.map(post => (
                        <div key={post.id} className={`border rounded-xl p-4 ${post.isSystem ? 'bg-red-950/10 border-red-900/30' : 'bg-zinc-900 border-zinc-800'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex-shrink-0">{post.isSystem ? <div className="w-10 h-10 rounded-lg bg-red-800 flex items-center justify-center border border-red-700"><Skull className="w-5 h-5 text-white" /></div> : <RankInsignia rank={post.rank as RankTitle} />}</div>
                                <div> <h4 className="font-bold text-white flex items-center gap-2">{post.author}</h4> <p className="text-xs text-zinc-500 uppercase flex items-center gap-1">{post.rank}</p> </div>
                                <span className="ml-auto text-xs text-zinc-600 font-mono">{new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-zinc-300 mb-4 whitespace-pre-wrap text-sm sm:text-base">{post.content}</p>
                            
                            <div className="flex gap-6 text-zinc-500 text-sm font-mono border-t border-zinc-800/50 pt-3">
                                <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 hover:text-red-500 transition">
                                    <ThumbsUp className={`w-4 h-4 ${post.likes > 0 ? 'text-red-500' : ''}`} /> {post.likes}
                                </button>
                                <button onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)} className="flex items-center gap-2 hover:text-white transition">
                                    <MessageSquare className="w-4 h-4" /> {post.comments.length}
                                </button>
                            </div>

                            {/* Comments Section */}
                            {(commentingPostId === post.id || post.comments.length > 0) && (
                                <div className="mt-4 bg-zinc-950/50 rounded-lg p-3 space-y-3">
                                    {post.comments.map(comment => (
                                        <div key={comment.id} className="flex gap-2 text-sm">
                                            <span className="font-bold text-zinc-400">{comment.author}:</span>
                                            <span className="text-zinc-300">{comment.content}</span>
                                        </div>
                                    ))}
                                    
                                    {commentingPostId === post.id && (
                                        <div className="flex gap-2 mt-3">
                                            <input 
                                                type="text" 
                                                value={newCommentContent}
                                                onChange={(e) => setNewCommentContent(e.target.value)}
                                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                                placeholder="Escreva um comentário..."
                                                autoFocus
                                            />
                                            <button onClick={() => handleCommentSubmit(post.id)} className="p-1 bg-zinc-800 rounded hover:bg-zinc-700"><Send className="w-4 h-4 text-white"/></button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
        
      </div>

      <div className="space-y-6">
        {renderAscensionSection()}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-fit">
          <h3 className="font-bold mb-4 flex items-center gap-2 uppercase font-mono text-sm text-zinc-400"> <Trophy className="w-4 h-4 text-yellow-500" /> Top Heróis </h3>
          <div className="space-y-3">
            {leaderboard.map((u, index) => <div key={u.id} className="flex items-center justify-between p-2 bg-zinc-950/50 rounded"> <div className="flex items-center gap-2"> <span className="text-sm font-bold text-zinc-600 font-mono">#{index + 1}</span> <div className="flex items-center gap-2"> <RankInsignia rank={u.rank as RankTitle} size="sm" /> <div> <p className="text-sm font-bold text-zinc-200">{u.name}</p> <p className="text-xs text-zinc-500">{u.rank}</p> </div> </div> </div> <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded">Nível {u.level}</span> </div>)}
            <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded border border-zinc-700 mt-4"> <div className="flex items-center gap-2"> <span className="text-sm font-bold text-zinc-500 font-mono">#99</span> <div className="flex items-center gap-2"> <RankInsignia rank={user.rank} size="sm" /> <div> <p className="text-sm font-bold text-white">Você</p> <p className="text-xs text-zinc-500">{user.rank}</p> </div> </div> </div> <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded">Nível {user.level}</span> </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guild;
