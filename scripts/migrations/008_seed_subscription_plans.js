// scripts/migrations/008_seed_subscription_plans.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (directa, ya que es un script de admin)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en tu .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Planes a insertar/actualizar ---
const planes = [
  {
    nombre: 'Riel',
    precio: 0.00,
    detalles: 'Plan gratuito con funcionalidades básicas para empezar.',
    is_active: true // Aseguramos que esté activo
  },
  {
    nombre: 'Emprendedor',
    precio: 10.00,
    detalles: 'Plan para creadores de contenido y pequeñas empresas que buscan crecer.',
    is_active: true
  },
  {
    nombre: 'Oro Business',
    precio: 20.00,
    detalles: 'Plan completo para negocios establecidos con altas demandas y necesidad de soporte prioritario.',
    is_active: true
  }
];

async function seedPlanes() {
  console.log('Iniciando el sembrado de planes de suscripción...');

  try {
    const { data, error } = await supabase
      .from('planes')
      .upsert(planes, { onConflict: 'nombre' }); // 'nombre' debe ser una columna con constraint UNIQUE

    if (error) {
      console.error('Error al insertar/actualizar los planes:', error.message);
      throw error;
    }

    console.log('¡Planes sembrados con éxito!');
    console.log('Datos procesados:', data);
  } catch (err) {
    console.error('Ocurrió un error inesperado durante el sembrado:', err);
  }
}

seedPlanes();
