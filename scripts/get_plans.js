require('dotenv').config();
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');

const JWT_SECRET = process.env.JWT_SECRET;

async function getPlans() {
  if (!JWT_SECRET) {
    console.error('Error: JWT_SECRET no encontrado.');
    return;
  }
  console.log('Obteniendo lista de planes desde /api/admin/plans...');

  const adminToken = jwt.sign(
    { uuid: 'admin-uuid', rol: 'admin', email: 'admin@pacificoweb.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const response = await request(app)
    .get('/api/admin/plans')
    .set('Authorization', `Bearer ${adminToken}`);

  if (response.statusCode !== 200) {
    console.error('Error al obtener los planes:', response.body);
    return;
  }

  console.log('--- Planes encontrados en la Base de Datos ---');
  console.log(response.body);
  console.log('---------------------------------------------');
  console.log('Por favor, usa uno de los nombres de la lista en la prueba.');
}

getPlans();
