import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Calendar, Edit, Save, X, Lock, KeyRound, AlertTriangle, ChevronRight, CheckCircle, Award, Loader2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const Profile: React.FC = () => {
  const { user, handleUpdateUser: onUpdateProfile, handleReset: onDeleteAccount, handlePurchase, isProcessingPayment, handleForgotPassword: onPasswordChange } = useUser();
  const navigate = useNavigate();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const clearMsgTimerRef = useRef<number | null>(null);

  useEffect(() => { setTempName(user.name); }, [user.name]);
  useEffect(() => { return () => { if (clearMsgTimerRef.current) { window.clearTimeout(clearMsgTimerRef.current); } }; }, []);

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) { onUpdateProfile({ name: trimmed }); setIsEditingName(false); }
  };
  
  const handleChangePassword = async () => {
    if (!user.email) {
      setPasswordMessage("Email do usuário não encontrado.");
    } else {
      setPasswordMessage('Enviando...');
      try {
        const result = await onPasswordChange(user.email);
        setPasswordMessage(result?.message || (result ? 'Solicitação enviada.' : 'Falha na solicitação.'));
      } catch (err) {
        setPasswordMessage('Erro ao enviar solicitação.');
      }
    }
    if (clearMsgTimerRef.current) window.clearTimeout(clearMsgTimerRef.current);
    clearMsgTimerRef.current = window.setTimeout(() => setPasswordMessage(''), 5000);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation === user.name) {
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      onDeleteAccount();
    }
  };

  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—';

  const getSubscriptionStatus = () => {
      if(user.activeModules.length > 3) return { name: "Proteção 360", color: "text-red-400" };
      if(user.hasSubscription) return { name: "Mentor IA", color: "text-blue-400" };
      return { name: "Acesso Vitalício", color: "text-green-400" };
  }
  const subscription = getSubscriptionStatus();


  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold font-mono flex items-center gap-2 uppercase"><User className="w-6 h-6" /> Santuário do Herói</h2>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase">Identidade do Herói</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-700"><User className="w-8 h-8 text-zinc-400" /></div>
          <div className="flex-grow">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xl font-bold font-mono text-white focus:outline-none" />
                <button onClick={handleSaveName}><Save className="w-5 h-5 text-white" /></button>
                <button onClick={() => { setIsEditingName(false); setTempName(user.name); }}><X className="w-5 h-5 text-zinc-400" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">{user.name}</h2>
                <button onClick={() => setIsEditingName(true)}><Edit className="w-4 h-4" /></button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-zinc-400 text-sm mt-1">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> {user.rank} - Nível {user.level}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Início: {joinDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase">Status da Assinatura</h3>
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Award className={`w-6 h-6 ${subscription.color}`} />
            <div>
              <p className="font-bold font-mono text-white">{subscription.name}</p>
              <p className="text-xs text-zinc-400">Seu nível de acesso atual.</p>
            </div>
          </div>
          <button onClick={() => navigate('/app/arsenal')} className="w-full sm:w-auto px-4 py-2 bg-zinc-800 text-zinc-200 text-xs font-bold uppercase rounded hover:bg-zinc-700 transition-colors">Gerenciar</button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase">Gestão da Conta</h3>
        {passwordMessage && <div className="bg-green-950/50 border border-green-900/50 text-green-400 text-sm p-3 rounded-lg flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {passwordMessage}</div>}
        <div className="grid sm:grid-cols-2 gap-4">
          <button onClick={handleChangePassword} className="w-full text-left bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-center gap-3"><KeyRound className="w-5 h-5" /><div><p className="font-bold">Redefinir Senha</p><p className="text-xs text-zinc-500">Enviaremos um link.</p></div></button>
          {!user.hasSubscription && (<button onClick={() => handlePurchase('mentor_ia')} disabled={!!isProcessingPayment} className="w-full text-left bg-red-950/40 border border-red-900/50 p-4 rounded-lg flex items-center gap-3 disabled:opacity-50"><Lock className="w-5 h-5" /><div><p className="font-bold text-red-400">Upgrade Oráculo IA</p><p className="text-xs">Desbloqueie o acesso.</p></div>{isProcessingPayment ? <Loader2 className="w-5 h-5 ml-auto animate-spin" /> : <ChevronRight className="w-5 h-5 ml-auto text-red-500" />}</button>)}
        </div>
      </div>
      
      <div className="bg-red-950/20 border-2 border-red-900/50 rounded-xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-red-500 font-mono uppercase flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Zona de Risco</h3>
        <p className="text-zinc-400 text-sm">Ações nesta área são permanentes. Prossiga com cautela.</p>
        <div className="pt-2"><button onClick={() => setShowDeleteModal(true)} className="bg-red-800 text-white px-5 py-2 rounded font-bold uppercase tracking-wider text-sm">Encerrar Jornada</button></div>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-red-900 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-500 mb-2 font-mono flex items-center gap-2"><AlertTriangle className="w-6 h-6" /> FIM DA JORNADA</h2>
            <p className="text-zinc-400 mb-4">Esta ação é <strong className="text-red-400">IRREVERSÍVEL</strong>. Todos os dados serão apagados.</p>
            <p className="text-zinc-400 mb-4 text-sm">Para confirmar, digite seu nome de herói: <strong className="text-white font-mono">{user.name}</strong></p>
            <input type="text" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 font-mono mb-6" />
            <div className="flex gap-4"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-zinc-800 rounded font-bold">CANCELAR</button><button onClick={handleDeleteConfirm} disabled={deleteConfirmation !== user.name} className="flex-1 py-3 bg-red-800 rounded font-bold text-white disabled:bg-red-950/50 disabled:text-zinc-500">DELETAR</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;