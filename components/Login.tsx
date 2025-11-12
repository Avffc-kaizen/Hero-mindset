

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

  const handleArchetypeAnswer = (score: number) => {
    const question = ARCHETYPE_QUESTIONS[currentArchetypeQuestion];
    setArchetypeScores(prev => ({ ...prev, [question.archetype]: prev[question.archetype] + score }));
    if (currentArchetypeQuestion < ARCHETYPE_QUESTIONS.length - 1) {
      setCurrentArchetypeQuestion(prev => prev + 1);
    } else {
      setStep(2); // Move to Life Map questionnaire
    }
  };

  const handleLifeMapAnswer = (questionId: string, score: number) => {
    setQuestionnaireScores(prev => ({ ...prev, [questionId]: score }));

    const currentCategory = LifeMapCategoriesList[currentCategoryIndex];
    const categoryQuestions = LIFE_MAP_QUESTIONS[currentCategory];

    if (currentMapQuestion < categoryQuestions.length - 1) {
      setCurrentMapQuestion(prev => prev + 1);
    } else {
      if (currentCategoryIndex < LifeMapCategoriesList.length - 1) {
        setCurrentCategoryIndex(prev => prev + 1);
        setCurrentMapQuestion(0);
      } else {
        // Calculate final scores
        const finalScores = { ...INITIAL_LIFE_MAP_SCORES };
        LifeMapCategoriesList.forEach(cat => {
          const catQuestions = LIFE_MAP_QUESTIONS[cat];
          const totalScore = catQuestions.reduce((sum, q) => sum + (questionnaireScores[q.id] || 0), 0);
          finalScores[cat] = Math.round(totalScore / catQuestions.length);
        });
        setCalculatedLifeMapScores(finalScores);
        setStep(3); // Move to focus selection
      }
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


  const archetypeProgress = (currentArchetypeQuestion / ARCHETYPE_QUESTIONS.length) * 100;
  const lifeMapProgress = (currentCategoryIndex / LifeMapCategoriesList.length) * 100;

  const renderStep = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="text-center animate-in fade-in">
            <Compass className="w-16 h-16 mx-auto text-zinc-500 mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold font-mono uppercase mb-4 tracking-tighter">A Jornada do Herói 360°</h1>
            <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Antes de avançar, precisamos de clareza. Este processo de diagnóstico irá mapear seu estado atual e revelar seu arquétipo.
            </p>
            <button onClick={() => setStep(1)} className="bg-white text-zinc-950 px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-transform active:scale-95 flex items-center gap-3 mx-auto">
              Iniciar Mapeamento <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );
      case 1: // Archetype Test
        const question = ARCHETYPE_QUESTIONS[currentArchetypeQuestion];
        return (
          <div className="w-full max-w-2xl mx-auto animate-in fade-in">
            <p className="text-center font-mono text-sm uppercase text-zinc-500 mb-2">Diagnóstico Arquetípico ({currentArchetypeQuestion + 1}/{ARCHETYPE_QUESTIONS.length})</p>
            <div className="w-full bg-zinc-800 rounded-full h-1 mb-8"><div className="bg-white h-1 rounded-full" style={{ width: `${archetypeProgress}%` }}></div></div>
            <p className="text-center text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed">"{question.text}"</p>
            <div className="flex justify-center items-center gap-2 md:gap-4">
              <span className="text-zinc-500 font-mono text-sm">Discordo</span>
              {[1, 2, 3, 4, 5].map(score => ( <button key={score} onClick={() => handleArchetypeAnswer(score)} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-zinc-700 text-zinc-400 font-bold hover:bg-zinc-800 hover:border-white transition-all active:scale-90">{score}</button>))}
              <span className="text-zinc-500 font-mono text-sm">Concordo</span>
            </div>
          </div>
        );
       case 2: // Life Map Questionnaire
        const currentCategory = LifeMapCategoriesList[currentCategoryIndex];
        const categoryQuestions = LIFE_MAP_QUESTIONS[currentCategory];
        const mapQuestion = categoryQuestions[currentMapQuestion];
        return (
           <div className="w-full max-w-2xl mx-auto animate-in fade-in">
            <p className="text-center font-mono text-sm uppercase text-zinc-500 mb-2">Mapa de Vida: {currentCategory} ({currentMapQuestion + 1}/{categoryQuestions.length})</p>
            <div className="w-full bg-zinc-800 rounded-full h-1 mb-8"><div className="bg-white h-1 rounded-full" style={{ width: `${lifeMapProgress}%` }}></div></div>
            <p className="text-center text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed">"{mapQuestion.text}"</p>
            <div className="flex justify-center items-center gap-1 md:gap-2">
              <span className="text-zinc-500 font-mono text-xs text-right">Pouco<br/>Satisfeito</span>
              {[1,2,3,4,5,6,7,8,9,10].map(score => ( <button key={score} onClick={() => handleLifeMapAnswer(mapQuestion.id, score)} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-zinc-700 text-zinc-400 font-bold hover:bg-zinc-800 hover:border-white transition-all active:scale-90">{score}</button>))}
              <span className="text-zinc-500 font-mono text-xs text-left">Muito<br/>Satisfeito</span>
            </div>
          </div>
        );
       case 3: // Define Focus Areas
        return (
          <div className="w-full max-w-4xl mx-auto animate-in fade-in grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold font-mono uppercase mb-2 tracking-tighter">Seu Mapa 360°</h2>
              <p className="text-zinc-400 mb-4">Esta é sua configuração atual. Selecione 3 áreas para foco nos próximos 90 dias.</p>
              <div className="grid grid-cols-2 gap-3">
                {LifeMapCategoriesList.map(category => (<button key={category} onClick={() => handleToggleFocusArea(category)} className={`p-3 rounded-lg border-2 text-left font-mono font-bold transition-all text-sm ${focusAreas.includes(category) ? 'bg-zinc-800 border-white text-white' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'} ${!focusAreas.includes(category) && focusAreas.length === 3 ? 'opacity-50' : ''}`} disabled={!focusAreas.includes(category) && focusAreas.length === 3}> {category} </button>))}
              </div>
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 h-[300px] md:h-[400px]"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="80%" data={LifeMapCategoriesList.map(cat => ({ subject: cat, A: calculatedLifeMapScores[cat], fullMark: 10 }))}><PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10 }} /><PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} /><Radar name="Score" dataKey="A" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} /></RadarChart></ResponsiveContainer></div>
            <div className="md:col-span-2"><button onClick={generateAnalysis} disabled={focusAreas.length !== 3} className="w-full bg-white text-zinc-950 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50">Concluir e Gerar Análise <ArrowRight className="w-5 h-5 inline" /></button></div>
          </div>
        );
      case 5: // Analyzing
        return ( <div className="text-center animate-in fade-in"> <Loader2 className="w-16 h-16 mx-auto text-zinc-500 mb-6 animate-spin" /> <h1 className="text-3xl font-bold font-mono uppercase mb-4 tracking-tighter">O Oráculo está sendo ativado...</h1> <p className="text-zinc-400 text-lg">Aguarde um instante, sua jornada está para começar.</p> </div> );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {renderStep()}
    </div>
  );
};


export const LoginScreen: React.FC = () => {
  const { user, loadingAuth, handleLogin, handleGoogleLogin, handleForgotPassword } = useUser();
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loadingAuth) {
      if (user.isLoggedIn && user.onboardingCompleted) {
        navigate('/app/dashboard', { replace: true });
      } else if (user.isLoggedIn && !user.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user.isLoggedIn, user.onboardingCompleted, loadingAuth, navigate]);

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

  const onGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    const result = await handleGoogleLogin();
    if (!result.success) {
        setError(result.message || 'Falha no login com Google.');
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
          <button
              type="button"
              onClick={onGoogleLogin}
              disabled={loading}
              className="w-full bg-zinc-800 text-white py-3 rounded font-bold hover:bg-zinc-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.599 36.372 48 30.865 48 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
              Entrar com Google
          </button>
          <div className="flex items-center gap-3">
              <div className="flex-grow h-px bg-zinc-800"></div>
              <span className="text-xs text-zinc-500 font-mono">OU</span>
              <div className="flex-grow h-px bg-zinc-800"></div>
          </div>
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
              {loading ? <Loader2 className="animate-spin" /> : (
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
              {loading ? <Loader2 className="animate-spin" /> : 'Enviar Link de Recuperação' }
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