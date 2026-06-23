export type CategoriaTicket =
  | 'soporte_tecnico' | 'facturacion' | 'funcionalidad'
  | 'reporte_error'   | 'consulta'   | 'otro';

export type PrioridadTicket = 'alta' | 'media' | 'baja';

export type EstatusTicket =
  | 'abierto' | 'en_revision' | 'resuelto' | 'cerrado';

export interface Ticket {
  id:              number;
  numero_ticket:   string;
  titulo:          string;
  descripcion:     string;
  categoria:       CategoriaTicket;
  prioridad:       PrioridadTicket;
  estatus:         EstatusTicket;
  respuesta_admin: string | null;
  respondido_en:   string | null;
  created_at:      string;
  categoria_label?: string;
  prioridad_label?: string;
  estatus_label?:  string;
}
