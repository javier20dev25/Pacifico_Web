// src/pages/Payment.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [subId] = useState<string | null>(searchParams.get('subId'));
  const [paypalSubscriptionId, setPaypalSubscriptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Hook del SDK de PayPal para gestionar el estado del script
  const [{ isPending }] = usePayPalScriptReducer();

  useEffect(() => {
    if (!subId) {
      setError('No se encontró un ID de suscripción. Por favor, vuelve a la página de precios.');
      return;
    }

    const createSubscriptionInApi = async () => {
      try {
        const token = localStorage.getItem('sessionToken');
        const response = await fetch('/api/paypal/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Necesitamos estar autenticados
          },
          body: JSON.stringify({ subscriptionId: subId }), // El backend espera 'subscriptionId'
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'No se pudo crear la suscripción en PayPal.');
        }

        setPaypalSubscriptionId(data.paypalSubscriptionId);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al preparar el pago.');
      }
    };

    createSubscriptionInApi();
  }, [subId]);

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  // Muestra un loader mientras el SDK de PayPal se carga o mientras esperamos el ID de nuestra API
  if (isPending || !paypalSubscriptionId) {
    return <div className="text-center p-8">Cargando procesador de pago...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Finalizar Suscripción</h1>
        <p className="text-gray-600 mb-6">
          Estás a un paso de activar tu plan. Por favor, completa tu suscripción a través de PayPal.
        </p>

        <PayPalButtons
          style={{ layout: 'vertical', label: 'subscribe' }}
          createSubscription={(_data, _actions) => {
            // Esta función es llamada por el SDK de PayPal cuando se hace clic en el botón.
            // Debe devolver una promesa que resuelva con el ID de la suscripción.
            // Como ya lo creamos en nuestro backend, simplemente lo devolvemos.
            if (!paypalSubscriptionId) {
              return Promise.reject(new Error("ID de suscripción de PayPal no disponible."));
            }
            return Promise.resolve(paypalSubscriptionId);
          }}
          onApprove={async (_data, actions) => {
            console.log('Suscripción aprobada en el cliente!', await actions.subscription?.get());
            // El webhook se encargará de la activación en la BD. Redirigimos a la página de éxito.
            navigate('/payment-success');
          }}
          onError={(err) => {
            console.error('Error en el botón de PayPal:', err);
            setError('Ocurrió un error con PayPal. Por favor, intenta de nuevo.');
          }}
        />
      </div>
    </div>
  );
};

export default PaymentPage;
