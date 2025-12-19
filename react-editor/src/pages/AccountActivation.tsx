// src/pages/AccountActivation.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/axiosConfig';
import { AxiosError } from 'axios';

type UserDetails = {
  nombre: string;
  correo: string;
};

const AccountActivation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const activationToken = searchParams.get('token');
    if (!activationToken) {
      setError('No se encontró un token de activación en el enlace.');
      setIsLoading(false);
      return;
    }
    setToken(activationToken);

    const verifyToken = async () => {
      try {
        const response = await apiClient.get<UserDetails>(`/auth/verify-activation?token=${activationToken}`);
        setUserDetails(response.data);
      } catch (err: unknown) {
        const error = err as AxiosError<{ error: string }>;
        setError(error.response?.data?.error || 'El enlace es inválido, ha expirado o ya fue utilizado.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    // Podríamos añadir validación de fortaleza de contraseña aquí.
    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiClient.post<{ message: string }>('/auth/complete-activation', { token, password });
      // Redirigir al login con un mensaje de éxito
      navigate('/login', { state: { message: response.data.message } });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      setError(error.response?.data?.error || 'Ocurrió un error al activar la cuenta.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Verificando enlace...</div>;
  }

  if (error && !userDetails) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error de Activación</h2>
          <p className="text-gray-700">{error}</p>
          <button onClick={() => navigate('/login')} className="mt-6 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700">
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">¡Bienvenido, {userDetails?.nombre}!</h2>
        <p className="text-center text-gray-600 mb-6">Estás a un paso de activar tu cuenta. Solo necesitas crear tu contraseña personal.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block font-semibold text-gray-700 mb-2">Correo</label>
            <input 
              type="email" 
              id="email" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" 
              value={userDetails?.correo || ''} 
              disabled 
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block font-semibold text-gray-700 mb-2">Nueva Contraseña</label>
            <input 
              type="password" 
              id="password" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirm-password" className="block font-semibold text-gray-700 mb-2">Confirmar Contraseña</label>
            <input 
              type="password" 
              id="confirm-password" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
          
          {error && <div className="text-red-500 text-sm min-h-[20px] mb-4 text-center">{error}</div>}

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-blue-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Activando...' : 'Activar y Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountActivation;
