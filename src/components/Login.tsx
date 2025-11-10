import React, { useState, useEffect } from 'react';
import { Archetype, LifeMapCategory, ArchetypesList, LifeMapCategoriesList } from '../types';
import { ARCHETYPE_QUESTIONS, INITIAL_LIFE_MAP_SCORES, LIFE_MAP_QUESTIONS } from '../constants';
import { ArrowRight, Compass, Loader2, LogIn, User, KeyRound, AlertCircle, Shield, Mail, Target, CheckCircle, Sliders, Activity, MousePointerClick } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

// --- ONBOARDING COMPONENT ---

interface OnboardingProps {
  onComplete: (archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[], mapAnalysis?: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  
  // Archetype State
  const [currentArchetypeQuestion, setCurrentArchetypeQuestion] = useState(0);
  const [archetypeScores, setArchetypeScores] = useState<Record<Archetype, number>>(
    ArchetypesList.reduce((acc, arch) => ({ ...acc, [arch]: 0 }), {} as Record<Archetype, number>)
  );

  // Deep Dive Map State
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentMapQuestion, setCurrentMapQuestion] = useState(0);
  const [questionnaireScores, setQuestionnaireScores] = useState<Record<string, number>>({});

  // Final Data
  const [calculatedLifeMapScores, setCalculatedLifeMapScores] = useState<Record<LifeMapCategory, number>>(INITIAL_LIFE_MAP_SCORES);
  const [focusAreas, setFocusAreas] = useState<LifeMapCategory[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Archetype Handlers ---
  const handleArchetypeAnswer = (score: number) => {
    const question = ARCHETYPE_QUESTIONS[currentArchetypeQuestion];
    setArchetypeScores(prev => ({ ...prev, [question.archetype]: prev[question.archetype] + score }));

    if (currentArchetypeQuestion < ARCHETYPE_QUESTIONS.length - 1) {
      setCurrentArchetypeQuestion(prev => prev + 1);
    } else {
      setStep(2); // Move to Deep Dive intro
    }
  };

  // --- Deep Dive Handlers ---
  const handleMapAnswer = (score: number) => {
      const category = LifeMapCategoriesList[currentCategoryIndex];
      const questions = LIFE_MAP_QUESTIONS[category];
      const questionId = questions[currentMapQuestion].id;

      setQuestionnaireScores(prev => ({ ...prev, [questionId]: score }));

      if (currentMapQuestion < questions.length - 1) {
          setCurrentMapQuestion(prev => prev + 1);
      } else {
          // Category finished
          if (currentCategoryIndex < LifeMapCategoriesList.length - 1) {
              setCurrentCategoryIndex(prev => prev + 1);
              setCurrentMapQuestion(0);
          } else {
              // All categories finished
              calculateFinalScores();
          }
      }
  };

  const calculateFinalScores = () => {
      // Scores calculation logic is handled in useEffect when step changes to 3 to ensure state is updated
      setStep(3);
  };

  // UseEffect to calculate scores when entering step 3 (Calibration Phase)
  useEffect(() => {
      if (step === 3) {
        const finalScores: Record<LifeMapCategory, number> = { ...INITIAL_LIFE_MAP_SCORES };
        LifeMapCategoriesList.forEach(category => {
            const questions = LIFE_MAP_QUESTIONS[category];
            let sum = 0;
            let maxPossible = questions.length * 5;
            questions.forEach(q => {
                sum += questionnaireScores[q.id] || 3; // Default 3 if missing
            });
            // Normalize to 1-10 scale
            const normalized = (sum / maxPossible) * 10;
            // Round to 1 decimal place
            finalScores[category] = Math.max(1, Math.round(normalized * 10) / 10);
        });
        setCalculatedLifeMapScores(finalScores);
      }
  }, [step]); // Removed questionnaireScores from dep array to prevent loop, calculated once on step entry


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
    setStep(5); // Loading screen

    try {
        const { generateDetailedLifeMapAnalysis } = await import('../services/geminiService');
        const analysis = await generateDetailedLifeMapAnalysis(calculatedLifeMapScores, focusAreas);
        setAiAnalysis(analysis);
    } catch (e) {
        console.error("AI Analysis failed", e);
        setAiAnalysis("O Oráculo não pôde gerar um relatório detalhado no momento. Siga sua intuição.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  useEffect(() => {
      if (step === 5 && !isAnalyzing && aiAnalysis !== undefined) {
          const finalArchetype = Object.entries(archetypeScores).sort((a, b) => Number(b[1]) - Number(a[1]))[0][0] as Archetype;
          onComplete(finalArchetype, calculatedLifeMapScores, focusAreas, aiAnalysis);
      }
  }, [step, isAnalyzing, aiAnalysis, archetypeScores, calculatedLifeMapScores, focusAreas, onComplete]);


  const renderStep = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="text-center animate-in fade-in">
            <Compass className="w-16 h-16 mx-auto text-zinc-500 mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold font-mono uppercase mb-4 tracking-tighter">A Jornada do Herói 360°</h1>
            <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Antes de avançar, precisamos de clareza absoluta. Este processo irá mapear 12 áreas da sua vida e revelar seu arquétipo de Herói.
            </p>
            <button
              onClick={() => setStep(1)}
              className="bg-white text-zinc-950 px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-transform active:scale-95 flex items-center gap-3 mx-auto"
            >
              Iniciar Diagnóstico <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );
      
