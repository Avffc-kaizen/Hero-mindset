import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, Mail, KeyRound, User, AlertCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { PRODUCTS } from '../constants';
import { useError } from '../contexts/ErrorContext';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

const PaymentSuccess: React.FC = () => {
  const { user, handleVerifyNewPurchase, handleSignUp, handleVerifyUpgrade } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useError();
  const { productId } = useParams<{ productId: string }>();

  const [status, setStatus] = useState<'verifying' | 'input_required' | 'generic_success' | 'error'>('verifying');
  const [customerData, setCustomerData] = useState<{ name: string; email: string } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const firedPixel = useRef(false);
  const isBaseProduct = productId === 'hero_vitalicio';

  useEffect(() => {
    const verify = async () => {
      const searchParams = new URLSearchParams(location.search);
      let sessionId = searchParams.get('session_id');

      if (!sessionId) {
        const hashParams = new URLSearchParams(location.hash.split('?')[1]);
        sessionId = hashParams.get('session_id');
      }

      const product = PRODUCTS.find(p => p.id === productId);

      const firePurchaseEvent = () => {
          if (typeof window.fbq === 'function' && product && !firedPixel.current) {
          window.fbq('track', 'Purchase', {
              value: product.price / 100,
              currency: 'BRL',
              content_ids: [productId!],
              content_name: product.name,
              content_type: 'product'
          });
          firedPixel.current = true;
          }
      }

      if (!sessionId) {
        firePurchaseEvent();
        setStatus('generic_success');
        return;
      }
      
      if (user.isLoggedIn) {
          const result = await handleVerifyUpgrade(sessionId);
          if (result.success) {
              firePurchaseEvent();
              navigate('/app/dashboard', { replace: true });
          } else {
              showError(result.message || 'Falha ao verificar seu upgrade.');
              setStatus('error');
          }
      } else {
          if (!isBaseProduct) {
              showError('Apenas a compra do acesso vitalício é permitida para novos usuários.');
              setStatus('error');
              return;
          }
          const result = await handleVerifyNewPurchase(sessionId);
          if (result.success && result.name && result.email) {
              firePurchaseEvent();
              setCustomerData({ name: result.name, email: result.email });
              setStatus('input_required');
          } else {
              setStatus('error');
              showError(result.message || "Falha ao verificar sua compra. Contate o suporte.");
          }
      }
    };
    
    if (status === 'verifying') {
      verify();
    }
  }, [status, user.isLoggedIn, isBaseProduct, navigate, location, handleVerifyNewPurchase, handleVerifyUpgrade, productId, showError]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customerData?.name || name;
    const finalEmail = customerData?.email || email;

    if (!finalName || !finalEmail || !password) {
      showError("Todos os campos são obrigatórios.");
      return;
    }
    if (password.length < 6) {
      showError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    await handleSignUp(finalName, finalEmail, password);
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

          {(status === 'generic_success' || (status === 'input_required' && customerData)) && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white font-mono uppercase">Pagamento Confirmado!</h2>
              <p className="text-zinc-400 mt-2 mb-6 font-mono text-sm">
                {status === 'generic_success'
                  ? 'Crie sua conta para acessar a plataforma. Use o mesmo email da compra.'
                  : 'Bem-vindo, Herói. Defina sua senha para acessar o santuário.'
                }
              </p>
              <form onSubmit={handleCreateAccount} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Nome de Herói</label>
                    <div className="relative"><User className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" />
                      <input type="text" value={customerData?.name || name} onChange={e => setName(e.target.value)} readOnly={!!customerData?.name} className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 font-mono ${customerData?.name ? 'text-zinc-300' : 'text-white'}`} />
                    </div>
                  </div>
                   <div>
                    <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Email de Registro</label>
                    <div className="relative"><Mail className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" />
                      <input type="email" value={customerData?.email || email} onChange={e => setEmail(e.target.value)} readOnly={!!customerData?.email} className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 font-mono ${customerData?.email ? 'text-zinc-300' : 'text-white'}`} placeholder="Use o email da compra"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase font-mono mb-2">Senha de Comando</label>
                    <div className="relative"><KeyRound className="w-5 h-5 text-zinc-500 absolute left-3 top-3.5" />
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 text-white font-mono focus:border-zinc-500" placeholder="Mínimo 6 caracteres" />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-2 bg-green-600 text-white py-3 rounded font-bold uppercase tracking-widest hover:bg-green-700 transition">Finalizar e Entrar</button>
              </form>
            </>
          )}

          {status === 'error' && (
             <>
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white font-mono uppercase">Ocorreu um Erro</h2>
              <p className="text-zinc-400 mt-2 text-sm">A verificação do pagamento falhou. Por favor, contate o suporte se o problema persistir.</p>
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;