import React, { useState } from 'react';
import { Archetype, LifeMapCategory, ArchetypesList, LifeMapCategoriesList } from '../types';
import { ARCHETYPE_QUESTIONS, INITIAL_LIFE_MAP_SCORES } from '../constants';
import { ArrowRight, Compass, Loader2, LogIn, User, KeyRound, AlertCircle, Shield, Mail, Target } from 'lucide-react';

// --- ONBOARDING COMPONENT (Previously the only component in this file) ---

interface OnboardingProps {
  onComplete: (archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[]) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [archetypeScores, setArchetypeScores] = useState<Record<Archetype, number>>(
    ArchetypesList.reduce((acc, arch) => ({ ...acc, [arch]: 0 }), {} as Record<Archetype, number>)
  );
  const [lifeMapScores, setLifeMapScores] = useState<Record<LifeMapCategory, number>>(INITIAL_LIFE_MAP_SCORES);
  const [focusAreas, setFocusAreas] = useState<LifeMapCategory[]>([]);

  const handleArchetypeAnswer = (score: number) => {
    const question = ARCHETYPE_QUESTIONS[currentQuestion];
    setArchetypeScores(prev => ({ ...prev, [question.archetype]: prev[question.archetype] + score }));

    if (currentQuestion < ARCHETYPE_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setStep(2); // Move to Life Map assessment
    }
  };
  
