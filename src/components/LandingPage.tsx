
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, LogIn, CheckCircle, Play, Bot, Award, Share2, Briefcase, TrendingUp, Activity, Brain, Zap, HeartHandshake, Target, Book, ScrollText, Sparkles, GitMerge, Map, Compass } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { PRODUCTS, FRONTEND_URL, PROTECTION_MODULES } from '../constants';
import ChatbotWidget from './ChatbotWidget';
import { ProtectionModuleInfo } from '../types';
import LiteYouTubeEmbed from './LiteYouTubeEmbed';

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
  const { handlePurchase } = useUser();
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

      <header className="relative py-32 sm:py-40 px-6 text-center border-b border-zinc-900 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1581022206213-91b5a279143c?q=80&w=2670&auto=format&fit=crop"
            alt="Soldados em silhueta contra um céu dramático, representando a jornada do herói."
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/30 via-zinc-950 to-zinc-950"></div>
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

      <LazySection className="py-20 px-6 bg-zinc-950 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold uppercase font-mono mb-4">Seu Arsenal Completo</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Um ecossistema integrado para a guerra contra a mediocridade.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-red-500/50 transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-900/20 rounded-lg flex items-center justify-center border border-red-500/30 group-hover:bg-red-900/40">
                  <Zap className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold font-mono uppercase text-white">Militar</h3>
              </div>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Quadro de Missões</span>
                    <p className="text-zinc-500 mt-1">Diretrizes diárias, semanais e marcos épicos para forjar disciplina e momentum.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Book className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Codex do Conhecimento</span>
                    <p className="text-zinc-500 mt-1">Sua biblioteca de protocolos e sabedoria heroica para dominar a jornada.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Guilda dos Heróis</span>
                    <p className="text-zinc-500 mt-1">Forje alianças, compita em esquadrões e ascenda no Panteão.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-900/40">
                  <Brain className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold font-mono uppercase text-white">Estratégico</h3>
              </div>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li className="flex items-start gap-3">
                  <Bot className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Oráculo IA</span>
                    <p className="text-zinc-500 mt-1">Seu mentor IA pessoal que analisa seus dados e fornece clareza estratégica.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ScrollText className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Diário de Bordo</span>
                    <p className="text-zinc-500 mt-1">Registre sua jornada para análise do Oráculo e auto-reflexão profunda.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Map className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Mapa de Vida 360°</span>
                    <p className="text-zinc-500 mt-1">Diagnóstico completo para mapear seu poder e identificar alvos prioritários.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-yellow-500/50 transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-900/20 rounded-lg flex items-center justify-center border border-yellow-500/30 group-hover:bg-yellow-900/40">
                  <Award className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold font-mono uppercase text-white">Pessoal</h3>
              </div>
              <ul className="space-y-4 text-zinc-300 text-sm">
                <li className="flex items-start gap-3">
                  <GitMerge className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Arsenal de Habilidades</span>
                    <p className="text-zinc-500 mt-1">Desbloqueie ferramentas táticas (Pomodoro, Box Breathing) para a execução diária.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Panteão Divino</span>
                    <p className="text-zinc-500 mt-1">Ascenda após o nível 50 e desbloqueie bônus permanentes para sua jornada.</p>
                  </div>
                </li>
                 <li className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Evolução Contínua</span>
                    <p className="text-zinc-500 mt-1">Ganhe XP, suba de nível, conquiste patentes e forje sua lenda no sistema.</p>
                  </div>
                </li>
              </ul>
            </div>
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
      
      <LazySection id="comando" className="py-20 px-6 bg-zinc-950 border-y border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold uppercase font-mono mb-4">Sua Central de Comando</h2>
            <p className="text-zinc-400 max-w-3xl mx-auto">Onde a estratégia encontra a execução. Uma interface projetada para a guerra contra a mediocridade.</p>
          </div>
          <div className="p-1 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-2xl">
            <div className="bg-zinc-950 rounded-xl p-1">
              <div className="aspect-video w-full relative"><LiteYouTubeEmbed videoId="cWrWyPtsllM" title="Demonstração da Central de Comando" /></div>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
                 <Compass className="w-8 h-8 text-zinc-400"/>
              </div>
              <h3 className="font-bold font-mono uppercase text-white">Dashboard 360°</h3>
              <p className="text-sm text-zinc-500 mt-2">Visão unificada de todas as suas frentes de batalha: missões, status e métricas.</p>
            </div>
             <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
                 <TrendingUp className="w-8 h-8 text-zinc-400"/>
              </div>
              <h3 className="font-bold font-mono uppercase text-white">Métricas de Performance</h3>
              <p className="text-sm text-zinc-500 mt-2">Acompanhe sua ascensão através de Nível, XP, Patente e Pontos Divinos.</p>
            </div>
             <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
                 <Bot className="w-8 h-8 text-zinc-400"/>
              </div>
              <h3 className="font-bold font-mono uppercase text-white">Diretrizes do Oráculo</h3>
              <p className="text-sm text-zinc-500 mt-2">Receba decretos estratégicos diários do seu mentor IA para guiar suas ações.</p>
            </div>
             <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
                 <Map className="w-8 h-8 text-zinc-400"/>
              </div>
              <h3 className="font-bold font-mono uppercase text-white">Análise do Mapa</h3>
              <p className="text-sm text-zinc-500 mt-2">Identifique seus pontos fortes e fracos com um diagnóstico de vida completo.</p>
            </div>
          </div>
        </div>
      </LazySection>

      <LazySection id="pricing" className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
           <div className="mb-12">
            <h2 className="text-4xl font-bold uppercase font-mono mb-4 text-yellow-400">Black Friday: Acesso Vitalício</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Esta oferta não se repetirá. Garanta seu lugar no Panteão dos Heróis para sempre.</p>
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
                  </ul>
                </div>
                <button onClick={() => handlePurchase(product.id)} className="w-full mt-auto bg-gradient-to-br from-yellow-400 to-yellow-500 text-black py-4 rounded-lg font-bold uppercase tracking-widest transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/40 active:scale-95 animate-button-glow">Garantir Acesso Vitalício</button>
                 <p className="text-xs text-zinc-500 mt-4">O Plano Herói Total, que inclui Oráculo IA e a Guilda, está disponível como upgrade.</p>
              </div>
            ))}
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
          </div>
        </div>
      </LazySection>

      <LazySection className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold font-mono uppercase mb-4 text-red-500">Ninguém Virá Te Salvar.</h2>
            <p className="text-lg text-zinc-300 mb-8">A decisão é sua. A hora é agora.</p>
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
