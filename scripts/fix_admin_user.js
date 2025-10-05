
require('dotenv').config();
const { supabaseAdmin } = require('./backend/services/supabase');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@pacificoweb.com';
const ADMIN_PASSWORD = 'SERPONGE777';

async function fixAdminUser() {
    console.log(`🚀 Iniciando la corrección para el usuario: ${ADMIN_EMAIL}`);

    try {
        // 1. Generar el hash de la contraseña
        console.log('Generando hash para la contraseña...');
        const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        console.log('Hash generado exitosamente.');

        // 2. Actualizar el usuario en Supabase
        console.log('Actualizando el usuario en la base de datos...');
        const { data, error } = await supabaseAdmin
            .from('usuarios')
            .update({
                password_hash: password_hash,
                role: 'admin',
                status: 'active'
            })
            .eq('correo', ADMIN_EMAIL)
            .select();

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            console.error(`❌ Error: No se encontró ningún usuario con el correo '${ADMIN_EMAIL}'.`);
            console.log('Por favor, asegúrate de que el usuario exista en la tabla "usuarios".');
            return;
        }

        console.log('✅ ¡Éxito! El usuario administrador ha sido actualizado correctamente.');
        console.log('   - Rol establecido a: admin');
        console.log('   - Estado establecido a: active');
        console.log('   - Contraseña actualizada.');

    } catch (error) {
        console.error('🔥 Ocurrió un error durante el proceso:', error.message);
    }
}

fixAdminUser();
