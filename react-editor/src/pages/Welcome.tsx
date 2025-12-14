// src/pages/Welcome.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '@/stores/store';
import { Rocket, LogIn } from 'lucide-react';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const openRielModal = useAppStore((state) => state.openRielModal);

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans p-4">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-slate-800">
          Bienvenido a <span className="text-indigo-600">PacíficoWeb</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          La plataforma todo-en-uno para lanzar tu tienda online sin complicaciones.
          Empieza gratis con nuestro plan Riel o inicia sesión para gestionar tu imperio.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        <button
          onClick={openRielModal}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
        >
          <Rocket className="w-5 h-5" />
          Probar Riel Gratis
        </button>
        <button
          onClick={handleLoginClick}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

export default Welcome;
