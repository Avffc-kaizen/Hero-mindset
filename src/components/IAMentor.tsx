
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { Bot, Lock, ChevronRight, Zap, Send, Loader2, User as UserIcon } from 'lucide-react';
import { useError } from '../contexts/ErrorContext';
import { isToday } from '../utils';
import { ORACLE_DAILY_MESSAGE_LIMIT } from '../constants';

const IAMentor: React.FC = () => {
  const { user, handleSendMentorMessage, handleRequestDailyAnalysis, handlePurchase, isProcessingPayment } = useUser();
  const { hasSubscription, mentorChatHistory } = user;
  
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { showError } = useError();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // FIX: isToday function expects only one argument (the timestamp to check).
  const hasAnalyzedToday = user.lastAnalysisTimestamp ? isToday(user.lastAnalysisTimestamp) : false;

  const messagesUsedToday = isToday(user.lastMentorMessageDate) ? user.mentorMessagesSentToday : 0;
  const messagesRemaining = ORACLE_DAILY_MESSAGE_LIMIT - messagesUsedToday;
  const limitReached = messagesRemaining <= 0;


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mentorChatHistory]);

  const handleSend = async () => {
    if (!input.trim() || isSending || limitReached) return;
    setIsSending(true);
    const messageToSend = input;
    setInput('');
    try {
      await handleSendMentorMessage(messageToSend);
    } catch (err: any) {
      // Error is already shown by the context
      setInput(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestAnalysis = async () => {
    if (isAnalyzing || hasAnalyzedToday) return;
    setIsAnalyzing(true);
    try {
        await handleRequestDailyAnalysis();
    } catch(err: any) {
        showError(err.message || "Ocorreu um erro ao contatar o Oráculo.");
    } finally {
        setIsAnalyzing(false);
    }
  };


  if (!hasSubscription) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center h-full">
        <div className="bg-zinc-900 border border-red-900/30 rounded-xl p-8 text-center relative overflow-hidden max-w-2xl">
          <Bot className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 font-mono uppercase">O Oráculo IA: Acesso Exclusivo</h2>
          <p className="text-zinc-400 max-w-lg mx-auto mb-6">
            Desbloqueie o potencial máximo da plataforma com o Plano Herói Total. Acesso ilimitado ao Oráculo, missões de IA e todos os Protocolos de Proteção.
          </p>
          <button
            onClick={() => handlePurchase('plano_heroi_total')}
            disabled={!!isProcessingPayment}
            className="bg-white text-black px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-zinc-200 inline-flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
          >
            {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Ativar Plano Herói Total <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto h-full flex flex-col">
       <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 font-mono uppercase">
            <Bot className="w-6 h-6" /> Oráculo: Elo Direto
            </h2>
            <p className="text-zinc-400 text-sm">Converse com seu mentor IA. Busque clareza.</p>
         </div>
         <button
            onClick={handleRequestAnalysis}
            disabled={isAnalyzing || hasAnalyzedToday}
            className="w-full sm:w-auto bg-zinc-800 text-white px-4 py-2.5 rounded font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
        >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
            {hasAnalyzedToday ? 'Análise Diária Recebida' : 'Solicitar Análise Diária'}
        </button>
       </div>
       
       <div className="flex-grow bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
            <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                {mentorChatHistory.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5 text-zinc-400"/></div>}
                        <div className={`p-3 rounded-lg max-w-lg text-sm ${msg.role === 'user' ? 'bg-red-900/40 text-white rounded-br-none' : 'bg-zinc-800/60 text-zinc-300 rounded-bl-none'}`}>
                           {msg.text.includes('**Análise Diária do Oráculo**') ? (
                                <div className="text-left space-y-3">
                                    {msg.text.split('\n').map((part, index) => {
                                        const [title, ...content] = part.split(':');
                                        if (!content.length || part.startsWith('**')) return <p key={index} className="font-bold text-red-400 font-mono uppercase text-sm">{part.replace(/\*\*/g, '')}</p>;
                                        return (
                                            <div key={index}>
                                                <h4 className="font-bold text-red-500 font-mono uppercase text-xs">{title}</h4>
                                                <p className="text-zinc-300 leading-relaxed mt-1 text-sm">{content.join(':').trim()}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                        </div>
                        {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-zinc-400"/></div>}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-zinc-700/50">
                <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-700 rounded-lg p-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={limitReached ? "Limite diário de mensagens atingido." : "Sua pergunta ao Oráculo..."}
                        className="flex-1 bg-transparent focus:outline-none text-white placeholder:text-zinc-500"
                        disabled={isSending || limitReached}
                    />
                    <button onClick={handleSend} disabled={isSending || !input.trim() || limitReached} className="p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5 text-white"/>}
                    </button>
                </div>
                <p className="text-xs text-zinc-500 text-center mt-2 font-mono">
                  {messagesRemaining > 0 ? `${messagesRemaining} de ${ORACLE_DAILY_MESSAGE_LIMIT} mensagens restantes hoje.` : 'Você usou todas as suas mensagens hoje.'}
                </p>
            </div>
       </div>
    </div>
  );
};

export default IAMentor;