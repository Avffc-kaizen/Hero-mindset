
import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { ScrollText, Send, Lock, Zap, CheckCircle, ChevronRight, Bot, Loader2 } from 'lucide-react';
import { analyzeJournalAI } from '../services/geminiService';
import { useError } from '../contexts/ErrorContext';
import { useUser } from '../contexts/UserContext';

const Journal: React.FC = () => {
  const { user, handleAddJournalEntry: onAddEntry, handleUpdateJournalEntry: onUpdateEntry, handlePurchase, isProcessingPayment } = useUser();
  const { journalEntries: entries, name: userName, hasSubscription } = user;
  
  const [newContent, setNewContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { showError } = useError();

  const handleSaveEntry = () => {
    if (newContent.trim()) {
      onAddEntry(newContent);
      setNewContent('');
    }
  };

  const handleRequestAnalysis = async () => {
    if (!hasSubscription || isAnalyzing) return;

    const entriesToAnalyze = entries.filter(e => !e.isAnalyzed).slice(0, 5);
    
    if (entriesToAnalyze.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const feedback = await analyzeJournalAI(entriesToAnalyze, userName);
      
      entriesToAnalyze.forEach((entry, index) => {
        onUpdateEntry(entry.id, { 
            aiFeedback: index === 0 ? feedback : undefined, 
            isAnalyzed: true 
        });
      });
    } catch (error: any) {
      showError(error.message || "Falha ao analisar o diário.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasUnanalyzedEntries = entries.some(e => !e.isAnalyzed);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-4 font-mono flex items-center gap-2 uppercase">
        <ScrollText className="w-6 h-6 text-zinc-100" /> Diário do Herói
      </h2>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <label className="block text-sm text-zinc-400 font-mono uppercase mb-2">Novo Registro da Jornada</label>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-zinc-100 focus:outline-none focus:border-zinc-700 min-h-[120px] font-mono text-sm transition-colors"
          placeholder="Descreva suas vitórias, desafios, aprendizados e reflexões do dia..."
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSaveEntry}
            disabled={!newContent.trim()}
            className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-white transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Registrar
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
             <h3 className="font-bold text-zinc-200 flex items-center gap-2 font-mono uppercase text-sm">
               <Zap className="w-4 h-4 text-yellow-500" /> Análise do Mentor
             </h3>
             <p className="text-xs text-zinc-500 font-mono mt-1">
                {hasUnanalyzedEntries ? "Novos registros aguardando análise." : "Todos os registros analisados."}
             </p>
          </div>
          
          {hasSubscription ? (
            <button
              onClick={handleRequestAnalysis}
              disabled={isAnalyzing || !hasUnanalyzedEntries}
              className="bg-red-800 text-white px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-red-700 transition active:scale-95 flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </span>
              ) : ( <> <Zap className="w-4 h-4" /> Solicitar Análise </> )}
            </button>
          ) : (
            <button
              onClick={() => handlePurchase('plano_heroi_total')}
              disabled={!!isProcessingPayment}
              className="bg-zinc-800 text-zinc-400 px-4 py-2 rounded font-bold uppercase tracking-wider flex items-center gap-2 text-sm hover:bg-zinc-700 transition active:scale-95 disabled:opacity-50"
            >
              {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-3 h-3" />} 
              Desbloquear Plano Herói
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 font-mono border border-zinc-800 border-dashed rounded-xl">
            O diário está em branco. Toda grande jornada começa com uma única palavra.
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-zinc-500 font-mono bg-zinc-950 px-2 py-1 rounded">
                    {new Date(entry.date).toLocaleDateString()} - {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {entry.isAnalyzed && (
                    <span className="text-xs text-green-500 flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3 h-3" /> Analisado
                    </span>
                  )}
                </div>
                <p className="text-zinc-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">{entry.content}</p>
              </div>
              
              {entry.aiFeedback && (
                <div className="bg-zinc-950/50 border-t border-zinc-800 p-4 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-800"></div>
                  <h4 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2 font-mono uppercase">
                    <Bot size={16} /> Relatório do Mentor
                  </h4>
                  <p className="text-zinc-400 text-sm whitespace-pre-wrap leading-relaxed font-mono">
                    {entry.aiFeedback}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Journal;
