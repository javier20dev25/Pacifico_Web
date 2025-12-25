// src/pages/Pricing.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Tipado para los datos de un plan
interface Plan {
  id: number;
  nombre: string;
  precio: string; // El precio viene como string desde la BD
  detalles: string;
}

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/plans');
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de planes.');
        }
        const data: Plan[] = await response.json();
        setPlans(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Cargando planes...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-4">Elige el Plan Perfecto para Ti</h1>
        <p className="text-center text-gray-600 mb-12">
          Comienza gratis o elige una de nuestras opciones de pago para llevar tu negocio al siguiente nivel.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
              <h2 className="text-2xl font-bold mb-2">{plan.nombre}</h2>
              <p className="text-gray-500 mb-4 h-16">{plan.detalles}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">${parseFloat(plan.precio).toFixed(2)}</span>
                <span className="text-xl text-gray-500">/mes</span>
              </div>
              <ul className="text-gray-600 mb-6 space-y-2 flex-grow">
                {/* Aquí podrían ir más detalles del plan */}
                <li>✅ Característica A</li>
                <li>✅ Característica B</li>
                {parseFloat(plan.precio) > 0 && <li>✅ Característica C</li>}
              </ul>
              <Link
                to={`/register?planId=${plan.id}`}
                className="mt-auto w-full bg-blue-600 text-white text-center font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Seleccionar Plan
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
