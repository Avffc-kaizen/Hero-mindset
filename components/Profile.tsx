

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Calendar, Edit, Save, X, Lock, KeyRound, AlertTriangle, ChevronRight, CheckCircle, Award, Loader2 } from 'lucide-react';
// FIX: Corrected import paths to point to files within the 'src' directory.
import { useUser } from './src/contexts/UserContext';

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
                <button onClick={() => { setIsEditingName(false); setTempName