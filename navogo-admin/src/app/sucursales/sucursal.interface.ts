export interface Sucursal {
  id:              number;
  empresa_id:      number;
  nombre:          string;
  direccion:       string | null;
  telefono:        string | null;
  estatus:         boolean;
  usuarios_count?: number;
  usuarios?:       UsuarioSucursal[];
  created_at:      string;
  updated_at:      string;
}

export interface UsuarioSucursal {
  id:             number;
  nombreCompleto: string;
  email:          string;
  sucursal_id:    number | null;
}

export interface AsignarUsuarioPayload {
  usuario_id: number;
}
