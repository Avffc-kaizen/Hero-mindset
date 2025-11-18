import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { PRODUCTS } from '../constants';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const firedPixel = useRef(false);

  useEffect(() => {
    const product = PRODUCTS.find(p => p.id === productId);
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
  }, [productId]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-md relative z-10 animate-in fade-in">
        <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white font-mono uppercase">Pagamento Confirmado!</h2>
            <p className="text-zinc-400 mt-2 mb-6 font-mono text-sm">
                Sua compra foi recebida. Para acessar a plataforma, por favor, <strong>crie sua conta ou faça login</strong> com o mesmo email utilizado no pagamento.
            </p>
            <button 
                onClick={() => navigate('/login')} 
                className="w-full mt-2 bg-green-600 text-white py-3 rounded font-bold uppercase tracking-widest hover:bg-green-700 transition"
            >
                Acessar Plataforma
            </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;