// scripts/rename_plan.js
require('dotenv').config({ path: '../.env' });
const { supabaseAdmin } = require('../backend/services/supabase');

const OLD_NAME = 'oro_business';
const NEW_NAME = 'ejecutivo';

async function renameAndReactivatePlan() {
  console.log(`Intentando renombrar el plan '${OLD_NAME}' a '${NEW_NAME}' y reactivarlo...`);

  try {
    const { data, error } = await supabaseAdmin
      .from('planes')
      .update({ nombre: NEW_NAME, is_active: true })
      .eq('nombre', OLD_NAME)
      .select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      console.log('¡Plan actualizado con éxito!');
      console.log(data.map(p => ({ id: p.id, nombre: p.nombre, is_active: p.is_active })));
    } else {
      console.log(`No se encontró un plan con el nombre '${OLD_NAME}'. Puede que ya haya sido renombrado o eliminado.`);
    }

  } catch (error) {
    console.error('Error durante el proceso de renombrado de plan:');
    console.error(error.message);
    process.exit(1);
  }
}

renameAndReactivatePlan();
