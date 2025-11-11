
import React, { useState, useEffect } from 'react';
import { generateDailyAnalysisAI } from '../services/geminiService';
import { UserState } from '../types';
import { Bot, Lock, ChevronRight, Zap } from 'lucide-react';
import { useError } from '../contexts/ErrorContext';

interface IAMentorProps {
  user: UserState;
  hasSubscription: boolean;
  onUpgrade: (productId: string) => void;
}

const isSameDay = (ts1: number, ts2: number) => {
    if (!ts1 || !ts2) return false;
    const d1 = new Date(ts1);
    const d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const IAMentor: React.FC<IAMentorProps> = ({ user, hasSubscription, onUpgrade }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useError();
  const [lastAnalysisTimestamp, setLastAnalysisTimestamp] = useState<number | null>(() => {
      const saved = localStorage.getItem('hero_last_analysis');
      return saved ? parseInt(saved, 10) : null;
  });

  const hasAnalyzedToday = lastAnalysisTimestamp ? isSameDay(Date.now(), lastAnalysisTimestamp) : false;

  useEffect(() => {
    if (lastAnalysisTimestamp) {
      localStorage.setItem('hero_last_analysis', lastAnalysisTimestamp.toString());
    }
  }, [lastAnalysisTimestamp]);

  const handleRequestAnalysis = async () => {
    if (isLoading || hasAnalyzedToday) return;
    setIsLoading(true);
    setAnalysis(null);

    try {
      const responseText = await generateDailyAnalysisAI({
        rank: user.rank,
        stats: user.stats,
        journalEntries: user.journalEntries,
      });
      setAnalysis(responseText);
      setLastAnalysisTimestamp(Date.now());
    } catch (error: any) {
      showError(error.message || "Ocorreu um erro ao contatar o Oráculo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasSubscription) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center h-full">
        <div className="bg-zinc-900 border border-red-900/30 rounded-xl p-8 text-center relative overflow-hidden max-w-2xl">
          <Bot className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 font-mono uppercase">O Oráculo IA: Acesso Exclusivo</h2>
          <p className="text-zinc-400 max-w-lg mx-auto mb-6">
            ELEVE SUA JORNADA COM SABEDORIA DIVINA. O Oráculo não é um assistente. É um mentor ancestral, que analisa sua jornada e oferece a clareza necessária para superar seus maiores desafios.
          </p>
          <button
            onClick={() => onUpgrade('mentor_ia')}
            className="bg-white text-black px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-zinc-200 inline-flex items-center gap-2 transition-transform active:scale-95"
          >
            Consultar o Oráculo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
       <div className="mb-6">
         <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 font-mono uppercase">
           <Bot className="w-6 h-6" /> Oráculo Diário
         </h2>
         <p className="text-zinc-400">Receba a sabedoria do dia para guiar sua jornada.</p>
       </div>
       
       <div className={`bg-zinc-900/50 border rounded-xl p-6 text-center transition-all duration-500 ${isLoading ? 'border-zinc-700' : 'border-zinc-800'}`}>
        {!analysis && !isLoading && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <Zap className="w-12 h-12 text-yellow-500/50 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2 font-mono">A sabedoria aguarda.</h3>
            <p className="text-zinc-400 mb-6">
              {hasAnalyzedToday ? "Você já recebeu o conselho do Oráculo hoje. Volte amanhã para uma nova perspectiva." : "Solicite sua análise diária para receber insights sobre sua jornada."}
            </p>
            <button
              onClick={handleRequestAnalysis}
              disabled={isLoading || hasAnalyzedToday}
              className="bg-white text-zinc-950 px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5" /> Receber Sabedoria
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center text-center py-8 animate-in fade-in duration-500">
             <div className="relative flex items-center justify-center w-20 h-20 mb-4">
                <div className="absolute w-full h-full bg-zinc-800 rounded-full animate-ping opacity-50"></div>
                <Bot className="w-10 h-10 text-zinc-300 relative" />
             </div>
             <p className="text-zinc-400 font-mono uppercase tracking-widest animate-pulse">
               O Oráculo está meditando...
             </p>
          </div>
        )}
        
        {analysis && !isLoading && (
            <div className="text-left space-y-4 animate-in fade-in text-sm sm:text-base">
                {analysis.split('\n').map((part, index) => {
                    const [title, ...content] = part.split(':');
                    if (!content.length) return <p key={index} className="text-zinc-300">{part}</p>;
                    return (
                        <div key={index}>
                            <h4 className="font-bold text-red-500 font-mono uppercase text-sm">{title}</h4>
                            <p className="text-zinc-300 leading-relaxed mt-1">{content.join(':').trim()}</p>
                        </div>
                    );
                })}
            </div>
        )}
       </div>
    </div>
  );
};

export default IAMentor;
