// src/pages/RielActivation.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/axiosConfig';
import { Loader, AlertTriangle, CheckCircle, Phone } from 'lucide-react';

type Status = 'verifying' | 'ready' | 'activating' | 'error' | 'success';

const RielActivation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No se encontró un token de activación en el enlace.');
      setStatus('error');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await apiClient.get(`/riel/verify-token?token=${token}`);
        if (response.status === 200) {
          setName(response.data.name);
          setWhatsappNumber(response.data.whatsapp_number);
          setStatus('ready');
        } else {
          throw new Error(response.data.error || 'El enlace es inválido o ha expirado.');
        }
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error al verificar el enlace.');
        setStatus('error');
      }
    };

    verifyToken();
  }, [token]);

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setStatus('activating');
    setError(null);

    try {
        const response = await apiClient.post('/riel/complete-activation', {
            token,
            whatsapp_number: whatsappNumber,
            password: password,
        });

        if (response.status === 200 && response.data.sessionToken) {
            localStorage.setItem('sessionToken', response.data.sessionToken);
            setStatus('success');
            setTimeout(() => {
                navigate('/riel/editor');
            }, 2000);
        } else {
            throw new Error(response.data.error || 'No se pudo completar la activación.');
        }
    } catch (err: any)        setError(err.response?.data?.error || err.message || 'Ocurrió un error inesperado.');
        setStatus('error');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <Loader className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
            <p className="mt-4 text-slate-600 font-medium">Verificando enlace de activación...</p>
          </div>
        );
      case 'ready':
        return (
          <>
            <h1 className="text-2xl font-bold text-slate-800 text-center">¡Bienvenido, {name}!</h1>
            <p className="text-slate-500 text-center mt-2 mb-6">
              Solo un último paso. Confirma tu número y crea una contraseña para tu cuenta.
            </p>
            <form onSubmit={handleActivation} className="space-y-4">
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700 mb-1">Número de WhatsApp</label>
                <input
                  id="whatsapp"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300"
                  required
                  placeholder="Ej: 88887777"
                />
              </div>
              <div>
                <label htmlFor="password" c
lassName="block text-sm font-medium text-slate-700 mb-1">Crea una Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" c
lassName="block text-sm font-medium text-slate-700 mb-1">Confirma tu Contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>
              {error && <p className="text-sm text-center text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all"
              >
                Confirmar y Activar mi Tienda
              </button>
            </form>
          </>
        );
       case 'activating':
        return (
          <div className="text-center">
            <Loader className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
            <p className="mt-4 text-slate-600 font-medium">Activando tu cuenta Riel...</p>
          </div>
        );
      case 'success':
        return (
            <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-emerald-500" />
                <h1 className="text-2xl font-bold text-slate-800 mt-4">¡Activación Completa!</h1>
                <p className="text-slate-600 mt-2">Tu cuenta Riel está lista. Redirigiendo al editor...</p>
            </div>
        );
      case 'error':
        return (
            <div className="text-center">
                <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
                <h1 className="text-2xl font-bold text-slate-800 mt-4">Hubo un Problema</h1>
                <p className="text-slate-600 mt-2 bg-red-50 p-3 rounded-lg">{error}</p>
                <button onClick={() => navigate('/')} className="mt-6 text-sm font-semibold text-indigo-600 hover:underline">
                    Volver a la página principal
                </button>
            </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default RielActivation;
