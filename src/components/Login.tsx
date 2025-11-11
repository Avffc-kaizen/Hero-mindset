import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archetype, LifeMapCategory, ArchetypesList, LifeMapCategoriesList } from '../types';
import { ARCHETYPE_QUESTIONS, INITIAL_LIFE_MAP_SCORES, LIFE_MAP_QUESTIONS } from '../constants';
import { ArrowRight, Compass, Loader2, LogIn, User, KeyRound, AlertCircle, Shield, Mail, Target, CheckCircle, Sliders, Activity, MousePointerClick } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { useUser } from '../contexts/UserContext';

export const Onboarding: React.FC = () => {
  const { handleOnboardingComplete } = useUser();
  const [step, setStep] = useState(0);
  const [currentArchetypeQuestion, setCurrentArchetypeQuestion] = useState(0);
  const [archetypeScores, setArchetypeScores] = useState<Record<Archetype, number>>(ArchetypesList.reduce((acc, arch) => ({ ...acc, [arch]: 0 }), {} as Record<Archetype, number>));
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentMapQuestion, setCurrentMapQuestion] = useState(0);
  const [questionnaireScores, setQuestionnaireScores] = useState<Record<string, number>>({});
  const [calculatedLifeMapScores, setCalculatedLifeMapScores] = useState<Record<LifeMapCategory, number>>(INITIAL_LIFE_MAP_SCORES);
  const [focusAreas, setFocusAreas] = useState<LifeMapCategory[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ... (rest of the component logic remains the same)

  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    setStep(5);
    try {
        const { generateDetailedLifeMapAnalysis } = await import('../services/geminiService');
        const analysis = await generateDetailedLifeMapAnalysis(calculatedLifeMapScores, focusAreas);
        setAiAnalysis(analysis);
    } catch (e) {
        setAiAnalysis("O Oráculo não pôde gerar um relatório detalhado no momento.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  useEffect(() => {
      if (step === 5 && !isAnalyzing && aiAnalysis !== undefined) {
          const finalArchetype = Object.entries(archetypeScores).sort((a, b) => Number(b[1]) - Number(a[1]))[0][0] as Archetype;
          handleOnboardingComplete(finalArchetype, calculatedLifeMapScores, focusAreas, aiAnalysis);
      }
  }, [step, isAnalyzing, aiAnalysis, archetypeScores, calculatedLifeMapScores, focusAreas, handleOnboardingComplete]);

  // ... (renderStep logic remains the same)
  
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* ... renderStep() will be called here ... */}
    </div>
  );
};


export const LoginScreen: React.FC = () => {
  const { handleLogin, handleForgotPassword } = useUser();
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email e senha são obrigatórios."); return; }
    setLoading(true);
    setError('');
    setMessage('');
    const result = await handleLogin(email, password);
    if (!result.success) {
      setError(result.message || 'Falha no login.');
      setLoading(false);
    }
  };
  
  const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) { setError("O email é obrigatório."); return; }
      setLoading(true);
      setError('');
      setMessage('');
      const result = await handleForgotPassword(email);
      setMessage(result.message);
      setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
       <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-md animate-in fade-in">
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
                <button onClick={() => navigate('/')} className="font-bold text-zinc-300 hover:text-white underline">
                    Aliste-se agora.
                </button>
            </p>
         </div>
      </div>
    </div>
  );
};
