require('dotenv').config();
const request = require('supertest');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const app = require('../server');

const JWT_SECRET = process.env.JWT_SECRET;

// --- Test Runner ---
async function runTest(name, testFn) {
  try {
    await testFn();
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    // Imprimir un error más detallado
    if (error instanceof assert.AssertionError) {
      console.error(`   Assertion Error: ${error.message}`);
    } else {
      console.error(`   Unexpected Error: ${error.stack}`);
    }
    process.exit(1); // Salir con error si una prueba falla
  }
}

// --- Main Test Function ---
async function runApiTests() {
  if (!JWT_SECRET) {
    console.error(
      'Error: JWT_SECRET no encontrado. Asegúrate de que está en tu archivo .env'
    );
    return;
  }

  console.log('--- Iniciando Pruebas Manuales para la API de Admin ---\n');

  const adminToken = jwt.sign(
    { uuid: 'admin-uuid', rol: 'admin', email: 'admin@pacificoweb.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Test 1: Debería crear un usuario con datos válidos
  await runTest('Crea un usuario con datos válidos (201)', async () => {
    const payload = {
      nombre: `TestUser_${Date.now()}`,
      correo: `test_${Date.now()}@pacificoweb.com`,
      plan_nombre: 'emprendedor',
    };

    console.log(
      '  (Nota: Esta prueba intentará crear un usuario real en la BD de desarrollo)'
    );
    const response = await request(app)
      .post('/api/admin/create-temporary-user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.strictEqual(
      response.statusCode,
      201,
      `Esperado 201, recibido ${response.statusCode}`
    );
    assert.strictEqual(
      response.body.message,
      'Usuario temporal y contrato creados con éxito.'
    );
  });

  // Test 2: Debería rechazar una petición sin nombre
  await runTest('Rechaza la creación si falta el nombre (400)', async () => {
    const payload = {
      correo: `test_${Date.now()}@pacificoweb.com`,
      plan_nombre: 'emprendedor',
    };

    const response = await request(app)
      .post('/api/admin/create-temporary-user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.strictEqual(
      response.statusCode,
      400,
      `Esperado 400, recibido ${response.statusCode}`
    );
    assert.strictEqual(response.body.error, 'Datos de entrada inválidos.');
  });

  // Test 3: Debería rechazar una petición con correo inválido
  await runTest(
    'Rechaza la creación si el correo es inválido (400)',
    async () => {
      const payload = {
        nombre: 'Test Invalid Email',
        correo: 'correo-invalido',
        plan_nombre: 'emprendedor',
      };

      const response = await request(app)
        .post('/api/admin/create-temporary-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      assert.strictEqual(
        response.statusCode,
        400,
        `Esperado 400, recibido ${response.statusCode}`
      );
      assert.strictEqual(response.body.error, 'Datos de entrada inválidos.');
    }
  );

  console.log('\n--- Pruebas Manuales Finalizadas ---');
}

runApiTests();
