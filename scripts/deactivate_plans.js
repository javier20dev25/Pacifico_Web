// scripts/deactivate_plans.js
require('dotenv').config({ path: '../.env' });
const { supabaseAdmin } = require('../backend/services/supabase');

const PLANS_TO_DEACTIVATE = ['oro_business', 'vendedor_diamante'];

async function deactivatePlans() {
  console.log(`Intentando desactivar los siguientes planes: ${PLANS_TO_DEACTIVATE.join(', ')}...`);

  try {
    const { data, error } = await supabaseAdmin
      .from('planes')
      .update({ is_active: false })
      .in('nombre', PLANS_TO_DEACTIVATE)
      .select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      console.log('Planes desactivados con éxito:');
      console.log(data.map(p => ({ nombre: p.nombre, is_active: p.is_active })));
    } else {
      console.log('No se encontraron los planes especificados para desactivar. Puede que ya no existan o los nombres sean incorrectos.');
    }

  } catch (error) {
    console.error('Error durante el proceso de desactivación de planes:');
    console.error(error.message);
    process.exit(1);
  }
}

deactivatePlans();
