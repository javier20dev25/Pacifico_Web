// src/pages/PaymentSuccess.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccessPage: React.FC = () => {
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <div className="text-green-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">¡Suscripción Activada!</h1>
        <p className="text-gray-600 mb-6">
          Tu pago ha sido procesado con éxito. Tu plan ya está activo y puedes disfrutar de todas sus ventajas.
        </p>
        <Link
          to="/dashboard"
          className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ir a mi Panel de Control
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
