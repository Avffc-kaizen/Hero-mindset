import React, { useEffect, useState, useRef } from 'react';
import { Shield, Skull, Target, ChevronRight, LogIn, CheckCircle, Zap, Brain, Sword, Share2, X, Copy, MessageCircle, Play, Bot, Crown, Map, Users, GitMerge, Sparkles, Lock, Hexagon, LayoutDashboard, ArrowDown } from 'lucide-react';

interface LandingPageProps {
  onBuy: (productId: string) => void;
  onGoToLogin: () => void;
}

// Componente para Lazy Loading de Seções (Performance)
const LazySection = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '200px' } // Começa a carregar 200px antes de entrar na tela
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={elementRef} className={`transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`} {...props}>
      {isVisible ? children : <div className="h-32 w-full flex items-center justify-center opacity-5"><div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-500 rounded-full animate-spin"></div></div>}
    </div>
  );
};

// Componente Otimizado para Carregamento de Vídeo (Fachada)
const LiteYouTubeEmbed = ({ videoId, title, coverImage }: { videoId: string, title: string, coverImage?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (isLoaded) {
    return (
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full rounded-xl animate-in fade-in"
      />
    );
  }

  return (
    <button
      onClick={() => setIsLoaded(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute inset-0 w-full h-full bg-black group cursor-pointer overflow-hidden rounded-xl relative"
      aria-label={`Reproduzir vídeo: ${title}`}
    >
      <img
        src={coverImage || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-900/50 transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
          <Play className="w-8 h-8 text-white ml-1 fill-current" />
        </div>
      </div>
      {isHovered && <link rel="preconnect" href="https://www.youtube.com" />}
    </button>
  );
};

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);

const FAQItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`group bg-zinc-900/50 rounded-lg border transition-all duration-300 overflow-hidden ${
        isOpen ? 'border-red-900/50 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 text-left cursor-pointer focus:outline-none"
      >
        <span className={`font-mono font-bold transition-colors ${isOpen ? 'text-white' : 'text-zinc-300'}`}>
          {q}
        </span>
        <div className={`p-1 rounded-full transition-colors duration-300 ${isOpen ? 'bg-red-900/20 text-red-500' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
           <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5 pt-0 text-zinc-400 leading-relaxed text-sm border-t border-zinc-800/50 mt-1 mx-5 border-dashed">
          <div className="pt-4">{a}</div>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onBuy, onGoToLogin }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeArsenalTab, setActiveArsenalTab] = useState<'map' | 'guild' | 'skills' | 'pantheon'>('map');


  const testimonials = [
    {
      quote: "Isso não é um app de bem-estar. É uma ferramenta para forjar sua lenda pessoal. O Modo Hardcore me forçou a parar de dar desculpas. Mudei o jogo em 30 dias.",
      name: "Alex 'O Titã'",
      role: "Empreendedor, Nível 28",
    },
    {
      quote: "Eu lia sobre filosofia, mas não aplicava nada. O Hero Mindset transformou a sabedoria em desafios diários. A clareza que ganhei é absurda. A ação virou meu único caminho.",
      name: "Ricardo M.",
      role: "Advogado, Nível 19",
    },
    {
      quote: "Tentei de tudo: agenda, planners, apps de hábito. Só aqui a consequência da falha (perder XP) doeu de verdade. Finalmente construí uma rotina matinal inquebrável.",
      name: "Bruno 'A Fênix'",
      role: "Desenvolvedor, Nível 35",
    },
  ];

  useEffect(() => {
    if ((window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', { content_name: 'Hero Mindset Sales Page (Eduzz)', content_type: 'product' });
    }
  }, []);

  const handleBuyClick = (productId: string) => {
    if ((window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', { currency: 'BRL', value: 497.00, content_name: 'Acesso Vitalício', content_ids: [productId] });
    }
    onBuy(productId);
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = "Transforme sua vida em uma jornada lendária com o Hero Mindset.";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error('Failed to copy url', err);
    }
  };

  const openShareLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const TabButton: React.FC<{
    label: string;
    icon: React.ElementType;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm font-mono uppercase rounded-lg transition-all active:scale-95 ${
        isActive ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-300 border border-transparent'
      }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : ''}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="bg-zinc-950 min-h-screen text-white relative overflow-x-hidden font-sans">
      {/* Navegação Simplificada */}
      <nav className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 sm:p-6 z-50 max-w-7xl mx-auto w-full">
        <div className="font-mono font-bold text-lg uppercase tracking-tighter flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-600" /> Hero Mindset
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onGoToLogin}
            className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 hover:text-white transition border border-zinc-800 px-4 py-2 rounded-md bg-zinc-900/80 backdrop-blur-sm"
          >
            <LogIn className="w-4 h-4" /> Santuário
          </button>
        </div>
      </nav>

      {/* Header Otimizado */}
      <header className="relative py-32 sm:py-40 px-6 text-center border-b border-zinc-900 bg-zinc-950 overflow-hidden">
        {/* CSS Background Pattern (Removed heavy external image) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950"></div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-red-900/50 bg-red-950/10 rounded-full text-red-500 text-sm uppercase tracking-wider font-bold">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-ping"></span>
            </span>
            Plataforma 2.0 Liberada
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-6 tracking-tighter font-mono uppercase leading-none text-white">
            FORJE SUA<br/><span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-400 to-zinc-700">LENDA PESSOAL.</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 mb-10 leading-relaxed max-w-3xl mx-auto">
             Um ecossistema completo que une <strong>Diagnóstico de Vida 360°</strong>, <strong>Comunidade Gamificada</strong> e <strong>Ferramentas Reais</strong>. Troque motivação por disciplina militar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleBuyClick('hero_vitalicio')}
              className="w-full sm:w-auto bg-red-600 text-white px-8 py-4 text-base sm:text-lg rounded-md font-bold uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-red-900/20 active:scale-95"
            >
              Iniciar Jornada
              <ChevronRight className="w-5 h-5" />
            </button>
             <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full sm:w-auto bg-transparent border border-zinc-800 text-zinc-400 px-8 py-4 text-base sm:text-lg rounded-md font-bold uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-colors flex items-center justify-center gap-3 active:scale-95"
            >
              <Share2 className="w-5 h-5" />
              Convidar Aliados
            </button>
          </div>
          <p className="mt-8 text-zinc-600 text-xs font-mono uppercase tracking-widest">
             Junte-se a +1.500 heróis ativos no ranking.
          </p>
        </div>
      </header>

      {/* VSL Section (Mantido Eager para conversão) */}
      <section className="py-16 sm:py-24 px-4 bg-zinc-950 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
             <h2 className="text-sm font-bold uppercase font-mono tracking-widest text-red-600 flex items-center justify-center gap-2">
                <Sword className="w-4 h-4" /> O Sistema Operacional da Vida
             </h2>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden relative shadow-2xl shadow-red-950/10 aspect-video w-full">
            <LiteYouTubeEmbed videoId="7JQeToR6pQs" title="Hero Mindset VSL" />
          </div>
        </div>
      </section>

      {/* New Features Grid - Lazy Loaded */}
      <LazySection className="py-20 px-6 bg-zinc-900/20 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold uppercase font-mono mb-4 tracking-tighter text-white">Não é um App.<br/>É um Estilo de Vida.</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-lg">O único sistema que integra diagnóstico, planejamento, execução e comunidade.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 bg-blue-900/20 border border-blue-900/50 rounded-lg flex items-center justify-center mb-4">
                <Map className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold mb-2 uppercase font-mono text-zinc-200">Clareza Total</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">O Mapa 360° diagnostica 12 áreas da sua vida. Saiba exatamente onde você está fraco e onde precisa atacar.</p>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2 uppercase font-mono text-zinc-200">Tribo de Elite</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">A Guilda é onde os heróis se reúnem. Compartilhe vitórias, suba no ranking e enfrente Chefes Semanais em grupo.</p>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors">
              <div className="w-12 h-12 bg-yellow-900/20 border border-yellow-900/50 rounded-lg flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-bold mb-2 uppercase font-mono text-zinc-200">Legado Divino</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Sistema de Ascensão Panteão. Chegue ao nível 50, reinicie e ganhe poderes permanentes. O jogo nunca acaba.</p>
            </div>
          </div>
        </div>
      </LazySection>

      {/* Interactive Feature Showcase - Lazy Loaded */}
      <LazySection className="py-20 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-start gap-12">
            <div className="flex-1 space-y-8 lg:sticky lg:top-24">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 bg-zinc-800 rounded-full text-xs uppercase font-mono tracking-wider text-zinc-400">
                   <LayoutDashboard className="w-4 h-4" /> O Arsenal 2.0
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold uppercase font-mono mb-4 tracking-tighter">Tecnologia de Guerra Pessoal</h2>
                <p className="text-zinc-400 text-lg">Nós não te damos apenas conteúdo. Te damos as ferramentas para aplicar.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4 group">
                    <div className="mt-1 w-8 h-8 rounded bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors"><Map className="w-4 h-4 text-zinc-400 group-hover:text-white"/></div>
                    <div><h3 className="text-lg font-bold text-white mb-1 font-mono">Mapa da Vida</h3><p className="text-zinc-400 text-sm">Visualize sua vida em 12 dimensões.</p></div>
                </div>
                <div className="flex gap-4 group">
                    <div className="mt-1 w-8 h-8 rounded bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors"><Users className="w-4 h-4 text-zinc-400 group-hover:text-white"/></div>
                    <div><h3 className="text-lg font-bold text-white mb-1 font-mono">Guilda Interativa</h3><p className="text-zinc-400 text-sm">Chat real, Feed e Batalhas contra Chefes.</p></div>
                </div>
                <div className="flex gap-4 group">
                    <div className="mt-1 w-8 h-8 rounded bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors"><GitMerge className="w-4 h-4 text-zinc-400 group-hover:text-white"/></div>
                    <div><h3 className="text-lg font-bold text-white mb-1 font-mono">Skill Tree</h3><p className="text-zinc-400 text-sm">Complete missões para liberar ferramentas (Pomodoro, Budget, etc).</p></div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full mt-8 lg:mt-0">
               <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                  {/* Mock Browser Header */}
                  <div className="bg-zinc-950 border-b border-zinc-800 p-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    <div className="ml-4 bg-zinc-900 rounded px-2 py-1 text-[10px] text-zinc-500 font-mono flex-1 text-center border border-zinc-800">hero-mindset-os.v2.exe</div>
                  </div>

                  {/* Tabs */}
                  <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
                    <TabButton label="Mapa" icon={Map} isActive={activeArsenalTab === 'map'} onClick={() => setActiveArsenalTab('map')} />
                    <TabButton label="Guilda" icon={Users} isActive={activeArsenalTab === 'guild'} onClick={() => setActiveArsenalTab('guild')} />
                    <TabButton label="Skills" icon={GitMerge} isActive={activeArsenalTab === 'skills'} onClick={() => setActiveArsenalTab('skills')} />
                    <TabButton label="Panteão" icon={Crown} isActive={activeArsenalTab === 'pantheon'} onClick={() => setActiveArsenalTab('pantheon')} />
                  </div>

                  {/* Content Area */}
                  <div className="p-6 min-h-[350px] bg-zinc-950 relative">
                    
                    {/* MAP TAB */}
                    {activeArsenalTab === 'map' && (
                      <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300">
                         <div className="relative w-64 h-64 mb-6">
                            {/* CSS Radar Chart Simulation */}
                            <div className="absolute inset-0 rounded-full border border-zinc-800"></div>
                            <div className="absolute inset-8 rounded-full border border-zinc-800 opacity-50"></div>
                            <div className="absolute inset-16 rounded-full border border-zinc-800 opacity-30"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-full opacity-20 bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0%,_white_15%,_transparent_20%,_white_40%,_transparent_60%,_white_85%,_transparent_100%)] rounded-full animate-[spin_10s_linear_infinite]"></div>
                            </div>
                            <div className="absolute inset-0 bg-zinc-950/80 m-4 rounded-full flex items-center justify-center backdrop-blur-sm border border-zinc-700">
                                <div className="text-center">
                                    <p className="text-xs text-zinc-500 font-mono uppercase">Foco Atual</p>
                                    <p className="text-xl font-bold text-white">FINANCEIRO</p>
                                    <p className="text-red-500 text-sm font-mono font-bold">Nível 3/10</p>
                                </div>
                            </div>
                             {/* Axis Labels */}
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-5 text-[10px] text-zinc-500 uppercase font-mono bg-zinc-950 px-1">Saúde</span>
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 text-[10px] text-zinc-500 uppercase font-mono bg-zinc-950 px-1">Social</span>
                            <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-zinc-500 uppercase font-mono -rotate-90 bg-zinc-950 px-1">Mente</span>
                            <span className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 text-[10px] text-zinc-500 uppercase font-mono rotate-90 bg-zinc-950 px-1">Grana</span>
                         </div>
                         <p className="text-center text-zinc-400 text-sm max-w-xs">Diagnóstico visual em tempo real. Onde o gráfico recua, é onde você deve atacar.</p>
                      </div>
                    )}

                    {/* GUILD TAB */}
                    {activeArsenalTab === 'guild' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 mb-4">
                             <div className="flex justify-between text-xs uppercase font-bold text-red-400 mb-2 font-mono">
                                 <span>Chefe: Monstro da Procrastinação</span>
                                 <span>HP: 450/2000</span>
                             </div>
                             <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                                 <div className="bg-red-600 h-full w-[25%] animate-pulse"></div>
                             </div>
                         </div>
                         
                         <div className="space-y-3">
                             <div className="flex gap-3 items-start">
                                 <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center font-bold text-xs">AF</div>
                                 <div className="bg-zinc-900 p-2 rounded-lg rounded-tl-none border border-zinc-800 text-xs text-zinc-300 flex-1">
                                     <p className="font-bold text-zinc-400 mb-1 text-[10px] uppercase">André Ferraz (Lendário)</p>
                                     Acabei de completar a missão de leitura. +50XP para a guilda! Vamos derrubar esse chefe hoje.
                                 </div>
                             </div>
                             <div className="flex gap-3 items-start">
                                 <div className="w-8 h-8 bg-blue-900/30 text-blue-500 rounded flex items-center justify-center font-bold text-xs">R</div>
                                 <div className="bg-zinc-900 p-2 rounded-lg rounded-tl-none border border-zinc-800 text-xs text-zinc-300 flex-1">
                                     <p className="font-bold text-zinc-400 mb-1 text-[10px] uppercase">Ricardo (Paladino)</p>
                                     Treino feito. 5h da manhã. Sem desculpas.
                                 </div>
                             </div>
                         </div>
                         
                         <div className="absolute bottom-4 left-4 right-4">
                             <div className="bg-zinc-900 border border-zinc-800 rounded p-2 flex text-xs text-zinc-500 items-center justify-between">
                                 <span>Escreva para a guilda...</span>
                                 <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center"><ChevronRight className="w-3 h-3"/></div>
                             </div>
                         </div>
                      </div>
                    )}

                    {/* SKILLS TAB */}
                    {activeArsenalTab === 'skills' && (
                        <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                             <div className="relative flex flex-col items-center gap-8">
                                 {/* Node 1 */}
                                 <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-yellow-500 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)] relative z-10">
                                     <Brain className="w-8 h-8 text-yellow-500" />
                                     <div className="absolute -right-2 -bottom-2 bg-green-500 text-black text-[10px] font-bold px-1 rounded font-mono">ATIVO</div>
                                 </div>
                                 
                                 {/* Connecting Line */}
                                 <div className="w-1 h-12 bg-zinc-800 absolute top-16 -z-0"></div>
                                 
                                 {/* Tools Unlocked */}
                                 <div className="flex gap-4 mt-4">
                                     <div className="bg-zinc-900 p-3 rounded border border-zinc-800 flex flex-col items-center gap-2 opacity-50">
                                         <Lock className="w-4 h-4 text-zinc-600" />
                                         <span className="text-[10px] text-zinc-500 uppercase font-mono">Leitura Dinâmica</span>
                                     </div>
                                     <div className="bg-zinc-800 p-3 rounded border border-zinc-700 flex flex-col items-center gap-2">
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                          <span className="text-[10px] text-white uppercase font-bold font-mono">Foco Pomodoro</span>
                                     </div>
                                 </div>
                             </div>
                             <p className="mt-6 text-center text-zinc-400 text-xs">Complete missões de Intelecto para desbloquear a ferramenta de Pomodoro integrada.</p>
                        </div>
                    )}

                     {/* PANTHEON TAB */}
                    {activeArsenalTab === 'pantheon' && (
                        <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300 text-center">
                             <Sparkles className="w-12 h-12 text-yellow-400 mb-4 animate-pulse" />
                             <h3 className="text-xl font-bold text-white font-mono uppercase mb-2">Sua alma é imortal</h3>
                             <p className="text-sm text-zinc-400 mb-6 max-w-xs">Ao atingir o Nível 50, você pode ASCENDER. Resete seu nível, mas mantenha Perks Divinos permanentes.</p>
                             
                             <div className="grid grid-cols-2 gap-3 w-full">
                                 <div className="bg-zinc-900 border border-yellow-900/30 p-3 rounded text-left">
                                     <p className="text-[10px] text-yellow-600 uppercase font-bold">Perk Ativo</p>
                                     <p className="text-xs font-bold text-zinc-200 font-mono">+10% XP Ganho</p>
                                 </div>
                                 <div className="bg-zinc-900 border border-yellow-900/30 p-3 rounded text-left">
                                     <p className="text-[10px] text-yellow-600 uppercase font-bold">Perk Ativo</p>
                                     <p className="text-xs font-bold text-zinc-200 font-mono">Troca de Missão</p>
                                 </div>
                             </div>
                        </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </LazySection>

      {/* Testimonials - Lazy Loaded */}
      <LazySection className="py-20 px-6 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold uppercase font-mono mb-12 tracking-tighter">Relatos da Front</h2>
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex items-center justify-center">
              <div className="absolute top-4 left-4 opacity-20"><MessageCircle className="w-12 h-12 text-zinc-500"/></div>
              <div className="relative w-full">
                  <div className="px-2 md:px-4 flex flex-col items-center justify-center min-h-[180px]">
                      <p className="text-lg font-light text-zinc-200 leading-relaxed italic max-w-2xl">"{testimonials[currentTestimonial].quote}"</p>
                      <div className="mt-6"><p className="font-bold text-white uppercase font-mono tracking-wider">{testimonials[currentTestimonial].name}</p><p className="text-zinc-500 font-mono text-sm">{testimonials[currentTestimonial].role}</p></div>
                  </div>
              </div>
              <button onClick={() => setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)} aria-label="Anterior" className="absolute left-0 top-1/2 -translate-y-1/2 p-4 hover:text-zinc-300 text-zinc-600"><ChevronRight className="w-6 h-6 transform rotate-180" /></button>
              <button onClick={() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length)} aria-label="Próximo" className="absolute right-0 top-1/2 -translate-y-1/2 p-4 hover:text-zinc-300 text-zinc-600"><ChevronRight className="w-6 h-6" /></button>
          </div>
        </div>
      </LazySection>

      {/* Pricing Section - Lazy Loaded */}
      <LazySection className="py-20 px-6 bg-zinc-900/20 border-y border-zinc-900" id="pricing">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10"><h2 className="text-3xl sm:text-4xl font-bold uppercase font-mono mb-4 tracking-tighter">Junte-se Agora</h2><p className="text-zinc-400">Acesso vitalício ao sistema. Um único pagamento.</p></div>
          <div className="p-1 bg-gradient-to-br from-red-900 to-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-20 uppercase font-mono">Lançamento 2.0</div>
            <div className="bg-zinc-950 rounded-[13px] p-6 sm:p-8 flex flex-col relative z-10">
              
              {/* Compact Header */}
              <div className="mb-6 text-center border-b border-zinc-800 pb-6">
                  <h3 className="text-xl font-bold uppercase font-mono mb-2 text-zinc-400 tracking-wider">Acesso Vitalício</h3>
                  <div className="flex items-end justify-center gap-3 mb-3">
                     <span className="text-zinc-600 line-through text-xl font-mono mb-1.5">R$ 997</span>
                     <span className="text-6xl font-extrabold text-white tracking-tighter">R$ 497</span>
                  </div>
                  <p className="text-green-500 font-bold text-xs uppercase tracking-wider bg-green-900/10 py-1.5 px-4 rounded-full inline-flex items-center gap-2 border border-green-900/30">
                     <span>Pagamento Único</span>
                     <span className="w-1 h-1 rounded-full bg-green-500"></span>
                     <span>Sem mensalidades</span>
                  </p>
              </div>

              {/* Compact List */}
              <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3 text-zinc-300 text-sm"><CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> <span><strong>Mapa de Vida 360°</strong> (Diagnóstico Completo)</span></li>
                <li className="flex items-start gap-3 text-zinc-300 text-sm"><CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> <span><strong>Guilda & Chefes</strong> (Comunidade Gamificada)</span></li>
                <li className="flex items-start gap-3 text-zinc-300 text-sm"><CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> <span><strong>Árvore de Habilidades</strong> (Ferramentas Reais)</span></li>
                <li className="flex items-start gap-3 text-zinc-300 text-sm"><CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> <span><strong>Codex Completo</strong> (50+ Aulas de Mindset)</span></li>
                <li className="flex items-start gap-3 text-zinc-300 text-sm"><CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> <span><strong>Panteão</strong> (Sistema de Ascensão Infinita)</span></li>
              </ul>

              <button onClick={() => handleBuyClick('hero_vitalicio')} className="w-full py-4 text-lg bg-red-600 text-white rounded-md font-bold uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-95">
                  Garantir Acesso <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </LazySection>

      {/* FAQ Section - Lazy Loaded */}
      <LazySection className="py-20 px-6 bg-zinc-950">
        <div className="max-w-3xl mx-auto">
           <div className="text-center mb-10">
            <h2 className="text-3xl font-bold uppercase font-mono mb-4 tracking-tighter">Dúvidas Frequentes</h2>
          </div>
          <div className="space-y-3">
             <FAQItem q="O que é o Hero Mindset 2.0?" a="É a evolução da plataforma. Agora, além das missões e Codex, incluímos um ecossistema social completo (Guilda), diagnóstico visual (Mapa 360) e progressão infinita (Panteão)." />
             <FAQItem q="Se eu já comprei, tenho acesso às novidades?" a="Sim! Quem tem acesso vitalício recebe todas as atualizações da plataforma base gratuitamente." />
             <FAQItem q="Funciona no celular?" a="Sim, é um Web App responsivo que funciona perfeitamente em qualquer navegador de celular ou computador." />
             <FAQItem q="Preciso pagar mensalidade?" a="Não. O acesso ao sistema base é vitalício com um pagamento único. Apenas a mentoria avançada via IA (Oráculo) é um upgrade opcional." />
          </div>
        </div>
      </LazySection>

      <footer className="text-center p-8 border-t border-zinc-900 bg-zinc-950">
        <p className="text-zinc-600 font-mono text-xs uppercase tracking-wider">© {new Date().getFullYear()} HERO MINDSET</p>
      </footer>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm p-6 relative shadow-2xl">
            <button onClick={() => setIsShareModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold font-mono uppercase mb-6 text-white text-center flex items-center justify-center gap-2"><Share2 className="w-5 h-5" /> Compartilhar</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button onClick={() => openShareLink(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`)} className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg flex flex-col items-center gap-2">
                <MessageCircle className="w-6 h-6 text-green-500" />
                <span className="text-xs font-mono text-zinc-300">Whats</span>
              </button>
               <button onClick={handleCopyLink} className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg flex flex-col items-center gap-2 col-span-2">
                <Copy className="w-6 h-6 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-300">Copiar Link</span>
              </button>
            </div>
             <div className="text-center text-xs text-zinc-500 h-5 font-mono">
                {copySuccess ? <p className="text-green-400">Link copiado!</p> : <p>Convide outros para a guilda.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;