      case 1: // Archetype Test
        const archQuestion = ARCHETYPE_QUESTIONS[currentArchetypeQuestion];
        const archProgress = (currentArchetypeQuestion / ARCHETYPE_QUESTIONS.length) * 100;
        return (
          <div className="w-full max-w-2xl mx-auto animate-in fade-in">
            <p className="text-center font-mono text-sm uppercase text-zinc-500 mb-2">Fase 1: Arquétipo ({currentArchetypeQuestion + 1}/{ARCHETYPE_QUESTIONS.length})</p>
            <div className="w-full bg-zinc-800 rounded-full h-1 mb-8">
              <div className="bg-red-600 h-1 rounded-full transition-all duration-300" style={{ width: `${archProgress}%` }}></div>
            </div>
            <p className="text-center text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed font-mono">"{archQuestion.text}"</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    onClick={() => handleArchetypeAnswer(score)}
                    className="w-12 h-12 rounded-full border-2 border-zinc-700 text-zinc-400 font-bold hover:bg-zinc-800 hover:border-red-500 hover:text-white transition-all active:scale-90"
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between w-full sm:w-auto sm:gap-4 text-xs font-mono text-zinc-500 uppercase px-4">
                  <span>Discordo</span>
                  <span>Concordo</span>
              </div>
            </div>
          </div>
        );

      case 2: // Deep Dive Map (Questions)
        const category = LifeMapCategoriesList[currentCategoryIndex];
        const mapQuestions = LIFE_MAP_QUESTIONS[category];
        const mapQ = mapQuestions[currentMapQuestion];
        
        const questionProgress = ((currentMapQuestion + 1) / mapQuestions.length) * 100;

