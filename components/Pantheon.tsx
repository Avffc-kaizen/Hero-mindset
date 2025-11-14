

import React from 'react';
import { PARAGON_PERKS } from './src/constants';
import { Sparkles, Star, ShieldAlert, ArrowUpCircle, Lock } from 'lucide-react';
import { useUser } from './src/contexts/UserContext';

const Pantheon: React.FC = () => {
  const { user, handleSpendParagonPoint: onSpendPoint } = useUser();

  if (!user.isAscended) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center h-full flex flex-col items-center justify-center">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 sm:p-12 max-w-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center border-2 border-zinc-800 mb-6 shadow-xl">
                    <Lock className="w-8 h-8 text-zinc-500" />
                </div>
                <h2 className="text-3xl font-black font-mono uppercase text-zinc-200 mb-4 tracking-tighter">Acesso Restrito</h2>
                <p className="text-zinc-400 text-lg mb-8 leading-relaxed max-w-md">O Panteão é o salão dos imortais. Apenas heróis que atingiram o Nível 50 e escolheram a <span className="text-white font-bold">Ascensão</span> podem entrar.</p>
                <div className="flex flex-col sm:flex-row gap-4 text-sm font-mono text-zinc-500 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-2"><span className={user.level >= 50 ? "text-green-500" : "text-zinc-600"}>●</span> Requisito: Nível 50</div>
                    <div className="hidden sm:block text-zinc-700">|</div>
                    <div className="flex items-center gap-2"><span className={user.isAscended ? "text-green-500" : "text-zinc-600"}>●</span> Status: Ascendido</div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
            <h2 className="text-3xl font-black font-mono flex items-center gap-3 uppercase text-white tracking-tighter">
            <Sparkles className="w-8 h-8 text-yellow-500 fill-yellow-500/20" /> Panteão Heroico
            </h2>
            <p className="text-zinc-400 mt-2 font-mono text-sm">A força adquirida aqui ecoa por todas as suas vidas futuras.</p>
        </div>
        <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
            <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-yellow-600 tracking-widest mb-0.5">Pontos Divinos</p>
                <p className="text-2xl font-black font-mono text-white leading-none">{user.paragonPoints}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/50">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PARAGON_PERKS.map((perk) => {
          const currentLevel = user.paragonPerks[perk.id] || 0;
          const cost = perk.cost(currentLevel);
          const canAfford = user.paragonPoints >= cost;
          const isMaxLevel = currentLevel >= perk.maxLevel;
          const progressPercent = (currentLevel / perk.maxLevel) * 100;

          return (
            <div key={perk.id} className="group bg-zinc-900 border border-zinc-800 hover:border-yellow-500/50 rounded-xl p-6 flex flex-col transition-all duration-300 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 top-0 bg-yellow-500/5 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${isMaxLevel ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-zinc-800 text-zinc-400 group-hover:text-yellow-500'}`}><perk.icon className="w-7 h-7" /></div>
                        <div>
                            <h4 className="text-lg font-bold font-mono text-white uppercase tracking-wide">{perk.name}</h4>
                            <p className="text-xs text-zinc-500 font-mono uppercase mt-1">Nível <span className="text-white font-bold">{currentLevel}</span> / {perk.maxLevel}</p>
                        </div>
                    </div>
                    {isMaxLevel && <div className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-[10px] font-bold uppercase border border-yellow-500/50">Maximizado</div>}
                </div>
                <div className="min-h-[60px] mb-4">
                    <p className="text-sm text-zinc-300 leading-relaxed">{perk.description(currentLevel)}</p>
                    {!isMaxLevel && <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500"><ArrowUpCircle className="w-3 h-3 text-green-500" /><span>Próximo: <span className="text-green-400">{perk.description(currentLevel + 1)}</span></span></div>}
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1.5 mb-6 border border-zinc-800/50"><div className={`h-1.5 rounded-full transition-all duration-500 ${isMaxLevel ? 'bg-yellow-500' : 'bg-zinc-600 group-hover:bg-yellow-600'}`} style={{ width: `${progressPercent}%` }}></div></div>
                <button onClick={() => onSpendPoint(perk.id)} disabled={isMaxLevel || !canAfford} className={`w-full py-3 font-bold uppercase tracking-widest rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-xs ${isMaxLevel ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-lg' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'}`}>
                    {isMaxLevel ? "Lenda Viva" : (<>{canAfford ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />} {canAfford ? 'Ascender Atributo' : 'Pontos Insuficientes'} {!isMaxLevel && <span className="ml-1 opacity-80">({cost} pts)</span>}</>)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pantheon;