import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, LogIn, CheckCircle, Play, Crown, Map, Users, GitMerge, LayoutDashboard, Briefcase, TrendingUp } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const LazySection = ({ children, className = "", id = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode, id?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) { setIsVisible(true); observer.disconnect(); }
      }, { threshold: 0.1, rootMargin: '100px' }
    );
    if (elementRef.current) { observer.observe(elementRef.current); }
    return () => observer.disconnect();
  }, []);

  return (
    <div id={id} ref={elementRef} className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`} {...props}>
      {children}
    </div>
  );
};

const LiteYouTubeEmbed = ({ videoId, title }: { videoId: string, title: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className="absolute inset-0 w-full h-full bg-black group cursor-pointer overflow-hidden rounded-xl">
      {!isLoaded ? (
        <button onClick={() => setIsLoaded(true)} className="w-full h-full">
          <img src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-60" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center"><div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center"><Play className="w-8 h-8 text-white ml-1" /></div></div>
        </button>
      ) : (
        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full" />
      )}
    </div>
  );
};

const FAQItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`bg-zinc-900/50 rounded-lg border ${isOpen ? 'border-red-900/50' : 'border-zinc-800'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-5">
        <span className="font-mono font-bold">{q}</span>
        <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && <div className="p-5 pt-0 text-zinc-400">{a}</div>}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { handleBuy } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'heroi' | 'sucesso'>('heroi');
  const [activeArsenalTab, setActiveArsenalTab] = useState<'map' | 'guild' | 'skills' | 'pantheon'>('map');

  useEffect(() => {
    if ((window as any).fbq) { (window as any).fbq('track', 'ViewContent', { content_name: 'Hero Mindset 3.0', content_type: 'product' }); }
  }, []);

  const handleBuyClick = (productId: string) => {
    if ((window as any).fbq) { (window as any).fbq('track', 'InitiateCheckout', { currency: 'BRL', value: productId === 'sucesso_360' ? 275.00 : 497.00, content_ids: [productId] }); }
    handleBuy(productId);
  };

  const onGoToLogin = () => {
    navigate('/login');
  };

  const TabButton: React.FC<{
    label: string;
    icon: React.ElementType;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm font-mono uppercase rounded-lg transition-all active:scale-95 ${isActive ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-300 border border-transparent'}`} aria-selected={isActive} role="tab">
      <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : ''}`} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 font-sans overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-4 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2 font-mono font-black uppercase tracking-widest text-sm">
          <Shield className="w-5 h-5 text-red-600" aria-hidden="true" /> Hero Mindset <span className="text-zinc-500">3.0</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onGoToLogin} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition flex items-center gap-2"><LogIn className="w-3 h-3" /> Login</button>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-zinc-200 transition rounded">Acesso</button>
        </div>
      </nav>

      <header className="relative py-32 sm:py-40 px-6 text-center border-b border-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950"></div>
        <div className="relative z-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-10">
          <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 tracking-tighter font-mono uppercase">Forje Sua Lenda.</h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-3xl mx-auto">Um ecossistema que une <strong>Diagnóstico de Vida 360°</strong>, <strong>Comunidade Gamificada</strong> e <strong>Ferramentas Reais</strong>.</p>
          <button onClick={() => handleBuyClick('hero_vitalicio')} className="bg-red-600 text-white px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-red-700 transition flex items-center gap-3 mx-auto">
            Iniciar Jornada <ChevronRight />
          </button>
        </div>
      </header>
      
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl aspect-video w-full"><LiteYouTubeEmbed videoId="7JQeToR6pQs" title="Hero Mindset VSL" /></div>
        </div>
      </section>

      <LazySection className="py-20 px-6 bg-zinc-900/20 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold uppercase font-mono mb-4">Um Ecossistema, Não um App.</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Integração total entre diagnóstico, planejamento, execução e comunidade.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800"><Map className="w-6 h-6 text-blue-500 mb-4" /><h3 className="text-lg font-bold mb-2">Clareza Total</h3><p className="text-zinc-400 text-sm">O Mapa 360° diagnostica 12 áreas da sua vida.</p></div>
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800"><Users className="w-6 h-6 text-red-500 mb-4" /><h3 className="text-lg font-bold mb-2">Tribo de Elite</h3><p className="text-zinc-400 text-sm">A Guilda é onde os heróis se reúnem.</p></div>
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800"><Crown className="w-6 h-6 text-yellow-500 mb-4" /><h3 className="text-lg font-bold mb-2">Legado Divino</h3><p className="text-zinc-400 text-sm">Sistema de Ascensão Panteão.</p></div>
          </div>
        </div>
      </LazySection>

      <LazySection id="pricing" className="py-20 px-6">
         {/* ... (Pricing section remains mostly the same, but uses handleBuyClick) ... */}
      </LazySection>

      <footer className="text-center p-8 border-t border-zinc-900"><p className="text-zinc-600 font-mono text-xs">© {new Date().getFullYear()} HERO MINDSET</p></footer>
    </div>
  );
};

export default LandingPage;