        return (
           <div className="w-full max-w-2xl mx-auto animate-in fade-in">
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold font-mono uppercase text-white mb-1">{category}</h2>
                <p className="text-zinc-500 text-xs uppercase tracking-widest">Fase 2: Mapeamento Tático</p>
            </div>

            <div className="w-full bg-zinc-900 rounded-full h-1.5 mb-8 flex overflow-hidden">
                {/* Overall Progress Bar segments */}
                {LifeMapCategoriesList.map((cat, idx) => (
                    <div key={cat} className={`h-full flex-1 border-r border-black last:border-none ${
                        idx < currentCategoryIndex ? 'bg-green-600' : 
                        idx === currentCategoryIndex ? 'bg-zinc-800 relative' : 'bg-zinc-900'
                    }`}>
                         {idx === currentCategoryIndex && (
                             <div className="bg-yellow-500 h-full transition-all duration-300" style={{width: `${questionProgress}%`}}></div>
                         )}
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl min-h-[200px] flex flex-col justify-center">
                 <p className="text-center text-lg sm:text-xl mb-8 leading-relaxed">"{mapQ.text}"</p>
                 <div className="flex flex-col gap-4">
                    <div className="flex justify-between px-2 text-xs font-mono text-zinc-500 uppercase">
                        <span>Nunca</span>
                        <span>Sempre</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map(score => (
                        <button
                            key={score}
                            onClick={() => handleMapAnswer(score)}
                            className="h-14 rounded border border-zinc-700 bg-zinc-800 text-zinc-400 font-bold hover:bg-zinc-700 hover:border-yellow-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                        >
                            {score}
                        </button>
                        ))}
                    </div>
                 </div>
            </div>
          </div>
        );

      case 3: // Interactive Map Calibration (NEW STEP)
        const chartData = LifeMapCategoriesList.map(cat => ({
            subject: cat,
            score: calculatedLifeMapScores[cat],
            fullMark: 10
        }));

        const averageScore = ((Object.values(calculatedLifeMapScores) as number[]).reduce((a, b) => a + b, 0) / LifeMapCategoriesList.length).toFixed(1);
        
        return (
            <div className="w-full max-w-6xl mx-auto animate-in fade-in flex flex-col lg:flex-row gap-8 items-start">
                {/* Left: Chart & Summary */}
                <div className="w-full lg:w-1/2 space-y-6">
                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold font-mono uppercase text-white flex items-center justify-center lg:justify-start gap-2">
                            <Activity className="w-6 h-6 text-red-500" /> Mapa Tático
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">Visualize o terreno da sua vida. Ajuste se necessário.</p>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 aspect-square relative shadow-2xl">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                <PolarGrid stroke="#27272a" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar name="Herói" dataKey="score" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                        
                        {/* Stats Overlay */}
                        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur px-3 py-2 rounded border border-zinc-800">
                            <p className="text-[10px] text-zinc-500 font-mono uppercase">Nível Geral</p>
                            <p className="text-xl font-bold text-white font-mono">{averageScore}/10</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setStep(4)}
                        className="w-full bg-white text-zinc-950 px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-3 justify-center shadow-lg shadow-white/10"
                    >
                        Confirmar Diagnóstico <CheckCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Right: Interactive Sliders */}
                <div className="w-full lg:w-1/2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                    <div className="flex items-center gap-2 mb-6 text-zinc-400 text-xs font-mono uppercase tracking-widest border-b border-zinc-800 pb-2 sticky top-0 bg-zinc-950/90 backdrop-blur z-10">
                        <Sliders className="w-4 h-4" /> Calibração Manual
                    </div>
                    
                    <div className="space-y-5">
                        {LifeMapCategoriesList.map(category => (
                            <div key={category} className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-zinc-300 font-mono">{category}</label>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                                        calculatedLifeMapScores[category] >= 8 ? 'bg-green-900/30 text-green-500' :
                                        calculatedLifeMapScores[category] <= 4 ? 'bg-red-900/30 text-red-500' :
                                        'bg-zinc-800 text-zinc-400'
                                    }`}>
                                        {calculatedLifeMapScores[category].toFixed(1)}
                                    </span>
                                </div>
                                <div className="relative flex items-center h-6">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="0.1"
                                        value={calculatedLifeMapScores[category]}
                                        onChange={(e) => setCalculatedLifeMapScores(prev => ({
                                            ...prev,
                                            [category]: parseFloat(e.target.value)
                                        }))}
                                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600 group-hover:bg-zinc-700 transition-colors"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );

       case 4: // Define Focus Areas (Old Step 3)
        return (
          <div className="w-full max-w-4xl mx-auto animate-in fade-in">
            <div className="text-center mb-8">
              <Target className="w-16 h-16 mx-auto text-zinc-500 mb-6" />
              <h1 className="text-3xl font-bold font-mono uppercase mb-2 tracking-tighter">Objetivos Primários</h1>
              <p className="text-zinc-400">Com base no seu mapa calibrado, selecione 3 áreas prioritárias para atacar nos próximos 90 dias.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
              {LifeMapCategoriesList.map(category => {
                const isSelected = focusAreas.includes(category);
                const score = calculatedLifeMapScores[category];
                let scoreColor = 'text-zinc-400';
                if (score <= 3) scoreColor = 'text-red-500';
                else if (score >= 8) scoreColor = 'text-green-500';

                return (
                  <button
                    key={category}
                    onClick={() => handleToggleFocusArea(category)}
                    className={`p-3 rounded-lg border transition-all duration-200 active:scale-95 flex flex-col items-center justify-center gap-2 min-h-[100px]
                      ${isSelected 
                        ? 'bg-zinc-800 border-white text-white ring-1 ring-white' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }
                      ${!isSelected && focusAreas.length === 3 ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={!isSelected && focusAreas.length === 3}
                  >
                    <span className="text-xs uppercase font-mono text-center">{category}</span>
                    <span className={`text-xl font-bold ${scoreColor}`}>{Math.round(score)}</span>
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={generateAnalysis}
              disabled={focusAreas.length !== 3}
              className="w-full bg-white text-zinc-950 px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gerar Dossiê Estratégico <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 5: // AI Analysis Loading (Old Step 4)
        return (
            <div className="text-center animate-in fade-in">
                <Loader2 className="w-16 h-16 mx-auto text-zinc-500 mb-6 animate-spin" />
                <h1 className="text-3xl font-bold font-mono uppercase mb-4 tracking-tighter">Consultando o Oráculo...</h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto animate-pulse">
                    Cruzando dados de {Object.keys(questionnaireScores).length} pontos de verificação.
                    <br/>Gerando estratégias personalizadas para suas fraquezas.
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


// --- LOGIN SCREEN COMPONENT ---

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