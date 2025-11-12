
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, KeyRound, User, Mail } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const PaymentSuccess: React.FC = () => {
  const { handleVerifyNewPurchase, handleAccountSetup, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams<{ productId: string }>();

  const [status, setStatus] = useState<'verifying' | 'creating_account' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [customerData, setCustomerData] = useState<{ name: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  
  const isBaseProduct = productId === 'hero_vitalicio';

  useEffect(() => {
    if (!isBaseProduct || user.isLoggedIn) {
      navigate('/app/dashboard', { replace: true });
      return;
    }
    
    const verify = async () => {
      const sessionId = new URLSearchParams(location.search).get('session_id');
      if (!sessionId) {
        setErrorMessage('ID da sessão de pagamento não encontrado.');
        setStatus('error');
        return;
      }
      
      const result = await handleVerifyNewPurchase(sessionId);
      if (result.success && result.name && result.email) {
        setCustomerData({ name: result.name, email: result.email });
        setStatus('creating_account');
      } else {
        setStatus('error');
        setErrorMessage(result.message || "Falha ao verificar sua compra. Contate o suporte.");
      }
    };
    
    if (status === 'verifying') {
      verify();
    }
  }, [isBaseProduct, user.isLoggedIn, navigate, location.search, handleVerifyNewPurchase, status]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData || !password) {
      setErrorMessage("Dados insuficientes para criar a conta.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    const result = await handleAccountSetup(customerData.name, customerData.email, password);

    if (!result.success) {
      setErrorMessage(result.message || 'Não foi possível criar sua conta. O email já pode estar em uso.');
      // Don't change status, so user can see the error and retry
    }
    // On success, the onAuthStateChanged listener in UserContext will trigger a redirect to /app/dashboard after onboarding
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-md relative z-10 animate-in fade-in">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-zinc-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-white font-mono uppercase">Verificando Pagamento</h2>
              <p className="text-zinc-400 mt-2 font-mono text-sm">Validando sua entrada no panteão...</p>
            </>
          )}
          {status === 'creating_account' && customerData && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white font-mono uppercase">Pagamento Confirmado!</h2>
              <p className="text-zinc-400 mt-2 mb-6 font-mono text-sm">Bem-vindo, Herói. Defina sua senha para acessar o santuário.</p>
              <form onSubmit={handleCreateAccount} className="space-y-4 text-left">
                  {errorMessage && <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{errorMessage}</div>}
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Seu Nome</label>
                    <div className="relative"><User className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" /><input type="text" value={customerData.name} readOnly className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 text-zinc-300 font-mono" /></div>
                  </div>
                   <div>
                    <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Seu Email</label>
                    <div className="relative"><Mail className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" /><input type="email" value={customerData.email} readOnly className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 text-zinc-300 font-mono" /></div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Crie sua Senha de Comando</label>
                    <div className="relative"><KeyRound className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 text-white font-mono focus:border-zinc-500" placeholder="Mínimo 6 caracteres" /></div>
                  </div>
                  <button type="submit" className="w-full mt-2 bg-green-600 text-white py-3 rounded font-bold uppercase tracking-widest hover:bg-green-700 transition">Finalizar e Entrar</button>
              </form>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white font-mono uppercase">Conta Criada</h2>
              <p className="text-zinc-400 mt-2 text-sm">Redirecionando para sua jornada...</p>
            </>
          )}
          {status === 'error' && (
             <>
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white font-mono uppercase">Ocorreu um Erro</h2>
              <p className="text-zinc-400 mt-2 text-sm">{errorMessage}</p>
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
