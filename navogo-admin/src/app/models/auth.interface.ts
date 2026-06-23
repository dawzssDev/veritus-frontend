/**
 * Interface para el usuario (basada en respuesta del backend Laravel)
 */
export interface User {
  id: number;
  nombreCompleto: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  avatar?: string;
  fotoPerfil_url?: string; // URL de la foto de perfil del backend
  role?: string;
  roleId?: number; // 1 = Administrador, 2 = Caja, 3 = Mesero, 4 = Cocina
  role_id?: number; // Alternativa del backend
  // Relación/atributo para la empresa del usuario (según backend)
  id_empresa?: number;
  empresa_id?: number;
  empresaId?: number;
  empresa?: {
    id: number;
  };
  sucursal_id?: number | null;
  // Agrega otros campos que tu modelo Usuario de Laravel tenga
}

/**
 * Interface para la respuesta del login
 */
export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * Interface para las credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface para respuesta de error del backend
 */
export interface ErrorResponse {
  error?: string;
  message?: string;
  errors?: { [key: string]: string[] };
}
