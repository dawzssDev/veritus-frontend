export type TipoCorte = 'manana' | 'tarde' | 'diario';

export interface MetricasCorte {
  total_ventas:        number;
  total_efectivo:      number;
  total_tarjeta:       number;
  total_transferencia: number;
  total_propinas:      number;
  total_ordenes:       number;
  ordenes_canceladas:  number;
  tipo?:               TipoCorte;
  etiqueta?:           string;
  fecha?:              string;
  hora_inicio?:        string;
  hora_cierre?:        string;
}

export interface CorteCaja {
  id:                  number;
  empresa_id:          number;
  sucursal_id:         number | null;
  usuario_id:          number;
  tipo:                TipoCorte;
  fecha:               string;
  hora_inicio:         string;
  hora_cierre:         string;
  fondo_inicial:       string;
  total_ventas:        string;
  total_efectivo:      string;
  total_tarjeta:       string;
  total_transferencia: string;
  total_propinas:      string;
  total_ordenes:       number;
  ordenes_canceladas:  number;
  efectivo_contado:    string | null;
  diferencia:          string | null;
  retiro_efectivo:     string;
  notas:               string | null;
  estatus:             'abierto' | 'cerrado';
  estado_arqueo?:      string;
  etiqueta?:           string;
  created_at:          string;
  usuario?: { id: number; nombreCompleto: string };
}

export interface ResumenDia {
  fecha:    string;
  cortes:   Partial<Record<TipoCorte, CorteCaja>>;
  previews: Partial<Record<TipoCorte, MetricasCorte>>;
}
