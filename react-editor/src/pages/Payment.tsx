// src/pages/Payment.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  PayPalButtons,
  usePayPalScriptReducer,
  ReactPayPalScriptOptions,
  OnApproveData,
  OnApproveActions
} from '@paypal/react-paypal-js';

/**
 * Esta es la página final del flujo de pago.
 * Orquesta la creación de la suscripción en nuestro backend y la aprobación en PayPal.
 */
const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // 1. Obtenemos el ID de nuestra tabla 'suscripciones' desde la URL.
  const ourSubscriptionId = searchParams.get('subId');

  // 2. Estados para manejar el ID que nos dará PayPal y los errores.
  const [paypalSubscriptionId, setPaypalSubscriptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Hook del SDK de PayPal para saber si el script de PayPal ya se cargó.
  const [{ isPending }] = usePayPalScriptReducer();

  // 3. EFECTO PRINCIPAL: Se ejecuta una vez al cargar la página.
  useEffect(() => {
    // Si no hay ID en la URL, no podemos continuar.
    if (!ourSubscriptionId) {
      setError('Error: No se ha especificado una suscripción. Por favor, regresa y selecciona un plan.');
      return;
    }

    // Función asíncrona para comunicarnos con nuestro backend.
    const createPaypalSubscription = async () => {
      try {
        const token = localStorage.getItem('sessionToken');
        if (!token) throw new Error('No autenticado.');

        // Llamamos a nuestro propio backend para crear la suscripción en PayPal.
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

        // Guardamos el ID que nos devuelve PayPal (ej: "I-XXXXXXXX").
        // Este ID es el que usará el botón de PayPal.
        setPaypalSubscriptionId(data.paypalSubscriptionId);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al preparar el pago.');
      }
    };

    createPaypalSubscription();
  }, [ourSubscriptionId]); // El efecto depende solo del ID de nuestra suscripción.

  // 4. RENDERIZADO CONDICIONAL: Mostramos estados de carga o error.
  if (error) {
    return <div className="text-center p-8 text-red-500"><strong>Error:</strong> {error}</div>;
  }

  // Muestra un loader mientras el script de PayPal se está cargando (isPending)
  // o mientras nuestro backend está creando el ID en PayPal (!paypalSubscriptionId).
  if (isPending || !paypalSubscriptionId) {
    return <div className="text-center p-8">Preparando pago seguro con PayPal...</div>;
  }

  // 5. RENDERIZADO FINAL: Mostramos la página y los botones de PayPal.
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Finalizar Suscripción</h1>
        <p className="text-gray-600 mb-6">
          Estás a un paso de activar tu plan. Completa la suscripción a través de PayPal.
        </p>

        {/* 
          Este es el componente de botones. Su implementación es la definitiva y correcta.
        */}
        <PayPalButtons
          style={{ layout: 'vertical', label: 'subscribe' }}
          
          // ESTA ES LA PROP CORRECTA.
          // Se ejecuta al hacer clic y debe devolver el ID de la suscripción de PayPal.
          createSubscription={(_data, _actions) => {
            // Ya tenemos el ID, así que simplemente lo devolvemos dentro de una Promesa.
            return Promise.resolve(paypalSubscriptionId);
          }}

          // Se ejecuta cuando el usuario aprueba el pago en la ventana de PayPal.
          onApprove={async (data: OnApproveData, actions: OnApproveActions) => {
            console.log('Suscripción aprobada en el cliente!', data);
            // En este punto, el webhook en nuestro backend se encargará de activar el plan.
            // Solo necesitamos redirigir al usuario a una página de éxito.
            navigate('/payment-success');
          }}

          // Se ejecuta si hay un error durante el flujo de pago de PayPal.
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