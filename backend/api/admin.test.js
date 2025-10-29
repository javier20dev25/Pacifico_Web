const request = require('supertest');
const app = require('../../server');
const jwt = require('jsonwebtoken');

// Usamos el mismo secreto JWT que la aplicación para generar tokens de prueba
const JWT_SECRET = process.env.JWT_SECRET;

describe('API de Administrador - /api/admin', () => {
  let adminToken;
  let userToken;

  beforeAll(() => {
    // Crear un token de administrador válido para las pruebas
    adminToken = jwt.sign({ uuid: 'admin-uuid', rol: 'admin', email: 'admin@test.com' }, JWT_SECRET, { expiresIn: '1h' });
    
    // Crear un token de usuario normal válido para las pruebas
    userToken = jwt.sign({ uuid: 'user-uuid', rol: 'user', email: 'user@test.com' }, JWT_SECRET, { expiresIn: '1h' });
  });

  describe('GET /users', () => {
    it('debería denegar el acceso a un usuario sin rol de administrador (403 Forbidden)', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('error', 'Acceso denegado. Se requiere rol de administrador.');
    });

    it('debería denegar el acceso si no se proporciona un token (401 Unauthorized)', async () => {
      const response = await request(app).get('/api/admin/users');
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('error', 'No autorizado. No se proporcionó un token.');
    });

    it('debería permitir el acceso a un usuario con rol de administrador (200 OK)', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // La respuesta debería ser exitosa
      expect(response.statusCode).toBe(200);
      // La respuesta debería ser un array (incluso si está vacío)
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
