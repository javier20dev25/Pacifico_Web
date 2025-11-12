const { z } = require('zod');

// Esquema para la creación de un usuario por parte de un administrador.
const AdminCreateUserSchema = z.object({
  nombre: z
    .string({
      required_error: 'El nombre de la tienda es requerido',
    })
    .min(1, { message: 'El nombre no puede estar vacío' }),

  // El correo es opcional, si no se provee, la API genera uno.
  // Si se provee, debe ser un formato de email válido.
  correo: z
    .string()
    .email({ message: 'El formato del correo electrónico no es válido' })
    .endsWith('@pacificoweb.com', {
      message: 'El correo electrónico debe ser del dominio @pacificoweb.com',
    })
    .optional(),

  plan_nombre: z
    .string({
      required_error: 'El nombre del plan es requerido',
    })
    .min(1, { message: 'El nombre del plan no puede estar vacío' }),
});

module.exports = { AdminCreateUserSchema };
