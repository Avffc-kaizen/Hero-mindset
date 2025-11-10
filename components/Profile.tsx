import React, { useState } from 'react';
import { UserState } from '../types';
import { User, Shield, Calendar, Edit, Save, X, Lock, KeyRound, AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react';

interface ProfileProps {
  user: UserState;
  onUpdateProfile: (updates: Partial<UserState>) => void;
  onDeleteAccount: () => void;
  onUpgrade: () => void;
  onPasswordChange: (email: string) => Promise<{ success: boolean, message: string }>;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile, onDeleteAccount, onUpgrade, onPasswordChange }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateProfile({ name: tempName.trim() });
      setIsEditingName(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (!user.email) {
      setPasswordMessage("Email do usuário não encontrado.");
      return;
    }
    setPasswordMessage('Enviando...');
    const result = await onPasswordChange(user.email);
    setPasswordMessage(result.message);
    setTimeout(() => setPasswordMessage(''), 5000); // Clear message after 5 seconds
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation === user.name) {
      onDeleteAccount();
    }
  };

  const joinDate = new Date(user.createdAt).toLocaleDateString('pt-BR');

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold font-mono flex items-center gap-2 uppercase">
        <User className="w-6 h-6" /> Santuário do Herói
      </h2>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase">Identidade do Herói</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-700">
            <User className="w-8 h-8 text-zinc-400" />
          </div>
          <div className="flex-grow">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xl font-bold font-mono text-white focus:outline-none focus:border-white"
                />
                <button onClick={handleSaveName} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded transition active:scale-95">
                  <Save className="w-5 h-5 text-white" />
                </button>
                <button onClick={() => { setIsEditingName(false); setTempName(user.name); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded transition active:scale-95">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">{user.name}</h2>
                <button onClick={() => setIsEditingName(true)} className="text-zinc-500 hover:text-white transition-colors active:scale-95">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-zinc-400 text-sm mt-1">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> {user.rank} - Nível {user.level}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Início da Jornada: {joinDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase">Gestão da Conta</h3>
        {passwordMessage && (
           <div className="bg-green-950/50 border border-green-900/50 text-green-400 text-sm p-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {passwordMessage}
           </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <button onClick={handleChangePassword} className="w-full text-left bg-zinc-950 border border-zinc-800 p-4 rounded-lg hover:border-zinc-700 transition-colors active:scale-95 flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-zinc-400" />
            <div>
              <p className="font-bold text-white">Redefinir Senha</p>
              <p className="text-xs text-zinc-500">Enviaremos um link de redefinição.</p>
            </div>
          </button>
          {!user.hasSubscription && (
             <button onClick={onUpgrade} className="w-full text-left bg-red-950/40 border border-red-900/50 p-4 rounded-lg hover:border-red-800 transition-colors active:scale-95 flex items-center gap-3">
              <Lock className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-bold text-red-400">Upgrade Oráculo IA</p>
                <p className="text-xs text-zinc-500">Desbloqueie o acesso ao Oráculo.</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto text-red-500" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-red-950/20 border-2 border-red-900/50 rounded-xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-red-500 font-mono uppercase flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Zona de Risco
        </h3>
        <p className="text-zinc-400 text-sm">
          Ações nesta área são permanentes e não podem ser desfeitas. Prossiga com cautela.
        </p>
        <div className="pt-2">
          <button onClick={() => setShowDeleteModal(true)} className="bg-red-800 text-white px-5 py-2 rounded font-bold uppercase tracking-wider hover:bg-red-700 transition-colors active:scale-95 text-sm">
            Encerrar Jornada (Deletar Conta)
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-zinc-900 border border-red-900 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-500 mb-2 font-mono flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" /> FIM DA JORNADA
            </h2>
            <p className="text-zinc-400 mb-4">
              Esta ação é <strong className="text-red-400">IRREVERSÍVEL</strong>. Todos os seus dados de progresso, missões e diários serão permanentemente apagados.
            </p>
            <p className="text-zinc-400 mb-4 text-sm">
              Para confirmar, digite seu nome de herói: <strong className="text-white font-mono">{user.name}</strong>
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white font-mono mb-6 focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-zinc-800 rounded font-bold text-zinc-300 hover:bg-zinc-700 transition active:scale-95">CANCELAR</button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmation !== user.name}
                className="flex-1 py-3 bg-red-800 rounded font-bold text-white hover:bg-red-700 disabled:bg-red-950/50 disabled:text-zinc-500 disabled:cursor-not-allowed transition active:scale-95"
              >
                DELETAR PERMANENTEMENTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;