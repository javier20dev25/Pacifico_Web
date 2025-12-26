// src/pages/Payment.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  PayPalButtons,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';

/**
 * Esta es la página final del flujo de pago.
 * Orquesta la creación de la suscripción en nuestro backend y la aprobación en PayPal.
 */
const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const ourSubscriptionId = searchParams.get('subId');
  const [paypalSubscriptionId, setPaypalSubscriptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [{ isPending }] = usePayPalScriptReducer();

  useEffect(() => {
    if (!ourSubscriptionId) {
      setError('Error: No se ha especificado una suscripción. Por favor, regresa y selecciona un plan.');
      return;
    }

    const createPaypalSubscription = async () => {
      try {
        const token = localStorage.getItem('sessionToken');
        if (!token) throw new Error('No autenticado.');

        const response = await fetch('/api/paypal/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ subscriptionId: ourSubscriptionId }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'No se pudo preparar la suscripción en PayPal.');
        }
        
        setPaypalSubscriptionId(data.paypalSubscriptionId);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al preparar el pago.');
      }
    };

    createPaypalSubscription();
  }, [ourSubscriptionId]);

  if (error) {
    return <div className="text-center p-8 text-red-500"><strong>Error:</strong> {error}</div>;
  }

  if (isPending || !paypalSubscriptionId) {
    return <div className="text-center p-8">Preparando pago seguro con PayPal...</div>;
  }

  // Esta función se ejecuta cuando el usuario aprueba la transacción en la ventana de PayPal.
  // Dejamos que TypeScript infiera los tipos de 'data' y 'actions' para máxima compatibilidad.
  const handleApprove = async (data: any, actions: any) => {
    console.log('Suscripción aprobada en el cliente!', data);
    if(actions && actions.subscription) {
        const details = await actions.subscription.get();
        console.log('Detalles de la suscripción:', details);
    }
    // El webhook se encargará de la activación en la BD. Redirigimos a la página de éxito.
    navigate('/payment-success');
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Finalizar Suscripción</h1>
        <p className="text-gray-600 mb-6">
          Estás a un paso de activar tu plan. Completa la suscripción a través de PayPal.
        </p>

        <PayPalButtons
          style={{ layout: 'vertical', label: 'subscribe' }}
          createSubscription={(_data, _actions) => {
            if (!paypalSubscriptionId) {
              return Promise.reject(new Error("ID de suscripción de PayPal no disponible."));
            }
            return Promise.resolve(paypalSubscriptionId);
          }}
          onApprove={handleApprove}
          onError={(err) => {
            console.error('Error en el flujo de pago de PayPal:', err);
            setError('Ocurrió un error con PayPal. Por favor, intenta de nuevo o contacta a soporte.');
          }}
        />
      </div>
    </div>
  );
};


export default PaymentPage;
