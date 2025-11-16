import { z } from 'zod';

// Esquema para la creación de un usuario por parte de un administrador.
export const AdminCreateUserSchema = z.object({
  nombre: z.string().nonempty('El nombre de la tienda es requerido'),
  
  // El correo es opcional, si no se provee, la API genera uno.
  // Si se provee, debe ser un formato de email válido.
  correo: z.string()
    .email({ message: 'El formato del correo electrónico no es válido' })
    .endsWith('@pacificoweb.com', { message: 'El correo electrónico debe ser del dominio @pacificoweb.com' })
    .optional(),

  plan_nombre: z.string().nonempty('El nombre del plan es requerido'),
});

// Exportamos el tipo de TypeScript inferido.
export type AdminCreateUserType = z.infer<typeof AdminCreateUserSchema>;
