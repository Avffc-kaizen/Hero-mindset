
import React, { useEffect, useState, useRef } from 'react';
import { Shield, ChevronRight, LogIn, CheckCircle, Play, Bot, Crown, Map, Users, GitMerge, LayoutDashboard, Share2, X, Copy, MessageCircle, Terminal, Globe, Briefcase, TrendingUp, Activity } from 'lucide-react';

interface LandingPageProps {
  onBuy: (productId: string) => void;
  onGoToLogin: () => void;
}

// Componente para Lazy Loading de Seções (Performance)
const LazySection = ({ children, className = "", id = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode, id?: string }) => {
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
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div id={id} ref={elementRef} className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`} {...props}>
      {children}
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onBuy, onGoToLogin }) => {
  const [activeTab, setActiveTab] = useState<'heroi' | 'sucesso'>('heroi');
  const [activeArsenalTab, setActiveArsenalTab] = useState<'map' | 'guild' | 'skills' | 'pantheon'>('map');

  useEffect(() => {
    if ((window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', { content_name: 'Hero Mindset 3.0', content_type: 'product' });
    }
  }, []);

  const handleBuyClick = (productId: string) => {
    if ((window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', { currency: 'BRL', value: 497.00, content_ids: [productId] });
    }
    onBuy(productId);
  };

  const TabButton: React.FC<{
    label: string;
    icon: React.ElementType;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm font-mono uppercase rounded-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white ${
        isActive ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-300 border border-transparent'
      }`}
      aria-selected={isActive}
      role="tab"
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : ''}`} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 font-sans selection:bg-red-900 selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-4 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2 font-mono font-black uppercase tracking-widest text-sm">
          <Shield className="w-5 h-5 text-red-600" aria-hidden="true" /> Hero Mindset <span className="text-zinc-500">3.0</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onGoToLogin} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white rounded p-1">
            <LogIn className="w-3 h-3" aria-hidden="true" /> Login
          </button>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-zinc-200 transition focus:outline-none focus:ring-2 focus:ring-white rounded">
            Acesso
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Sistema Operacional v3.0 Online
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.9] mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 animate-in fade-in zoom-in-95 duration-1000">
            Construa Seu<br/>Ecossistema.
          </h1>
          
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-mono leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            Não é apenas disciplina. É engenharia de vida. <br/>
            <span className="text-white font-bold">Hero Mindset 3.0</span> integra alta performance pessoal e inteligência de negócios em uma única plataforma.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <button onClick={() => handleBuyClick('hero_vitalicio')} className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] focus:outline-none focus:ring-2 focus:ring-white rounded">
              Iniciar Protocolo <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })} className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 font-bold uppercase tracking-widest text-xs transition-all focus:outline-none focus:ring-2 focus:ring-white rounded">
              Explorar Sistema
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Feature Showcase - Lazy Loaded */}
      <LazySection id="showcase" className="py-20 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-start gap-16">
            
            <div className="flex-1 space-y-8 lg:sticky lg:top-24 flex flex-col lg:flex-row items-start gap-12 lg:space-y-0">
              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 bg-zinc-900 border border-white/10 rounded-full text-xs uppercase font-mono tracking-wider text-zinc-400">
                   <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> O Arsenal 3.0
                </div>
                <h2 className="text-3xl sm:text-4xl font-black uppercase font-mono mb-4 tracking-tighter text-white">Tecnologia de<br/>Guerra Pessoal</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    A maioria falha por falta de dados. O Hero Mindset traz visibilidade total sobre sua vida. Onde há clareza, a execução é inevitável.
                </p>
              </div>
              
              <div className="space-y-6 lg:w-1/2">
                <div className="flex gap-4 group">
                    <div className="mt-1 w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all"><Map className="w-5 h-5 text-zinc-400 group-hover:text-black" aria-hidden="true"/></div>
                    <div><h3 className="text-base font-bold text-white mb-1 font-mono uppercase">Mapa da Vida</h3><p className="text-zinc-500 text-xs">Visualize sua vida em 12 dimensões com gráficos de radar em tempo real.</p></div>
                </div>
                <div className="flex gap-4 group">
                    <div className="mt-1 w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all"><Users className="w-5 h-5 text-zinc-400 group-hover:text-black" aria-hidden="true"/></div>
                    <div><h3 className="text-base font-bold text-white mb-1 font-mono uppercase">Guilda Interativa</h3><p className="text-zinc-500 text-xs">Chat real, Feed e Batalhas contra Chefes. Networking de elite no plano Sucesso.</p></div>
                </div>
                <div className="flex gap-4 group">
                    <div className="mt-1 w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all"><GitMerge className="w-5 h-5 text-zinc-400 group-hover:text-black" aria-hidden="true"/></div>
                    <div><h3 className="text-base font-bold text-white mb-1 font-mono uppercase">Skill Tree</h3><p className="text-zinc-500 text-xs">Complete missões para liberar ferramentas (Pomodoro, Budget, CRM).</p></div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full mt-8 lg:mt-0">
               <div className="bg-black border border-white/10 rounded-xl shadow-2xl overflow-hidden relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-white/10 to-transparent opacity-20 blur-lg group-hover:opacity-40 transition-opacity"></div>
                  
                  {/* Mock Browser Header */}
                  <div className="bg-zinc-900 border-b border-white/5 p-3 flex items-center gap-2 relative z-10">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    <div className="ml-4 bg-black rounded px-2 py-1 text-[10px] text-zinc-600 font-mono flex-1 text-center border border-white/5">hero-os-v3.exe</div>
                  </div>

                  {/* Tabs */}
                  <div className="grid grid-cols-4 border-b border-white/5 bg-black p-1 gap-1 relative z-10">
                    <TabButton label="Mapa" icon={Map} isActive={activeArsenalTab === 'map'} onClick={() => setActiveArsenalTab('map')} />
                    <TabButton label="Guilda" icon={Users} isActive={activeArsenalTab === 'guild'} onClick={() => setActiveArsenalTab('guild')} />
                    <TabButton label="Skills" icon={GitMerge} isActive={activeArsenalTab === 'skills'} onClick={() => setActiveArsenalTab('skills')} />
                    <TabButton label="Panteão" icon={Crown} isActive={activeArsenalTab === 'pantheon'} onClick={() => setActiveArsenalTab('pantheon')} />
                  </div>

                  {/* Content Area */}
                  <div className="p-6 min-h-[400px] bg-zinc-950 relative z-10">
                    {/* Tab Content ... */}
                    {activeArsenalTab === 'map' && (
                      <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300">
                         <div className="relative w-64 h-64 mb-6">
                            {/* CSS Radar Chart Simulation */}
                            <div className="absolute inset-0 rounded-full border border-zinc-800"></div>
                            <div className="absolute inset-16 rounded-full border border-zinc-800 opacity-30"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-full opacity-20 bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0%,_white_15%,_transparent_20%,_white_40%,_transparent_60%,_white_85%,_transparent_100%)] rounded-full animate-[spin_10s_linear_infinite]"></div>
                            </div>
                            <div className="absolute inset-0 bg-black/80 m-4 rounded-full flex items-center justify-center backdrop-blur-sm border border-zinc-700">
                                <div className="text-center">
                                    <p className="text-xs text-zinc-500 font-mono uppercase">Foco Atual</p>
                                    <p className="text-xl font-bold text-white">FINANCEIRO</p>
                                    <p className="text-red-500 text-sm font-mono font-bold">Nível 3/10</p>
                                </div>
                            </div>
                         </div>
                         <p className="text-center text-zinc-500 text-xs font-mono max-w-xs">Diagnóstico em tempo real. Onde o gráfico recua, é onde você deve atacar.</p>
                      </div>
                    )}
                    {/* ... other tabs ... */}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </LazySection>

      {/* Pricing Section - The Choice */}
      <LazySection id="pricing" className="py-32 px-6 bg-black relative">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-black uppercase text-white tracking-tighter mb-4">Escolha seu Caminho</h2>
                <div className="inline-flex bg-zinc-900 p-1 rounded-lg border border-white/10">
                    <button 
                        onClick={() => setActiveTab('heroi')} 
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-white ${activeTab === 'heroi' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Iniciado
                    </button>
                    <button 
                        onClick={() => setActiveTab('sucesso')} 
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-white ${activeTab === 'sucesso' ? 'bg-yellow-600 text-black shadow-sm' : 'text-zinc-500 hover:text-yellow-500'}`}
                    >
                        Líder de Mercado
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                {/* PLANO HERÓI */}
                <div className={`relative group transition-all duration-500 h-full ${activeTab === 'heroi' ? 'opacity-100 scale-100' : 'opacity-50 scale-95 blur-[1px]'}`}>
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-zinc-700 to-transparent rounded-2xl opacity-50"></div>
                    <div className="relative bg-zinc-950 rounded-2xl p-8 border border-white/5 h-full flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-[0.3em] mb-4">Acesso Padrão</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white tracking-tighter">R$ 497</span>
                                <span className="text-zinc-600 line-through font-mono text-sm">R$ 997</span>
                            </div>
                            <p className="text-zinc-500 text-[10px] font-mono uppercase mt-2">Pagamento Único • Vitalício</p>
                        </div>
                        <ul className="space-y-4 mb-8 font-mono text-xs text-zinc-300 flex-grow">
                            <li className="flex gap-3"><CheckCircle className="w-4 h-4 text-white" aria-hidden="true" /> Sistema Operacional 3.0</li>
                            <li className="flex gap-3"><CheckCircle className="w-4 h-4 text-white" aria-hidden="true" /> Mapa de Vida & Diagnóstico</li>
                            <li className="flex gap-3"><CheckCircle className="w-4 h-4 text-white" aria-hidden="true" /> Guilda Padrão (Chat & Bosses)</li>
                            <li className="flex gap-3"><CheckCircle className="w-4 h-4 text-white" aria-hidden="true" /> Codex de Aulas Completo</li>
                        </ul>
                        <button onClick={() => handleBuyClick('hero_vitalicio')} className="w-full mt-auto py-4 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-xs rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white">
                            Começar Jornada
                        </button>
                    </div>
                </div>

                {/* PLANO SUCESSO 360 */}
                <div className={`relative group transition-all duration-500 h-full ${activeTab === 'sucesso' ? 'opacity-100 scale-100 z-10' : 'opacity-50 scale-95 blur-[1px]'}`}>
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-yellow-500 via-yellow-600/20 to-transparent rounded-2xl opacity-100 animate-pulse"></div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-widest z-20 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                        Recomendado
                    </div>
                    <div className="relative bg-black rounded-2xl p-8 border border-yellow-500/20 h-full flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Crown className="w-4 h-4" aria-hidden="true" /> Sucesso 360
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white tracking-tighter">R$ 275</span>
                                <span className="text-zinc-500 font-mono text-sm">/mês</span>
                            </div>
                            <p className="text-yellow-600/80 text-[10px] font-mono uppercase mt-2">Ou R$ 2.497/ano (25% OFF)</p>
                        </div>
                        <ul className="space-y-4 mb-8 font-mono text-xs text-zinc-300 flex-grow">
                            <li className="flex gap-3"><CheckCircle className="w-4 h-4 text-yellow-500" aria-hidden="true" /> <span className="text-white">Tudo do plano Padrão</span></li>
                            <li className="flex gap-3"><Briefcase className="w-4 h-4 text-yellow-500" aria-hidden="true" /> Business Roadmap Personalizado</li>
                            <li className="flex gap-3"><Globe className="w-4 h-4 text-yellow-500" aria-hidden="true" /> Vitrine de Negócios (Divulgação)</li>
                            <li className="flex gap-3"><Shield className="w-4 h-4 text-yellow-500" aria-hidden="true" /> Guilda <strong className="text-yellow-500">Protection 360</strong> (Networking Elite)</li>
                        </ul>
                        <button onClick={() => handleBuyClick('sucesso_360')} className="w-full mt-auto py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest text-xs rounded transition-colors shadow-[0_0_30px_rgba(234,179,8,0.2)] focus:outline-none focus:ring-2 focus:ring-yellow-500">
                            Aplicar para Elite
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </LazySection>

      <footer className="py-12 border-t border-white/5 bg-black text-center">
        <p className="text-zinc-600 text-[10px] uppercase font-mono tracking-widest">© {new Date().getFullYear()} Hero Mindset OS • Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
