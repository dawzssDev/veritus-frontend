export interface Proveedor {
  id: number;
  business_id: number;
  nombre: string;
  telefono: string | null;
  contacto: string | null;
  notas: string | null;
}

export type UnidadMedida =
  'kg' | 'g' | 'lt' | 'ml' | 'pza' | 'caja' | 'paquete';

export interface Insumo {
  id: number;
  business_id: number;
  sucursal_id: number | null;
  nombre: string;
  categoria: string | null;
  unidad_medida: UnidadMedida;
  stock_actual: string;
  stock_minimo: string;
  costo_promedio: string;
  proveedor_id: number | null;
  proveedor?: Proveedor | null;
  activo: boolean;
  stock_bajo: boolean;
}

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';
export type MotivoMovimiento =
  'compra' | 'merma' | 'consumo_manual'
  | 'ajuste_inventario' | 'devolucion';

export interface MovimientoInventario {
  id: number;
  insumo_id: number;
  tipo: TipoMovimiento;
  motivo: MotivoMovimiento;
  cantidad: string;
  costo_unitario: string;
  costo_total: string;
  stock_anterior: string;
  stock_nuevo: string;
  referencia: string | null;
  gasto_id: number | null;
  usuario_id: number | null;
  created_at: string;
}

export interface KardexResponse {
  data: MovimientoInventario[];
  current_page: number;
  last_page: number;
  total: number;
}
