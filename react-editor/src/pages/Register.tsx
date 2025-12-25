// src/pages/Register.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [planId, setPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const id = searchParams.get('planId');
    if (!id) {
      // Si no hay planId, redirigir a la página de precios
      navigate('/pricing');
    }
    setPlanId(id);
  }, [searchParams, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, planId: parseInt(planId, 10) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error durante el registro.');
      }

      // Guardar el token de sesión (aquí usamos localStorage como ejemplo)
      if (data.sessionToken) {
        localStorage.setItem('sessionToken', data.sessionToken);
      }

      // Redirigir según el estado de la suscripción
      if (data.subscription?.status === 'active') {
        navigate('/dashboard'); // Plan gratuito, directo al panel
      } else if (data.subscription?.status === 'pending_payment') {
        navigate(`/payment?subId=${data.subscription.id}`); // Plan de pago, ir a la página de pago
      } else {
        throw new Error('Estado de suscripción no reconocido.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear tu Cuenta</h1>
        {planId && <p className="text-center text-gray-600 mb-4">Estás a punto de suscribirte al plan #{planId}.</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="nombre">Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="correo">Correo Electrónico</label>
            <input
              type="email"
              name="correo"
              id="correo"
              value={formData.correo}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">Contraseña</label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta y Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
