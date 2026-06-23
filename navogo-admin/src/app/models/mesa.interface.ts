export type EstadoMesa = 'libre' | 'ocupada' | 'cuenta_pendiente' | 'reservada';

// Interfaces para Productos y Órdenes
export interface ProductoAdicional {
  nombre: string;
  precio: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  descuento: string;
  is_combo: boolean;
  imagen: string;
  empresa_id: number;
  adicionales: ProductoAdicional[] | null;
  categoria: string;
  estatus: number;
  fecha_inicio_promo: string | null;
  fecha_fin_promo: string | null;
  is_promo: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItemSelection {
  adicionales?: string[];
  comentario?: string;
}

// Interfaz para las selecciones del backend (formato nuevo)
export interface Seleccion {
  groupTitle: string;  // "Complementos" o "Notas especiales"
  extra: string;       // el texto del complemento o nota
  precio?: number;
  'precio-extra'?: number;
}

// Import para soportar CartItemSelection del product detail dialog
export type OrderItemSelections = OrderItemSelection | Seleccion[] | any[] | null;

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  name: string;
  quantity: number;
  unit_price: string | number;
  selections: OrderItemSelections;
  note?: string;
  created_at: string;
  producto?: Producto;
  /** true = ya fue entregado/cobrado en un ciclo anterior. Backend lo pone en true cuando estatus llega a 6. */
  entregado?: boolean;
}

export interface ItemNuevoPayload {
  product_id: number | null;
  name: string;
  quantity: number;
  unit_price: number;
  selections?: Record<string, any> | null;
}

export interface AgregarItemsResponse {
  message: string;
  items: OrderItem[];
  order: Order;
}

export interface Order {
  id: number;
  folio?: string | number | null;
  folio_diario?: string | number | null;
  folio_dia?: string | number | null;
  business_id: number;
  customer_name: string;
  customer_phone: string;
  shipping_type: 'domicilio' | 'recoger' | 'dine_in';
  payment_method: 'efectivo' | 'transferencia' | 'tarjeta';
  pago_confirmado: boolean;
  envio_confirmado: boolean;
  /** Monto ya cobrado antes de agregar ítems adicionales (uso interno del frontend). */
  monto_pagado_anterior?: number;
  /**
   * Timestamp máximo de los ítems en el momento del pago.
   * Ítems con created_at > pago_confirmado_threshold son post-pago (por cobrar).
   * Solo se usa en el frontend; no viene del backend.
   */
  pago_confirmado_threshold?: string;
  delivery_address: any | null;
  note: string | null;
  tip: string;
  shipping_cost: string;
  subtotal: string;
  total: string;
  estatus: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  sucursal_id: number | null;
  sucursal?: {
    id: number;
    nombre: string;
  } | null;
}

export interface MesaOrdenActiva {
  id: number;
  total: number | string;
  customer_name: string;
  estatus: number;
  items?: OrderItem[];
}

export interface Mesa {
  id: number;
  identificador: string;
  empresa_id: number;
  nombreCliente: string | null;
  posicion_x: number;
  posicion_y: number;
  capacidad: number;
  estado: EstadoMesa;
  ancho: number;
  alto: number;
  tiempo_ocupada: string | null;
  tiempo_transcurrido: number | null;
  zona: string | null;
  hora_reserva: string | null;
  qr_url: string;
  qr_token: string;
  id_orden: number | null;
  orden: Order | null;
  mesa_principal_id?: number | null;
  ordenes_ids?: number[] | null;
  ordenes_activas?: MesaOrdenActiva[];
}

export interface QrData {
  mesa_id: number;
  identificador: string;
  qr_url: string;
  qr_token: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}
