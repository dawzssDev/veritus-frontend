import { Proveedor } from '../inventario/inventario.interface';

export interface CategoriaGasto {
  id: number;
  business_id: number;
  nombre: string;
  icono: string;
  color: string;
  es_sistema: boolean;
}

export type MetodoPagoGasto = 'efectivo' | 'tarjeta' | 'transferencia';
export type FrecuenciaRecurrencia = 'semanal' | 'quincenal' | 'mensual';

export interface GastoInsumoLinea {
  id: number;
  gasto_id: number;
  insumo_id: number;
  cantidad: string;
  costo_unitario: string;
  costo_total: string;
  insumo?: {
    id: number;
    nombre: string;
    unidad_medida: string;
  };
}

export interface Gasto {
  id: number;
  business_id: number;
  sucursal_id: number | null;
  categoria_id: number;
  concepto: string;
  monto: string;
  metodo_pago: MetodoPagoGasto;
  proveedor_id: number | null;
  tiene_factura: boolean;
  folio_factura: string | null;
  fecha_gasto: string;
  es_recurrente: boolean;
  frecuencia_recurrencia: FrecuenciaRecurrencia | null;
  es_compra_insumo: boolean;
  nota: string | null;
  comprobante_url: string | null;
  usuario_id: number | null;
  created_at: string;
  categoria?: CategoriaGasto;
  proveedor?: Proveedor | null;
  lineas_insumos?: GastoInsumoLinea[];
  lineasInsumos?: GastoInsumoLinea[];
}

export interface TotalesGastos {
  total_gastos: number;
  monto_total: number;
}

export interface GastoPorCategoria {
  categoria: string;
  color: string;
  total: string;
}

export interface GastosListResponse {
  data: Gasto[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
  totales: TotalesGastos;
  por_categoria: GastoPorCategoria[];
}

export interface FiltrosGastos {
  fecha_inicio?: string;
  fecha_fin?: string;
  categoria_id?: number;
  metodo_pago?: string;
  busqueda?: string;
  page?: number;
  per_page?: number;
}

export interface LineaInsumoForm {
  insumoId: number | null;
  cantidad: number | null;
  costoUnitario: number | null;
}

export function getLineasInsumos(gasto: Gasto): GastoInsumoLinea[] {
  return gasto.lineas_insumos ?? gasto.lineasInsumos ?? [];
}
