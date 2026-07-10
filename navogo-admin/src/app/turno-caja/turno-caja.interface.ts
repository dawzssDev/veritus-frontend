export type EstatusTurno = 'abierto' | 'cerrado';
export type TipoMovimientoCaja = 'entrada' | 'salida';

export interface MovimientoCaja {
  id: number;
  turno_caja_id: number;
  tipo: TipoMovimientoCaja;
  monto: string;
  motivo: string;
  nota: string | null;
  gasto_id: number | null;
  usuario_id: number;
  usuario?: { id: number; nombreCompleto: string };
  created_at: string;
}

export interface MetricasEnVivo {
  total_ventas: number;
  total_efectivo: number;
  total_tarjeta: number;
  total_transferencia: number;
  total_propinas: number;
  total_ordenes: number;
  ordenes_canceladas: number;
}

export interface TurnoCaja {
  id: number;
  empresa_id: number;
  sucursal_id: number | null;
  usuario_apertura_id: number;
  usuario_cierre_id: number | null;
  usuarioApertura?: { id: number; nombreCompleto: string };
  usuarioCierre?: { id: number; nombreCompleto: string } | null;
  fondo_inicial: string;
  hora_apertura: string;
  hora_cierre: string | null;
  total_ventas: string;
  total_efectivo: string;
  total_tarjeta: string;
  total_transferencia: string;
  total_propinas: string;
  total_ordenes: number;
  ordenes_canceladas: number;
  total_entradas_caja: string | number;
  total_salidas_caja:  string | number;
  efectivo_esperado:   string | number | null;
  efectivo_contado: string | null;
  diferencia: string | null;
  notas_apertura: string | null;
  notas_cierre: string | null;
  estatus: EstatusTurno;
  estado_arqueo?: string;
  duracion_minutos?: number;
  snapshot_ordenes?: any[];
  movimientos?: MovimientoCaja[];
  metricas_en_vivo?: MetricasEnVivo;
  created_at: string;
}

export interface AbrirTurnoPayload {
  fondo_inicial: number;
  notas_apertura?: string;
}

export interface CerrarTurnoPayload {
  efectivo_contado: number;
  notas_cierre?: string;
}

export interface MovimientoCajaPayload {
  tipo: TipoMovimientoCaja;
  monto: number;
  motivo: string;
  nota?: string;
  gasto_id?: number;
}
