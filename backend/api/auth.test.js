const request = require('supertest');
const app = require('../../server');

describe('API de Autenticación - /api/auth', () => {
  describe('POST /login', () => {
    it('debería responder con 400 si no se envían credenciales', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Correo y contraseña son obligatorios.'
      );
    });

    it('debería responder con 400 si falta la contraseña', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Correo y contraseña son obligatorios.'
      );
    });

    it('debería responder con 401 con credenciales incorrectas', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'noexiste@example.com',
        password: 'passwordincorrecto',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('error', 'Credenciales inválidas.');
    });
  });
});
