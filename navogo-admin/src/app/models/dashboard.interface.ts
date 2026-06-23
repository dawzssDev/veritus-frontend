export interface DashboardSummaryRange {
  today_start: string;
  now: string;
  last_7d_start: string;
}

export interface DashboardSummaryKpis {
  usuarios_count: number;
  productos_total: number;
  productos_con_descuento: number;
  productos_combos: number;
  carritos_items_count: number;
  carritos_usuarios_count: number;
  orders_today_count: number;
  sales_today_total: number;
  orders_pending_count: number;
  publicidad_activa_count: number;
}

export interface DashboardRecentOrder {
  id: number;
  status: string;
  total: number;
  pago_confirmado: boolean;
  envio_confirmado: boolean;
  created_at: string;
}

export interface DashboardTopProductLast7d {
  product_id: number;
  product_name: string;
  units: number;
  revenue: number;
}

export interface DashboardSummary {
  empresa_id: number;
  range: DashboardSummaryRange;
  kpis: DashboardSummaryKpis;
  recent_orders: DashboardRecentOrder[];
  top_products_last_7d: DashboardTopProductLast7d[];
}
