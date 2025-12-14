// backend/api/riel.test.js
const request = require('supertest');
const app = require('../../server'); // Importar la app de express
const { supabaseAdmin } = require('../services/supabase'); // Importar para mock

// Mockear el cliente de Supabase para evitar llamadas reales a la BD en las pruebas
jest.mock('../services/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

describe('API de Riel - /api/riel', () => {
  // Limpiar los mocks antes de cada prueba
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /preregister', () => {
    it('debería devolver 201 y un identificador con un número de WhatsApp válido', async () => {
      const mockIdentifier = 'mock-uuid-12345';
      // Configurar el mock para simular una respuesta exitosa de la BD
      supabaseAdmin.from('riel_preregistrations').upsert().select().single.mockResolvedValue({
        data: { identifier: mockIdentifier },
        error: null,
      });

      const response = await request(app)
        .post('/api/riel/preregister')
        .send({ whatsapp_number: '50588887777' }); // Número limpio y válido

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('identifier', mockIdentifier);
      // Verificar que se llamó a la función de upsert
      expect(supabaseAdmin.from).toHaveBeenCalledWith('riel_preregistrations');
      expect(supabaseAdmin.upsert).toHaveBeenCalled();
    });

    it('debería devolver 400 si no se proporciona un número de WhatsApp', async () => {
      const response = await request(app)
        .post('/api/riel/preregister')
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Se requiere un número de WhatsApp válido.');
      // Verificar que NO se intentó hacer una llamada a la BD
      expect(supabaseAdmin.from).not.toHaveBeenCalled();
    });

    it('debería devolver 400 si el número de WhatsApp contiene caracteres no numéricos (excepto + al inicio)', async () => {
      const response = await request(app)
        .post('/api/riel/preregister')
        .send({ whatsapp_number: '505-8888-7777' }); // Formato con guiones (inválido para la regex)

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Se requiere un número de WhatsApp válido.');
    });

    it('debería aceptar un número de WhatsApp que contenga un signo + y pasarlo a la siguiente capa', async () => {
        // Esta prueba valida que la regex del endpoint permite el signo '+'.
        // La lógica del frontend ya se encarga de limpiarlo antes de enviarlo,
        // pero la API en sí misma es permisiva con el '+'.
        const mockIdentifier = 'mock-uuid-for-plus-test';
        supabaseAdmin.from('riel_preregistrations').upsert().select().single.mockResolvedValue({
          data: { identifier: mockIdentifier },
          error: null,
        });

        const response = await request(app)
          .post('/api/riel/preregister')
          .send({ whatsapp_number: '+50588887777' });
  
        // El endpoint lo permite, por lo que esperamos 201. El error 500 original
        // venía de la base de datos, no de esta validación.
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('identifier', mockIdentifier);
    });


    it('debería devolver 500 si hay un error en la base de datos', async () => {
      const dbError = new Error('Error de conexión a la base de datos');
      // Configurar el mock para que simule un error
      supabaseAdmin.from('riel_preregistrations').upsert().select().single.mockRejectedValue(dbError);

      const response = await request(app)
        .post('/api/riel/preregister')
        .send({ whatsapp_number: '50512345678' });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Ocurrió un error en el servidor durante el pre-registro.');
    });
  });
});
