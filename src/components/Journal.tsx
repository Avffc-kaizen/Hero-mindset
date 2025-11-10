
import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { ScrollText, Send, Lock, Zap, CheckCircle, ChevronRight, Bot } from 'lucide-react';
import { analyzeJournalAI } from '../services/geminiService';

interface JournalProps {
  entries: JournalEntry[];
  onAddEntry: (content: string) => void;
  onUpdateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  userName: string;
  hasSubscription: boolean;
  onUpgrade: () => void;
}

const Journal: React.FC<JournalProps> = ({ entries, onAddEntry, onUpdateEntry, userName, hasSubscription, onUpgrade }) => {
  const [newContent, setNewContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSaveEntry = () => {
    if (newContent.trim()) {
      onAddEntry(newContent);
      setNewContent('');
    }
  };

  const handleRequestAnalysis = async () => {
    if (!hasSubscription || isAnalyzing) return;

    // Seleciona os 5 registros mais recentes que ainda não foram analisados.
    const entriesToAnalyze = entries.filter(e => !e.isAnalyzed).slice(0, 5);
    
    if (entriesToAnalyze.length === 0) {
      // Nenhuma entrada nova para analisar.
      return;
    }

    setIsAnalyzing(true);
    try {
      const feedback = await analyzeJournalAI(entriesToAnalyze, userName);
      
      // O feedback é para o lote. Anexe ao mais recente e marque todos como analisados.
      entriesToAnalyze.forEach((entry, index) => {
        if (index === 0) {
          // Anexa o feedback ao registro mais recente do lote.
          onUpdateEntry(entry.id, { aiFeedback: feedback, isAnalyzed: true });
        } else {
          // Apenas marca os outros como analisados.
          onUpdateEntry(entry.id, { isAnalyzed: true });
        }
      });
    } catch (error) {
      console.error("Failed to analyze journal", error);
      // Opcional: Mostrar uma mensagem de erro ao usuário.
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analisando...
                </span>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Solicitar Análise
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onUpgrade}
              className="bg-zinc-800 text-zinc-400 px-4 py-2 rounded font-bold uppercase tracking-wider flex items-center gap-2 text-sm hover:bg-zinc-700 transition active:scale-95"
            >
              <Lock className="w-3 h-3" /> Desbloquear Análise IA
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
      
      {!hasSubscription && entries.length > 0 && (
        <div className="bg-zinc-900 border border-red-900/30 rounded-xl p-6 text-center mt-4">
          <Lock className="w-8 h-8 text-red-500 mx-auto mb-2 opacity-50" />
          <h3 className="text-white font-bold uppercase font-mono mb-2">Análise do Mentor Bloqueada</h3>
          <p className="text-zinc-400 text-sm mb-4 max-w-md mx-auto">
            Assinantes recebem feedback, identificação de padrões e perguntas estratégicas do Mentor sobre seus registros.
          </p>
          <button onClick={onUpgrade} className="bg-white text-black px-4 py-2 rounded font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-zinc-200 transition active:scale-95 text-sm">
            Fazer Upgrade Agora <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Journal;
