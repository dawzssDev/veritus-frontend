export interface Venta {
  id:               number;
  folio:            string | null;
  folio_dia:        number | null;
  business_id:      number;
  sucursal_id:      number | null;
  customer_name:    string | null;
  customer_phone:   string | null;
  shipping_type:    'mesa' | 'llevar' | 'domicilio' | 'local' | 'recoger';
  payment_method:   string;
  pago_confirmado:  boolean;
  envio_confirmado: boolean;
  estatus:          number;
  subtotal:         string;
  tip:              string;
  shipping_cost:    string;
  total:            string;
  delivery_address: string | null;
  note:             string | null;
  created_at:       string;
  sucursal?:        { id: number; nombre: string } | null;
  items?:           VentaItem[];
}

export interface VentaItem {
  id:         number;
  order_id:   number;
  name:       string;
  quantity:   number;
  unit_price: string;
}

export interface TotalesVentas {
  total_ordenes:        number;
  total_ventas:         number;
  total_efectivo:       number;
  total_tarjeta:        number;
  total_transferencia:  number;
  total_propinas:       number;
  canceladas:           number;
  finalizadas:          number;
  mermas?:              number;
}

export interface FiltrosVentas {
  fecha_inicio?:  string;
  fecha_fin?:     string;
  estatus?:       number | string;
  metodo_pago?:   string;
  shipping_type?: string;
  busqueda?:      string;
  sucursal_id?:   number;
  page?:          number;
  per_page?:      number;
}
