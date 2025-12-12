// scripts/test_product_limit.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');

// --- Configuración ---
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@pacificoweb.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'SERPONGE777';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: (status) => status < 500, // No lanzar error para respuestas 4xx
});

const PLANS_TO_TEST = [
    { name: 'emprendedor', limit: 20 },
    { name: 'oro_business', limit: 45 },
    { name: 'vendedor_diamante', limit: 60 },
];

let adminAuthToken = null;
const createdTestUsers = []; // Array para guardar los UUIDs de los usuarios creados

// --- Funciones de Ayuda ---
function logStep(step, message) { console.log(`\n--- PASO ${step}: ${message} ---`); }
function logInfo(message) { console.log(`   > ${message}`); }
function logSuccess(message) { console.log(`   ✅ SÚPER: ${message}`); }
function logFailure(message, data = '') {
  console.error(`   ❌ ERROR: ${message}`, data);
  throw new Error(message); // Lanzar error para detener el proceso principal
}

// --- Lógica del Test ---
async function loginAdmin() {
  logStep(1, 'Iniciando sesión como Administrador...');
  const response = await apiClient.post('/api/auth/login', {
    correo: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (response.status !== 200 || !response.data.sessionToken) {
    logFailure('No se pudo iniciar sesión como admin.', response.data);
  }
  adminAuthToken = response.data.sessionToken;
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${adminAuthToken}`;
  logSuccess(`Admin autenticado. Rol: ${response.data.user.rol}`);
}

async function createTestUser(planName) {
  logInfo(`Creando usuario de prueba para el plan '${planName}'...`);
  const testUserName = `TestUser-${planName}-${Date.now()}`;
  
  const createResponse = await apiClient.post('/api/admin/create-temporary-user', {
    nombre: testUserName,
    plan_nombre: planName,
  });

  if (![200, 201].includes(createResponse.status)) {
      logFailure(`La creación del usuario falló con status ${createResponse.status}`, createResponse.data);
  }

  const { data: users } = await apiClient.get('/api/admin/users');
  const newUser = users.find(u => u.nombre === testUserName);

  if (!newUser) {
    logFailure('El usuario de prueba fue creado pero no se pudo encontrar para obtener su UUID.');
  }
  
  const { data: creds } = await apiClient.get(`/api/admin/credentials/${newUser.usuario_uuid}`);
  if (!creds.correo || !creds.password) {
    logFailure('No se pudieron obtener las credenciales temporales.', creds);
  }

  const loginResponse = await apiClient.post('/api/auth/login', {
    correo: creds.correo,
    password: creds.password,
  });
  if (loginResponse.status !== 200 || !loginResponse.data.sessionToken) {
    logFailure('No se pudo iniciar sesión como usuario de prueba.', loginResponse.data);
  }
  
  const testUser = {
      uuid: newUser.usuario_uuid,
      token: loginResponse.data.sessionToken,
  };

  createdTestUsers.push(testUser.uuid); // Guardar para limpieza
  logSuccess(`Usuario para '${planName}' creado y autenticado.`);
  return testUser;
}

async function runProductLimitTestForPlan(testUser, plan) {
  logInfo(`Ejecutando pruebas para el plan '${plan.name}' (Límite: ${plan.limit})...`);
  
  const testProducts = (count) => Array.from({ length: count }, (_, i) => ({
    idLocal: `test_prod_${plan.name}_${i}`,
    nombre: `Producto ${i + 1}`,
  }));

  const storeDataPayload = {
    store: { nombre: `Tienda Test ${plan.name}` },
    products: [],
  };

  // Prueba 1: Guardar un número de productos IGUAL al límite.
  logInfo(`  - Intentando guardar ${plan.limit} productos (debería funcionar)...`);
  storeDataPayload.products = testProducts(plan.limit);
  let response = await apiClient.put('/api/user/store-data', { storeData: storeDataPayload }, {
    headers: { Authorization: `Bearer ${testUser.token}` }
  });
  if (![200, 201].includes(response.status)) {
    logFailure(`Fallo al guardar ${plan.limit} productos para el plan '${plan.name}'.`, response.data);
  }
  logSuccess(`  - Se guardaron ${plan.limit} productos correctamente (Status: ${response.status}).`);

  // Prueba 2: Guardar un número de productos POR ENCIMA del límite.
  logInfo(`  - Intentando guardar ${plan.limit + 1} productos (debería fallar con error 403)...`);
  storeDataPayload.products = testProducts(plan.limit + 1);
  response = await apiClient.put('/api/user/store-data', { storeData: storeDataPayload }, {
    headers: { Authorization: `Bearer ${testUser.token}` }
  });
  if (response.status !== 403) {
    logFailure(`La API no devolvió 403 al exceder el límite del plan '${plan.name}'. Se recibió: ${response.status}`, response.data);
  }
  logSuccess(`  - La API devolvió correctamente un error 403 para el plan '${plan.name}'.`);
}

async function cleanup() {
  logStep('FINAL', `Limpiando (${createdTestUsers.length} usuarios de prueba)...`);
  if (createdTestUsers.length === 0) {
    logInfo('No hay usuarios de prueba que limpiar.');
    return;
  }
  for (const userUuid of createdTestUsers) {
    try {
      await apiClient.post('/api/admin/revoke-user', { userUuid });
      logSuccess(`  - Usuario ${userUuid} eliminado.`);
    } catch (error) {
      logFailure(`  - Fallo catastrófico durante la limpieza del usuario ${userUuid}.`, error.message);
    }
  }
}

async function main() {
  console.log('*** INICIANDO TEST COMPLETO DE LÍMITES DE PRODUCTOS POR PLAN ***');
  
  try {
    await loginAdmin();
    
    logStep(2, 'Iniciando ciclo de pruebas por plan...');
    for (const plan of PLANS_TO_TEST) {
      const testUser = await createTestUser(plan.name);
      await runProductLimitTestForPlan(testUser, plan);
    }
    logSuccess('TODOS LOS PLANES PASARON LAS PRUEBAS DE LÍMITES.');

  } catch (error) {
    console.error(`\n*** EL TEST FALLÓ: ${error.message} ***`);
  } finally {
    await cleanup();
    console.log('\n*** TEST FINALIZADO ***');
  }
}

main();
