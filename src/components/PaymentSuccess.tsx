import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle, Mail, KeyRound, User } from 'lucide-react';
import { STRIPE_HERO_PRICE_ID, EDUZZ_HERO_ID } from '../constants';
import { useUser } from '../contexts/UserContext';

const PaymentSuccess: React.FC = () => {
  const { handleAccountSetup } = useUser();
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();

  const [status, setStatus] = useState<'loading' | 'success' | 'input_required'>('loading');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isBaseProduct = productId === STRIPE_HERO_PRICE_ID || productId === EDUZZ_HERO_ID || productId === 'hero_vitalicio';
  const isUpgrade = !isBaseProduct;

  useEffect(() => {
    if (!productId) return;

    if (isUpgrade) {
      setStatus('loading');
      const timer = setTimeout(() => {
        handleAccountSetup(productId, { name: '', email: '' });
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    if (isBaseProduct) {
      const queryParams = new URLSearchParams(location.search);
      const urlName = queryParams.get('name');
      const urlEmail = queryParams.get('email');
      
      if (urlName && urlEmail) {
          setCustomerName(urlName);
          const tempPassword = Math.random().toString(36).slice(-8);
          const setupTimer = setTimeout(() => {
            handleAccountSetup(productId!, { name: urlName, email: urlEmail, password: tempPassword });
            setStatus('success');
          }, 2500);
          return () => clearTimeout(setupTimer);
      } else {
          setStatus('input_required');
      }
    }
  }, [productId, isBaseProduct, isUpgrade, handleAccountSetup, location.search]);

  const handleManualSetup = (e: React.FormEvent) => {
      e.preventDefault();
      if (customerName && email && password) {
          setStatus('loading');
          setTimeout(() => {
             handleAccountSetup(productId!, { name: customerName, email, password });
             setStatus('success');
          }, 1500);
      }
  };

  if (isUpgrade && productId) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[60] p-4 text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
        <h1 className="text-white font-mono text-xl uppercase tracking-widest">Pagamento Confirmado</h1>
        <p className="text-zinc-400 font-mono mt-2">Ativando seu upgrade...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-md relative z-10 animate-in fade-in">
        {status === 'loading' && ( <div className="text-center"> <Loader2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-spin" /> <h2 className="text-2xl font-bold text-white font-mono uppercase">PAGAMENTO CONFIRMADO</h2> <p className="text-zinc-400 mt-2 font-mono text-sm">Preparando seu Quartel-General...</p> </div> )}
        {status === 'input_required' && ( <div> <div className="text-center mb-6"> <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" /> <h2 className="text-xl font-bold text-white font-mono uppercase">Confirme seus Dados</h2> <p className="text-zinc-400 text-xs">Finalize seu cadastro.</p> </div> <form onSubmit={handleManualSetup} className="space-y-4"> <div><label className="block text-xs text-zinc-500 uppercase font-mono mb-1">Nome de Herói</label><div className="relative"><User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" /><input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded py-2 pl-9 text-sm" placeholder="Ex: Alex O Bravo"/></div></div> <div><label className="block text-xs text-zinc-500 uppercase font-mono mb-1">Email</label><div className="relative"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded py-2 pl-9 text-sm" placeholder="seu@email.com"/></div></div> <div><label className="block text-xs text-zinc-500 uppercase font-mono mb-1">Senha</label><div className="relative"><KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" /><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded py-2 pl-9 text-sm" placeholder="******"/></div></div> <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold uppercase tracking-widest rounded mt-4">Acessar</button> </form> </div> )}
        {status === 'success' && ( <div className="text-center"> <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" /> <h2 className="text-2xl font-bold text-white font-mono uppercase">Bem-vindo, {customerName}!</h2> <p className="text-zinc-400 mt-2 text-sm">Redirecionando...</p> </div> )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