  const handleToggleFocusArea = (category: LifeMapCategory) => {
    setFocusAreas(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      if (prev.length < 3) {
        return [...prev, category];
      }
      return prev;
    });
  };

  const handleFinishOnboarding = () => {
    setStep(4); // Go to calculating step
    
    // FIX: Ensure values used in arithmetic operation are numbers.
    const finalArchetype = Object.entries(archetypeScores).sort((a, b) => Number(b[1]) - Number(a[1]))[0][0] as Archetype;

    setTimeout(() => {
      onComplete(finalArchetype, lifeMapScores, focusAreas);
    }, 2000);
  };

  // FIX: Explicitly cast currentQuestion to a number to resolve potential type ambiguity.
  const progress = (currentQuestion / ARCHETYPE_QUESTIONS.length) * 100;

  const renderStep = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="text-center animate-in fade-in">
            <Compass className="w-16 h-16 mx-auto text-zinc-500 mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold font-mono uppercase mb-4 tracking-tighter">A Jornada do Herói 360°</h1>
            <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Antes de avançar, precisamos de clareza. Este processo de diagnóstico rápido irá mapear seu estado atual e revelar seu arquétipo de Herói.
            </p>
            <button
              onClick={() => setStep(1)}
              className="bg-white text-zinc-950 px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-transform active:scale-95 flex items-center gap-3 mx-auto"
            >
              Iniciar Mapeamento <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );
      case 1: // Archetype Test
        const question = ARCHETYPE_QUESTIONS[currentQuestion];
        return (
          <div className="w-full max-w-2xl mx-auto animate-in fade-in">
            <p className="text-center font-mono text-sm uppercase text-zinc-500 mb-2">Diagnóstico Arquetípico ({currentQuestion + 1}/{ARCHETYPE_QUESTIONS.length})</p>
            <div className="w-full bg-zinc-800 rounded-full h-1 mb-8">
              <div className="bg-white h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-center text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed">"{question.text}"</p>
            <div className="flex justify-center items-center gap-2 md:gap-4">
              <span className="text-zinc-500 font-mono text-sm">Discordo</span>
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => handleArchetypeAnswer(score)}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-zinc-700 text-zinc-400 font-bold hover:bg-zinc-800 hover:border-white transition-all active:scale-90"
                >
                  {score}
                </button>
              ))}
              <span className="text-zinc-500 font-mono text-sm">Concordo</span>
            </div>
          </div>
        );
       case 2: // Life Map Assessment
        return (
          <div className="w-full max-w-3xl mx-auto animate-in fade-in">
            <h2 className="text-2xl font-bold text-center font-mono uppercase mb-2">Mapa de Vida 360°</h2>
            <p className="text-zinc-400 text-center mb-8">Avalie sua satisfação atual em cada uma das 12 áreas da sua vida. (1 = Muito Baixa, 10 = Excelente)</p>
            <div className="space-y-4">
              {LifeMapCategoriesList.map(category => (
                <div key={category} className="bg-zinc-900/50 p-3 rounded-lg">
                  <label className="flex justify-between items-center text-sm font-mono text-zinc-300 mb-2">
                    <span>{category}</span>
                    <span className="font-bold text-white bg-zinc-800 px-2 py-1 rounded">{lifeMapScores[category]}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={lifeMapScores[category]}
                    onChange={(e) => setLifeMapScores(prev => ({ ...prev, [category]: Number(e.target.value) }))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              ))}
            </div>
             <button
              onClick={() => setStep(3)}
              className="mt-8 w-full bg-white text-zinc-950 px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-transform active:scale-95 flex items-center gap-3 justify-center"
            >
              Definir Foco <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );
       case 3: // Define Focus Areas
        return (
          <div className="w-full max-w-3xl mx-auto animate-in fade-in">
            <div className="text-center mb-8">
              <Target className="w-16 h-16 mx-auto text-zinc-500 mb-6" />
              <h1 className="text-3xl font-bold font-mono uppercase mb-2 tracking-tighter">Defina Sua Missão</h1>
              <p className="text-zinc-400">Selecione as 3 áreas da sua vida que são sua prioridade máxima para os próximos 90 dias. Esta será sua missão principal.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {LifeMapCategoriesList.map(category => {
                const isSelected = focusAreas.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => handleToggleFocusArea(category)}
                    className={`p-4 rounded-lg border-2 text-center font-mono font-bold transition-all duration-200 active:scale-95
                      ${isSelected 
                        ? 'bg-zinc-800 border-white text-white' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }
                      ${!isSelected && focusAreas.length === 3 ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={!isSelected && focusAreas.length === 3}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleFinishOnboarding}
              disabled={focusAreas.length !== 3}
              className="mt-8 w-full bg-white text-zinc-950 px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Concluir e Gerar Mapa <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );
      case 4: // Calculating
        return (
            <div className="text-center animate-in fade-in">
                <Loader2 className="w-16 h-16 mx-auto text-zinc-500 mb-6 animate-spin" />
                <h1 className="text-3xl font-bold font-mono uppercase mb-4 tracking-tighter">Analisando Dados...</h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                    Consolidando seu perfil. Seu Mapa Heróico 360° está sendo gerado.
                </p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {renderStep()}
    </div>
  );
};


// --- LOGIN SCREEN COMPONENT (New) ---

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  onNavigateToLanding: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onForgotPassword, onNavigateToLanding }) => {
  const [view, setView] = useState<'login' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError("Email e senha são obrigatórios.");
        return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    const result = await onLogin(email, password);
    if (!result.success) {
      setError(result.message || 'Falha no login. Verifique suas credenciais.');
      setLoading(false);
    }
    // On success, App.tsx will navigate away.
  };
  
  const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) {
          setError("O email é obrigatório.");
          return;
      }
      setLoading(true);
      setError('');
      setMessage('');
      const result = await onForgotPassword(email);
      setMessage(result.message);
      setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
       <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-md relative z-10 animate-in fade-in">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white font-mono uppercase">{view === 'login' ? 'Santuário do Herói' : 'Recuperar Acesso'}</h2>
          <p className="text-zinc-400 mt-2">{view === 'login' ? 'Acesse seu Quartel-General.' : 'Insira seu email para redefinir a senha.'}</p>
        </div>

        {view === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
           {error && (
            <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Email de Registro</label>
            <div className="relative">
              <User className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-zinc-600 font-mono transition-colors"
                placeholder="seu@email.com"
              />
            </div>
          </div>
           <div>
            <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Senha de Comando</label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-zinc-600 font-mono transition-colors"
                placeholder="••••••••"
              />
            </div>
             <button type="button" onClick={() => { setView('forgotPassword'); setError(''); setMessage('');}} className="text-xs text-zinc-500 hover:text-white mt-2 font-mono underline">Esqueceu a senha?</button>
          </div>
          <div className="pt-2">
             <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-950 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Validando...' : (
                <>
                  Entrar <LogIn className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
        ) : (
        <form onSubmit={handleForgotSubmit} className="space-y-4">
           {error && (
            <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}
          {message && (
             <div className="bg-green-950/50 border border-green-900/50 text-green-400 px-4 py-3 rounded flex items-center gap-3 text-sm">
                {message}
             </div>
          )}
          <div>
            <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Email de Registro</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-zinc-600 font-mono transition-colors"
                placeholder="seu@email.com"
              />
            </div>
             <button type="button" onClick={() => { setView('login'); setError(''); setMessage(''); }} className="text-xs text-zinc-500 hover:text-white mt-2 font-mono underline">Voltar para o Login</button>
          </div>
          <div className="pt-2">
             <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-950 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação' }
            </button>
          </div>
        </form>
        )}
         <div className="text-center mt-6">
            <p className="text-sm text-zinc-500">
                Ainda não iniciou sua jornada?{' '}
                <button onClick={onNavigateToLanding} className="font-bold text-zinc-300 hover:text-white underline">
                    Aliste-se agora.
                </button>
            </p>
         </div>
      </div>
    </div>
  );
};