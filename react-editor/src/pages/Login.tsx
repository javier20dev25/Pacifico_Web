import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axiosConfig';

const EyeIcon = ({ visible }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {visible ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.75 9.75L4.5 4.5m15 15l-5.25-5.25" />
    )}
  </svg>
);

const Login = () => {
  const [formToShow, setFormToShow] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [tempToken, setTempToken] = useState(null);
  const [strength, setStrength] = useState('');

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Efecto para la fortaleza de la contraseña
  useEffect(() => {
    if (!newPassword) {
      setStrength('');
      return;
    }
    const feedback = [];
    if (newPassword.length < 6) feedback.push('6+ caracteres');
    if (!/[A-Z]/.test(newPassword)) feedback.push('1 mayúscula');
    if (!/[a-z]/.test(newPassword)) feedback.push('1 minúscula');
    if (!/\d/.test(newPassword)) feedback.push('1 número');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) feedback.push('1 símbolo');

    if (feedback.length === 0) {
      setStrength('<span style="color: green;">Contraseña Fuerte</span>');
    } else {
      setStrength(`Falta: ${feedback.join(', ')}`);
    }
  }, [newPassword]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (rememberMe) {
      localStorage.setItem('remembered_email', email);
    } else {
      localStorage.removeItem('remembered_email');
    }
    try {
      const response = await apiClient.post('/auth/login', { correo: email, password });
      const data = response.data;
      if (data.success && data.sessionToken) {
        localStorage.setItem('sessionToken', data.sessionToken);
        if (data.user && data.user.rol === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else if (data.tempToken) {
        setTempToken(data.tempToken);
        setFormToShow('register');
      } else {
        throw new Error('Respuesta inesperada del servidor.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido en el login';
      setError(errorMessage);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegistrationError('');

    if (newPassword !== confirmPassword) {
      setRegistrationError('Las contraseñas no coinciden.');
      return;
    }
    if (strength !== '<span style="color: green;">Contraseña Fuerte</span>') {
        setRegistrationError('La contraseña no es suficientemente fuerte.');
        return;
    }

    try {
        const response = await apiClient.post('/auth/complete-registration', { tempToken, password: newPassword });
        const data = response.data;

        if (data.status === 'registration_complete' && data.token) {
            localStorage.setItem('sessionToken', data.token);
            navigate('/dashboard');
        } else {
            throw new Error('No se pudo completar el registro.');
        }
    } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
        setRegistrationError(errorMessage);
    }
  };

  const renderLoginForm = () => (
    <div>
      <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">Iniciar Sesión</h2>
      <form onSubmit={handleLoginSubmit}>
        <div className="mb-4">
          <label htmlFor="login-email" className="block font-semibold text-gray-700 mb-2">Correo Electrónico</label>
          <input type="email" id="login-email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label htmlFor="login-password" className="block font-semibold text-gray-700 mb-2">Contraseña</label>
          <div className="relative">
            <input type={isPasswordVisible ? 'text' : 'password'} id="login-password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="absolute inset-y-0 right-0 px-3 flex items-center" onClick={() => setIsPasswordVisible(!isPasswordVisible)}><EyeIcon visible={!isPasswordVisible} /></button>
          </div>
        </div>
        <div className="flex items-center mb-4">
          <input type="checkbox" id="remember-me" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Recordarme</label>
        </div>
        {error && <div className="text-red-500 text-sm min-h-[20px] mb-4">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">Ingresar</button>
      </form>
    </div>
  );

  const renderRegisterForm = () => (
    <div>
      <h2 className="text-center text-2xl font-bold text-gray-800 mb-4">Crea tu Contraseña</h2>
      <p className="text-center text-gray-600 mb-6">Por seguridad, debes establecer una nueva contraseña para activar tu cuenta.</p>
      <form onSubmit={handleRegisterSubmit}>
        <div className="mb-4">
          <label htmlFor="new-password" className="block font-semibold text-gray-700 mb-2">Nueva Contraseña</label>
          <div className="relative">
            <input type={isNewPasswordVisible ? 'text' : 'password'} id="new-password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <button type="button" className="absolute inset-y-0 right-0 px-3 flex items-center" onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}><EyeIcon visible={!isNewPasswordVisible} /></button>
          </div>
          {strength && <div className="text-sm text-gray-500 mt-2 min-h-[18px]" dangerouslySetInnerHTML={{ __html: strength }} />}
        </div>
        <div className="mb-6">
          <label htmlFor="confirm-password" className="block font-semibold text-gray-700 mb-2">Confirmar Contraseña</label>
          <div className="relative">
            <input type={isConfirmPasswordVisible ? 'text' : 'password'} id="confirm-password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <button type="button" className="absolute inset-y-0 right-0 px-3 flex items-center" onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}><EyeIcon visible={!isConfirmPasswordVisible} /></button>
          </div>
        </div>
        {registrationError && <div className="text-red-500 text-sm min-h-[20px] mb-4">{registrationError}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">Guardar y Continuar</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {formToShow === 'login' ? renderLoginForm() : renderRegisterForm()}
      </div>
    </div>
  );
};

export default Login;
