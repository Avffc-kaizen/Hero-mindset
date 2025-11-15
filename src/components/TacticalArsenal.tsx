import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { PROTECTION_MODULES } from '../constants';
import { ProtectionModuleInfo } from '../types';
import { Lock, CheckCircle, Briefcase, Shield, Loader2 } from 'lucide-react';

const ModuleCard: React.FC<{ module: ProtectionModuleInfo; isActive: boolean; onActivate: () => void; isProcessing: boolean }> = ({ module, isActive, onActivate, isProcessing }) => {
  const navigate = useNavigate();
  const Icon = module.icon;
  
  const handleAction = () => {
    if (isActive) {
      navigate('/app/dashboard');
    } else {
      onActivate();
    }
  };

  return (
    <div className={`flex flex-col bg-zinc-900 border rounded-2xl p-6 transition-all duration-300 ${isActive ? `border-${module.color}-500/30 text-${module.color}-500 bg-${module.color}-900/10` : 'border-zinc-800'}`}>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isActive ? `bg-${module.color}-900/20` : 'bg-zinc-800'}`}>
            <Icon className={`w-6 h-6 ${isActive ? `text-${module.color}-500` : 'text-zinc-500'}`} />
          </div>
          {isActive ? (
            <span className="flex items-center gap-1.5 text-xs font-mono uppercase text-green-500"><CheckCircle className="w-4 h-4" /> Ativo</span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-mono uppercase text-zinc-500"><Lock className="w-4 h-4" /> Bloqueado</span>
          )}
        </div>
        <h3 className="text-lg font-bold font-mono uppercase text-white">{module.name}</h3>
        <p className="text-sm text-zinc-400 mt-2 min-h-[40px]">{module.description}</p>
      </div>
      <button 
        onClick={handleAction}
        disabled={isProcessing}
        className={`w-full h-11 mt-6 py-3 rounded font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center disabled:opacity-50 ${isActive ? `bg-zinc-800 hover:bg-zinc-700 text-zinc-200` : `bg-white hover:bg-zinc-200 text-black`}`}
      >
        {isProcessing && !isActive ? <Loader2 className="w-5 h-5 animate-spin"/> : isActive ? 'Gerenciar' : 'Ativar Protocolo'}
      </button>
    </div>
  );
};

const TacticalArsenal: React.FC = () => {
  const { user, handlePurchase, isProcessingPayment } = useUser();
  const allModules = Object.values(PROTECTION_MODULES);

  const handleActivate = () => {
    handlePurchase('protecao_360');
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black font-mono uppercase flex items-center gap-3">
          <Shield className="w-8 h-8 text-zinc-400" />
          Arsenal Tático
        </h2>
        <p className="text-zinc-400 mt-2">Protocolos de elite para dominar áreas específicas da sua vida.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allModules.map(moduleInfo => (
          <ModuleCard
            key={moduleInfo.id}
            module={moduleInfo}
            isActive={user.activeModules.includes(moduleInfo.id)}
            onActivate={handleActivate}
            isProcessing={isProcessingPayment === 'protecao_360'}
          />
        ))}
      </div>

       <div className="bg-zinc-900/50 border border-red-800/50 rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold font-mono uppercase text-white mb-2">Proteção 360</h3>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-6">Ative todos os protocolos do Arsenal Tático com uma única assinatura. Domínio total. Sem exceções.</p>
            <button 
                onClick={handleActivate}
                disabled={!!isProcessingPayment}
                className="bg-red-600 text-white px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-red-700 transition-transform active:scale-95 h-11 w-64 flex items-center justify-center disabled:opacity-50"
            >
                {isProcessingPayment === 'protecao_360' ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Ativar Proteção Total'}
            </button>
        </div>
    </div>
  );
};

export default TacticalArsenal;
