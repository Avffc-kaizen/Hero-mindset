import React from 'react';
import { UserState } from '../types';
import { PARAGON_PERKS } from '../constants';
import { Sparkles, Star, ShieldAlert } from 'lucide-react';

interface PantheonProps {
  user: UserState;
  onSpendPoint: (perkId: string) => void;
}

const Pantheon: React.FC<PantheonProps> = ({ user, onSpendPoint }) => {
  if (!user.isAscended) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <ShieldAlert className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-mono uppercase text-zinc-400">Acesso Negado</h2>
            <p className="text-zinc-500 mt-2">
              O Panteão é reservado para guerreiros que alcançaram o status de Mestre Híbrido (Nível 50) e ascenderam.
              <br/> Continue sua jornada e prove seu valor.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold font-mono flex items-center gap-2 uppercase">
          <Sparkles className="w-6 h-6 text-yellow-400" /> Panteão Heroico
        </h2>
        <p className="text-zinc-400">Invista seus Pontos de Panteão em melhorias permanentes.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
        <h3 className="text-lg font-bold font-mono text-zinc-200">Pontos Disponíveis</h3>
        <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-md border border-zinc-700">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="text-2xl font-bold font-mono text-white">{user.paragonPoints}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PARAGON_PERKS.map((perk) => {
          const currentLevel = user.paragonPerks[perk.id] || 0;
          const cost = perk.cost(currentLevel);
          const canAfford = user.paragonPoints >= cost;
          const isMaxLevel = currentLevel >= perk.maxLevel;

          return (
            <div key={perk.id} className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/10 hover:border-zinc-700">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center transition-colors group-hover:bg-zinc-700">
                   <perk.icon className="w-7 h-7 text-zinc-300 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <h4 className="text-lg font-bold font-mono text-white">{perk.name}</h4>
                  <p className="text-sm text-zinc-400">Nível {currentLevel} / {perk.maxLevel}</p>
                </div>
              </div>
              
              <p className="text-sm text-zinc-400 flex-grow mb-4">
                {perk.description(currentLevel)}
                {!isMaxLevel && <span className="block text-green-400 font-mono text-xs mt-1">Próximo Nível: {perk.description(currentLevel + 1)}</span>}
              </p>
              
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-4">
                  <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${(currentLevel / perk.maxLevel) * 100}%` }}></div>
              </div>
              
              <button
                onClick={() => onSpendPoint(perk.id)}
                disabled={isMaxLevel || !canAfford}
                className="w-full py-3 bg-zinc-800 text-white font-bold uppercase tracking-wider rounded transition-colors active:scale-95 group-hover:bg-yellow-600 group-hover:text-black disabled:group-hover:bg-zinc-950 disabled:bg-zinc-950 disabled:text-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isMaxLevel ? (
                  "NÍVEL MÁXIMO"
                ) : (
                  <>
                    <Star className="w-4 h-4" /> Aprimorar (Custo: {cost})
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pantheon;