import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle, User, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';

interface PaymentSuccessProps {
  onAccountSetup: (productId: string, details: { name: string; email: string; password?: string }) => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onAccountSetup }) => {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();

  const [status, setStatus] = useState<'loading' | 'success'>('loading');
  const [customerName, setCustomerName] = useState('');

  const isInitialSignup = productId === 'hero_vitalicio';

  useEffect(() => {
    // Processar upgrades automaticamente (sem alterações)
    if (productId && !isInitialSignup) {
      setStatus('loading');
      const timer = setTimeout(() => {
        onAccountSetup(productId, { name: '', email: '' });
      }, 2000); // Delay for user to see the message
      return () => clearTimeout(timer);
    }
    
    // Alistamento inicial automático
    if (isInitialSignup) {
      const queryParams = new URLSearchParams(location.search);
      const name = queryParams.get('name') || 'Herói';
      const email = queryParams.get('email') || '';
      
      setCustomerName(name);

      // Simula o processo de criação de conta e "envio de email"
      const setupTimer = setTimeout(() => {
        // Gera uma senha temporária simulada
        const tempPassword = Math.random().toString(36).slice(-8);
        onAccountSetup(productId!, { name, email, password: tempPassword });
        setStatus('success');
      }, 2500); // 2.5s para simular o processamento

      return () => clearTimeout(setupTimer);
    }
  }, [productId, isInitialSignup, onAccountSetup, location.search]);


  if (!isInitialSignup && productId) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[60] p-4 text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
        <h1 className="text-white font-mono text-xl uppercase tracking-widest">Pagamento Confirmado</h1>
        <p className="text-zinc-400 font-mono mt-2">Ativando seu upgrade. Você será redirecionado em breve...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 bg-[url('https://picsum.photos/1600/900?grayscale&blur=2')] bg-cover bg-blend-multiply">
      <div className="absolute inset-0 bg-zinc-950/80"></div>
      <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-md relative z-10 animate-in fade-in">
        {status === 'loading' && (
           <div className="text-center">
             <Loader2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-spin" />
             <h2 className="text-2xl font-bold text-white font-mono uppercase">PAGAMENTO CONFIRMADO</h2>
             <p className="text-zinc-400 mt-2">Preparando seu Quartel-General...</p>
           </div>
        )}
        {status === 'success' && (
           <div className="text-center">
             <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-in fade-in scale-50 zoom-in-100 duration-500" />
             <h2 className="text-2xl font-bold text-white font-mono uppercase">Bem-vindo, {customerName}!</h2>
             <p className="text-zinc-400 mt-2">Sua jornada está prestes a começar. Enviamos os detalhes de acesso para seu email. Você será redirecionado para iniciar sua jornada.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;