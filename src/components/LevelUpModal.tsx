
import React, { useEffect, useState } from 'react';
import { RankTitle } from '../types';
import { Shield, Crown, Star, Hexagon, Sparkles, X, Sword, Zap } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  rank: RankTitle;
  onClose: () => void;
}

const RankInsigniaLarge: React.FC<{ rank: RankTitle }> = ({ rank }) => {
  let color = "text-zinc-400";
  let bg = "bg-zinc-800";
  let border = "border-zinc-600";
  let Icon = Shield;

  switch (rank) {
    case RankTitle.Iniciante: color = "text-zinc-400"; break;
    case RankTitle.Aventureiro: color = "text-green-400"; bg="bg-green-900/20"; border="border-green-500/50"; Icon = Hexagon; break;
    case RankTitle.Campeao: color = "text-blue-400"; bg="bg-blue-900/20"; border="border-blue-500/50"; Icon = Star; break;
    case RankTitle.Paladino: color = "text-purple-400"; bg="bg-purple-900/20"; border="border-purple-500/50"; Icon = Sword; break;
    case RankTitle.Lendario: color = "text-yellow-400"; bg="bg-yellow-900/20"; border="border-yellow-500/50"; Icon = Crown; break;
    case RankTitle.Divino: color = "text-red-500"; bg="bg-red-900/20"; border="border-red-500/50"; Icon = Sparkles; break;
  }

  return (
    <div className={`w-32 h-32 rounded-2xl flex items-center justify-center border-4 ${bg} ${border} shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 mx-auto mb-6`}>
      <Icon className={`w-16 h-16 ${color} drop-shadow-lg`} />
      <div className={`absolute inset-0 ${bg} blur-xl -z-10 opacity-50`}></div>
    </div>
  );
};

const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, rank, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className={`absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative w-full max-w-md bg-zinc-950 border-2 border-yellow-600/30 rounded-2xl p-8 text-center overflow-hidden transition-all duration-700 transform ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-10 opacity-0'}`}>
        
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,_rgba(234,179,8,0.15),_transparent_70%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10">
            <h2 className="text-yellow-500 font-bold font-mono uppercase tracking-[0.2em] text-sm mb-2 animate-pulse">Ascensão Registrada</h2>
            <h1 className="text-4xl sm:text-5xl font-black text-white font-mono italic uppercase tracking-tighter mb-8 text-shadow-lg">
                Nível {level}
            </h1>

            <RankInsigniaLarge rank={rank} />

            <div className="mb-8">
                <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest mb-2">Patente Atual</p>
                <p className="text-2xl font-bold text-white uppercase tracking-wide">{rank}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Skill Points</p>
                    <p className="text-xl font-mono text-white font-bold flex items-center justify-center gap-2">
                        +1 <Zap className="w-4 h-4 text-yellow-500"/>
                    </p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Status</p>
                    <p className="text-xl font-mono text-white font-bold flex items-center justify-center gap-2">
                        MAX
                    </p>
                </div>
            </div>

            <button 
                onClick={onClose}
                className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]"
            >
                Reivindicar Glória
            </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
