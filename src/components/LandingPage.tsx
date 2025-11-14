import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, LogIn, CheckCircle, Play, Bot, Award, Share2, Briefcase, TrendingUp, Activity, Brain, Zap, HeartHandshake, Target, Book, ScrollText, Sparkles, GitMerge, ShieldAlert } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { PRODUCTS, FRONTEND_URL, PROTECTION_MODULES } from '../constants';
import ChatbotWidget from './ChatbotWidget';
import { ProtectionModuleInfo } from '../types';

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
    return () => {if (elementRef.current) observer.disconnect()};
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
            <img 
              src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
              alt={title} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" 
            />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20"><div className="w-20 h-20 bg-red-600/80 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20 group-hover:bg-red-500 transition-colors"><Play className="w-8 h-8 text-white ml-1" /></div></div>
        </button>
      ) : (
        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full" />
      )}
    </div>
  );
};

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: any = {};

        if (difference > 0) {
            timeLeft = {
                dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
                horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutos: Math.floor((difference / 1000 / 60) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    useEffect(() => {
        const timer = setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearTimeout(timer);
    });
    
    return (
      <div className="flex justify-center gap-2 sm:gap-4">
        {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="text-center bg-zinc-900/50 p-2 rounded-lg min-w-[50px] sm:min-w-[70px] border border-zinc-800">
                <div className="text-2xl sm:text-3xl font-black font-mono text-white">{String(value).padStart(2, '0')}</div>
                <div className="text-[10px] sm:text-xs text-zinc-500 uppercase">{unit}</div>
            </div>
        ))}
      </div>
    );
};

const FAQItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`bg-zinc-900/50 rounded-lg border ${isOpen ? 'border-red-900/50' : 'border-zinc-800'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-5 text-left">
        <span className="font-mono font-bold">{q}</span>
        <ChevronRight className={`w-5 h-5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && <div className="p-5 pt-0 text-zinc-400 animate-in fade-in duration-300">{a}</div>}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { handleBuy } = useUser();
  const navigate = useNavigate();
  const [shareText, setShareText] = useState('Convoque Aliados');

  const onGoToLogin = () => {
    navigate('/login');
  };
  
  const handleShare = async () => {
    const shareData = {
        title: 'Hero Mindset 3.0: O Fim do Homem Comum',
        text: 'Eu declarei guerra contra minha versão fraca. Junte-se a mim na jornada para forjar sua lenda.',
        url: FRONTEND_URL,
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.url);
            setShareText('Link Copiado!');
            setTimeout(() => setShareText('Convoque Aliados'), 2000);
        }
    } catch (error) {
        setShareText('Falhou!');
        setTimeout(() => setShareText('Convoque Aliados'), 2000);
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 font-sans overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-4 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2 font-mono font-black uppercase tracking-widest text-sm">
          <Shield className="w-5 h-5 text-red-600" aria-hidden="true" /> Hero Mindset <span className="text-zinc-500">3.0</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
            <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} 
                className="bg-black text-yellow-400 border-2 border-yellow-500 text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-yellow-900/50 transition rounded-lg animate-button-glow shadow-lg shadow-yellow-500/10">
                Acesso Black Friday
            </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onGoToLogin} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition flex items-center gap-2">
            <LogIn className="w-3 h-3" /> Login
          </button>
        </div>
      </nav>

      <header className="relative py-32 sm:py-40 px-6 text-center border-b border-zinc-900 overflow-hidden h-[80vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                poster="https://i.ytimg.com/vi/7JQeToR6pQs/maxresdefault.jpg"
            >
              {/* Placeholder for actual video source */}
              {/* <source src="your-video-url.mp4" type="video/mp4" /> */}
            </video>
            <div className="absolute inset-0 bg-black/60 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-transparent to-black/80"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-10">
          <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 tracking-tighter font-mono uppercase">O Fim do Homem Comum.</h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-3xl mx-auto">O sistema operacional que transforma disciplina em poder e execução em legado. A Black Friday é sua única chance de entrar com acesso vitalício.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="bg-red-600 text-white px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-3 shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-500/40">
              Declarar Guerra <ChevronRight />
            </button>
            <button onClick={handleShare} className="bg-transparent border border-zinc-700 text-zinc-300 px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-800 hover:border-zinc-600 hover:text-white transition flex items-center gap-3">
              {shareText} <Share2 className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </header>
      
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="p-1 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-2xl">
            <div className="bg-zinc-950 rounded-xl p-1">
              <div className="aspect-video w-full relative"><LiteYouTubeEmbed videoId="7JQeToR6pQs" title="Hero Mindset VSL" /></div>
            </div>
          </div>
        </div>
      </section>

      <LazySection className="py-20 px-6 bg-zinc-900/20 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold uppercase font-mono mb-4">Seu Arsenal Completo</h2>
            <p className="text-zinc-400 max-w-3xl mx-auto">Um ecossistema integrado para a guerra contra a mediocridade, dividido em três frentes de batalha.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
              <h3 className="text-lg font-bold font-mono uppercase text-red-500 mb-2">Arsenal Militar</h3>
              <p className="text-sm text-zinc-500 mb-4">A infantaria da sua jornada. Ferramentas para a execução diária e o combate direto.</p>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li className="flex items-start gap-3"><Target className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" /> <div><span className="font-bold">Missões</span><p className="text-zinc-500">Diretrizes diárias e semanais para acumular XP e provar seu valor.</p></div></li>
                <li className="flex items-start gap-3"><Book className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" /> <div><span className="font-bold">Codex</span><p className="text-zinc-500">Sua biblioteca de conhecimento tático sobre disciplina, foco e poder.</p></div></li>
                <li className="flex items-start gap-3"><Shield className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" /> <div><span className="font-bold">Guilda</span><p className="text-zinc-500">Una-se a outros heróis, combata chefes e compartilhe vitórias.</p></div></li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
              <h3 className="text-lg font-bold font-mono uppercase text-blue-500 mb-2">Arsenal Estratégico</h3>
               <p className="text-sm text-zinc-500 mb-4">Sua inteligência de combate. Ferramentas para clareza, análise e estratégia.</p>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li className="flex items-start gap-3"><Bot className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" /> <div><span className="font-bold">Oráculo IA</span><p className="text-zinc-500">Seu mentor IA que analisa seus dados e fornece diretrizes de combate.</p></div></li>
                <li className="flex items-start gap-3"><ScrollText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" /> <div><span className="font-bold">Diário de Bordo</span><p className="text-zinc-500">Registre sua jornada para que o Oráculo identifique padrões e fraquezas.</p></div></li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
              <h3 className="text-lg font-bold font-mono uppercase text-yellow-500 mb-2">Arsenal Pessoal</h3>
              <p className="text-sm text-zinc-500 mb-4">Sua pesquisa e desenvolvimento. Ferramentas para a evolução do seu personagem e legado.</p>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li className="flex items-start gap-3"><GitMerge className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" /> <div><span className="font-bold">Habilidades</span><p className="text-zinc-500">Desbloqueie ferramentas (Pomodoro, etc.) e bônus passivos.</p></div></li>
                <li className="flex items-start gap-3"><Sparkles className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" /> <div><span className="font-bold">Panteão</span><p className="text-zinc-500">Ascenda ao Nível 50 para desbloquear bônus divinos permanentes.</p></div></li>
              </ul>
            </div>
          </div>
        </div>
      </LazySection>
      
      <LazySection id="pricing" className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
           <div className="mb-12">
            <h2 className="text-4xl font-bold uppercase font-mono mb-4 text-yellow-400">Black Friday: Acesso Vitalício</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Esta oferta não se repetirá. Garanta seu lugar no Panteão dos Heróis para sempre. Acesso por assinatura após o término.</p>
            <div className="mt-8"><CountdownTimer targetDate="2024-11-28T23:59:59" /></div>
          </div>
          
          <div className="max-w-lg mx-auto">
            {PRODUCTS.filter(p => !p.isSubscription).map(product => (
              <div key={product.id} className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-xl border-2 border-yellow-500 p-8 flex flex-col shadow-2xl shadow-yellow-500/10 relative">
                 <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold uppercase px-4 py-1 rounded-full">Oferta Única</div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold font-mono uppercase mb-2">{product.name}</h3>
                  <p className="text-zinc-400 mb-6 text-sm min-h-[40px]">{product.description}</p>
                  <div className="mb-6 flex justify-center items-end gap-3">
                    <span className="text-3xl text-zinc-600 line-through">R${(product.originalPrice! / 100).toFixed(0)}</span>
                    <span className="text-6xl font-black text-white">R${(product.price / 100).toFixed(0)}</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-zinc-300 text-left max-w-xs mx-auto">
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Acesso vitalício à plataforma base</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Diagnóstico de Vida 360°</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Acesso a todos Módulos do Codex</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Missões Estáticas e Arsenal</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Acesso à Guilda, Esquadrões e Panteão</li>
                  </ul>
                </div>
                <button onClick={() => handleBuy(product.id)} className="w-full mt-auto bg-gradient-to-br from-yellow-400 to-yellow-500 text-black py-4 rounded-lg font-bold uppercase tracking-widest transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/40 active:scale-95 animate-button-glow">Garantir Acesso Vitalício</button>
                 <p className="text-xs text-zinc-500 mt-4">Upgrades para Mentor IA e Proteção 360 disponíveis opcionalmente dentro da plataforma.</p>
              </div>
            ))}
          </div>
        </div>
      </LazySection>

       <LazySection className="py-20 px-6 bg-zinc-950 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold uppercase font-mono mb-4">Os Protocolos de Proteção</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">Ferramentas de elite para dominar áreas específicas da sua vida. Disponível com a assinatura <span className="text-white font-bold">Proteção 360</span>.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {Object.values(PROTECTION_MODULES).map((module) => {
                    const typedModule = module as ProtectionModuleInfo;
                    const Icon = typedModule.icon;
                    return (
                        <div key={typedModule.id} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center group transition-all hover:border-${typedModule.color}-500/50 hover:bg-zinc-900/50`}>
                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center bg-zinc-800 mx-auto mb-4 border-2 border-transparent group-hover:border-${typedModule.color}-500/50 transition-colors`}>
                                <Icon className={`w-8 h-8 text-zinc-500 group-hover:text-${typedModule.color}-500 transition-colors`} />
                            </div>
                            <h3 className="font-bold font-mono uppercase text-sm text-white">{typedModule.name.split(' ')[0]}</h3>
                            <p className="text-xs text-zinc-500 mt-1">{typedModule.description}</p>
                        </div>
                    )
                })}
            </div>
        </div>
      </LazySection>

      <LazySection className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold uppercase font-mono mb-4">Dúvidas Frequentes</h2>
          </div>
          <div className="space-y-4">
            <FAQItem q="O que é o Acesso Vitalício da Black Friday?" a="É um pagamento único que garante seu acesso para sempre a toda a plataforma base e suas futuras atualizações. Sem mensalidades. As assinaturas de IA são upgrades opcionais." />
            <FAQItem q="Para quem é o Hero Mindset?" a="É para homens que buscam um sistema de auto-responsabilidade brutal. Se você valoriza disciplina e execução, este é seu lugar." />
            <FAQItem q="E se eu não gostar? Qual a garantia?" a="A mentalidade do herói não busca rotas de escape. Nossa garantia é o impacto que este sistema terá se você se comprometer." />
            <FAQItem q="Como funcionam os upgrades de IA e Proteção 360?" a="Após garantir seu Acesso Vitalício, você poderá ativar o Mentor IA ou a Proteção 360 (que inclui o Mentor e todos os Protocolos) como assinaturas mensais opcionais, diretamente de dentro da plataforma." />
          </div>
        </div>
      </LazySection>

      <LazySection className="py-20 px-6 bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-3xl mx-auto text-center flex flex-col sm:flex-row items-center gap-6">
          <ShieldAlert className="w-16 h-16 text-yellow-500 flex-shrink-0" />
          <div className="text-left">
            <h2 className="text-2xl font-bold font-mono uppercase mb-2 text-yellow-400">A Garantia do Herói</h2>
            <p className="text-zinc-400">Não há garantia de devolução do dinheiro, porque a mentalidade do herói não busca rotas de escape. A única garantia que importa é o seu compromisso. Nossa garantia é o impacto que este sistema terá na sua vida SE você se comprometer. Essa é a única garantia que um verdadeiro herói precisa.</p>
          </div>
        </div>
      </LazySection>

      <LazySection className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold font-mono uppercase mb-4 text-red-500">Ninguém Virá Te Salvar.</h2>
            <p className="text-lg text-zinc-300 mb-8">A decisão é sua. A hora é agora. Chegou a hora de parar de se perguntar e começar a construir, de parar de desejar e começar a executar.</p>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-black px-8 py-4 rounded-lg font-bold uppercase tracking-widest transition-all transform hover:scale-105 animate-button-glow">
                Iniciar Ascensão
            </button>
        </div>
      </LazySection>

      <footer className="text-center p-8 border-t border-zinc-900"><p className="text-zinc-600 font-mono text-xs">© {new Date().getFullYear()} HERO MINDSET</p></footer>
      
      <ChatbotWidget />
    </div>
  );
};

export default LandingPage;