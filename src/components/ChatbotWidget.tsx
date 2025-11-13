import React, { useState } from 'react';
import { Bot, X, Sparkles, Loader2, ChevronLeft, HelpCircle, UserPlus, Share2 } from 'lucide-react';
import { getChatbotLandingReply } from '../services/geminiService';
import { FRONTEND_URL } from '../constants';

const PREDEFINED_QUESTIONS = [
  "Qual o verdadeiro propósito desta jornada?",
  "Como a disciplina se transforma em poder?",
  "Estou pronto para abandonar minha antiga versão?",
  "O que significa 'forjar minha própria lenda'?",
  "Qual o primeiro passo para a maestria?",
  "Como o Oráculo pode me guiar dentro da plataforma?",
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
      setAnswer("O Oráculo está em comunhão com o cosmos. A verdadeira resposta está na sua decisão de agir.");
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
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            resetView();
          }
        }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-zinc-900 border-2 border-yellow-800 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-900/50 hover:scale-110 hover:border-yellow-600 transition-all duration-300 z-50 animate-pulse"
        aria-label="Consultar o Oráculo da Clareza"
      >
        {isOpen ? <X className="w-8 h-8 text-yellow-300" /> : <Sparkles className="w-8 h-8 text-yellow-300" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] max-w-sm h-[70vh] max-h-[550px] bg-black/80 backdrop-blur-xl border border-yellow-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <header className="flex items-center justify-between p-4 border-b border-yellow-800/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="font-mono font-bold text-white uppercase text-sm">Oráculo da Clareza</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
          </header>

          <div className="flex-grow overflow-y-auto p-4">
            {view === 'questions' && (
              <div className="animate-in fade-in duration-300">
                <p className="text-yellow-200/70 text-sm mb-4">As névoas da dúvida pairam sobre sua jornada. O que você busca esclarecer?</p>
                {PREDEFINED_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => handleQuestionClick(q)} className="w-full p-3 mb-2 bg-yellow-950/20 hover:bg-yellow-950/40 rounded-lg text-left text-yellow-100/90 text-sm font-mono transition-colors border border-yellow-800/30">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {view === 'answer' && (
              <div className="flex flex-col h-full animate-in fade-in duration-300">
                <button onClick={resetView} className="flex items-center gap-1 text-xs text-yellow-200/60 hover:text-white mb-3 font-mono">
                  <ChevronLeft className="w-3 h-3" /> Voltar
                </button>
                <p className="text-sm font-mono text-zinc-400 mb-4 p-2 bg-zinc-900 rounded-md border border-zinc-800">{currentQuestion}</p>
                <div className="flex-grow prose prose-sm prose-invert prose-p:text-zinc-300 leading-relaxed">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-yellow-500 animate-spin" /></div>
                  ) : ( <p className="whitespace-pre-wrap">{answer}</p> )}
                </div>
                 {!isLoading && answer && (
                    <button onClick={scrollToPricing} className="mt-4 w-full bg-yellow-500 text-black py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-yellow-400 transition-colors active:scale-95">
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