import React, { useState } from 'react';
import { X, Sparkles, Loader2, ChevronLeft } from 'lucide-react';
import { getChatbotLandingReply } from '../services/geminiService';

const PREDEFINED_QUESTIONS = [
  "Este sistema realmente funciona para mim?",
  "Tenho medo de falhar. O que o Oráculo diz?",
  "Qual o primeiro passo para começar a mudança?",
  "O que exatamente eu ganho com o Acesso Vitalício?",
];

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'questions' | 'answer'>('questions');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuestionClick = async (question: string) => {
    setCurrentQuestion(question);
    setView('answer');
    setIsLoading(true);
    setAnswer('');
    try {
      const response = await getChatbotLandingReply(question);
      setAnswer(response);
    } catch (error) {
      setAnswer("O Oráculo está em comunhão com o cosmos. A resposta está na sua decisão de agir.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetView = () => {
    setView('questions');
    setCurrentQuestion('');
    setAnswer('');
  };

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-zinc-900 border-2 border-yellow-800 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-900/50 hover:scale-110 hover:border-yellow-600 transition-all duration-300 z-50"
        aria-label="Consultar Oráculo"
      >
        {isOpen ? <X className="w-8 h-8 text-yellow-300" /> : <Sparkles className="w-8 h-8 text-yellow-300" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] max-w-sm h-[70vh] max-h-[550px] bg-black/80 backdrop-blur-xl border border-yellow-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-5">
          <header className="flex items-center justify-between p-4 border-b border-yellow-800/30">
            <h3 className="font-mono font-bold text-white uppercase text-sm flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400" /> Oráculo da Clareza</h3>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
          </header>

          <div className="flex-grow overflow-y-auto p-4">
            {view === 'questions' && (
              <div className="animate-in fade-in">
                <p className="text-yellow-200/70 text-sm mb-4">Eu sou o Guardião deste santuário. Minha função é guiar aqueles que estão prontos para forjar sua lenda. A clareza precede a ação. Pergunte.</p>
                {PREDEFINED_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => handleQuestionClick(q)} className="w-full p-3 mb-2 bg-yellow-950/20 hover:bg-yellow-950/40 rounded-lg text-left text-yellow-100/90 text-sm font-mono transition-colors border border-yellow-800/30">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {view === 'answer' && (
              <div className="flex flex-col h-full animate-in fade-in">
                <button onClick={resetView} className="flex items-center gap-1 text-xs text-yellow-200/60 hover:text-white mb-3 font-mono">
                  <ChevronLeft className="w-3 h-3" /> Voltar
                </button>
                <p className="text-sm font-mono text-zinc-400 mb-4 p-2 bg-zinc-900 rounded border border-zinc-800">{currentQuestion}</p>
                <div className="flex-grow">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-yellow-500 animate-spin" /></div>
                  ) : ( <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{answer}</p> )}
                </div>
                 {!isLoading && (
                    <button onClick={scrollToPricing} className="mt-4 w-full bg-yellow-500 text-black py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-yellow-400 transition">
                        Iniciar Jornada
                    </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;