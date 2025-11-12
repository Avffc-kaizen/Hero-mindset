
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archetype, LifeMapCategory, ArchetypesList, LifeMapCategoriesList } from '../types';
import { ARCHETYPE_QUESTIONS, INITIAL_LIFE_MAP_SCORES } from '../constants';
import { ArrowRight, Compass, Loader2, LogIn, User, KeyRound, AlertCircle, Shield, Mail, Target, CheckCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export const Onboarding: React.FC = () => {
  const { handleOnboardingComplete } = useUser();
  const [step, setStep] = useState(0);
  const [currentArchetypeQuestion, setCurrentArchetypeQuestion] = useState(0);
  const [archetypeScores, setArchetypeScores] = useState<Record<Archetype, number>>(ArchetypesList.reduce((acc, arch) => ({ ...acc, [arch]: 0 }), {} as Record<Archetype, number>));
  const [focusAreas, setFocusAreas] = useState<LifeMapCategory[]>([]);
  
  const handleArchetypeAnswer = (score: number) => {
    const question = ARCHETYPE_QUESTIONS[currentArchetypeQuestion];
    setArchetypeScores(prev => ({ ...prev, [question.archetype]: prev[question.archetype] + score }));
    if (currentArchetypeQuestion < ARCHETYPE_QUESTIONS.length - 1) {
      setCurrentArchetypeQuestion(prev => prev + 1);
    } else {
      setStep(2); // Move to Focus selection
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

  const finishOnboarding = () => {
    if (focusAreas.length !== 3) return;
    const finalArchetype = Object.entries(archetypeScores).sort((a, b) => Number(b[1]) - Number(a[1]))[0][0] as Archetype;
    // Use initial scores and skip AI analysis for a faster onboarding
    handleOnboardingComplete(finalArchetype, INITIAL_LIFE_MAP_SCORES, focusAreas, undefined);
  };
  
  const archetypeProgress = (currentArchetypeQuestion / ARCHETYPE_QUESTIONS.length) * 100;

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
       case 2: // Define Focus Areas (Minimalist)
        return (
          <div className="w-full max-w-2xl mx-auto animate-in fade-in">
            <Target className="w-16 h-16 mx-auto text-zinc-500 mb-6" />
            <h2 className="text-3xl font-bold font-mono uppercase mb-2 tracking-tighter text-center">Frentes de Batalha</h2>
            <p className="text-zinc-400 mb-6 text-center">A clareza precede o poder. Selecione as 3 áreas da sua vida que exigem sua atenção imediata para os próximos 90 dias.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {LifeMapCategoriesList.map(category => (
                    <button 
                        key={category} 
                        onClick={() => handleToggleFocusArea(category)} 
                        className={`p-3 rounded-lg border-2 text-center font-mono font-bold transition-all text-sm flex items-center justify-center gap-2
                            ${focusAreas.includes(category) ? 'bg-zinc-800 border-white text-white' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'} 
                            ${!focusAreas.includes(category) && focusAreas.length === 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!focusAreas.includes(category) && focusAreas.length === 3}
                    > 
                        {focusAreas.includes(category) && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {category} 
                    </button>
                ))}
            </div>
            <button 
                onClick={finishOnboarding} 
                disabled={focusAreas.length !== 3} 
                className="w-full bg-white text-zinc-950 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Confirmar e Iniciar Jornada <ArrowRight className="w-5 h-5 inline" />
            </button>
          </div>
        );
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
    // On success, navigation is handled by UserContext
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

  const switchView = (newView: 'login' | 'forgotPassword') => {
    setView(newView);
    setError('');
    setMessage('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"></div>
      <div className="bg-zinc-900/80 backdrop-blur-md p-8 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-md animate-in fade-in z-10">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white font-mono uppercase">
            {view === 'login' ? 'Santuário do Herói' : 'Recuperar Acesso'}
          </h2>
          <p className="text-zinc-400 mt-2">
            {view === 'login' ? 'Acesse seu Quartel-General.' : 'Insira seu email para redefinir a senha.'}
          </p>
        </div>

        {error && (
            <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded flex items-center gap-3 text-sm mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
        )}
        {message && (
             <div className="bg-green-950/50 border border-green-900/50 text-green-400 px-4 py-3 rounded flex items-center gap-3 text-sm mb-4">
                {message}
             </div>
        )}

        {view === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Email de Registro</label>
              <div className="relative"><User className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" /><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-zinc-600 font-mono transition-colors" placeholder="seu@email.com" /></div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Senha de Comando</label>
              <div className="relative"><KeyRound className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" /><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-zinc-600 font-mono transition-colors" placeholder="••••••••"/></div>
              <button type="button" onClick={() => switchView('forgotPassword')} className="text-xs text-zinc-500 hover:text-white mt-2 font-mono underline">Esqueceu a senha?</button>
            </div>
            <div className="pt-2"><button type="submit" disabled={loading} className="w-full bg-white text-zinc-950 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" /> : <><LogIn className="w-5 h-5" /> Entrar</>}</button></div>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div><label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Email de Registro</label><div className="relative"><Mail className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" /><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-zinc-600 font-mono transition-colors" placeholder="seu@email.com"/></div></div>
            <div className="pt-2"><button type="submit" disabled={loading} className="w-full bg-white text-zinc-950 py-4 rounded font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" /> : 'Enviar Link' }</button></div>
          </form>
        )}

         <div className="text-center mt-6">
            {view === 'forgotPassword' ? (
                <p className="text-sm text-zinc-500">Lembrou sua senha? <button onClick={() => switchView('login')} className="font-bold text-zinc-300 hover:text-white underline">Faça o Login.</button></p>
            ) : (
                <p className="text-sm text-zinc-500">Ainda não é um Herói? <button onClick={() => navigate('/')} className="font-bold text-zinc-300 hover:text-white underline">Aliste-se agora.</button></p>
            )}
         </div>
      </div>
    </div>
  );
};
