export type EstatusReserva =
  | 'pendiente'
  | 'confirmada'
  | 'en_curso'
  | 'completada'
  | 'cancelada'
  | 'no_show';

export interface Reserva {
  id: number;
  empresa_id: number;
  sucursal_id: number | null;
  mesa_id: number;
  usuario_id: number;
  nombre_cliente: string;
  telefono_cliente: string | null;
  email_cliente: string | null;
  num_personas: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  estatus: EstatusReserva;
  notas: string | null;
  created_at: string;
  mesa?: {
    id: number;
    identificador: string;
    zona: string | null;
    capacidad: number;
  };
  usuario?: { id: number; nombreCompleto: string };
}

export interface DisponibilidadMesa {
  id: number;
  identificador: string;
  zona: string | null;
  capacidad: number;
  disponible: boolean;
}
