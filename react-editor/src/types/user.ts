export interface User {
  usuario_uuid: string;
  correo: string;
  nombre: string | null;
  plan: string | null;
  status: string;
  creado_at: string;
  fecha_expiracion: string | null;
  username: string | null;
  age: number | null;
  gender: 'hombre' | 'mujer' | 'otro' | 'prefiero_no_decirlo' | null;
}