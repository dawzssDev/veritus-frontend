/**
 * INTERFAZ PARA DATOS DEL TICKET DE VENTA
 */

export interface ComplementoTicket {
  nombre: string;
  precio: number;
}

export interface ItemTicket {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  nota?: string;
  complementos?: ComplementoTicket[];
}

export interface OrdenTicket {
  id: number;
  folio?: string | number | null;
  folio_diario?: string | number | null;
  folio_dia?: string | number | null;
  folio_empresa?: number;
  fecha: string;
  items: ItemTicket[];
  subtotal: number;
  propina: number;
  costo_envio: number;
  total: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'combinado';
  monto_recibido?: number;
  cambio?: number;
  tipo_servicio: 'mesa' | 'llevar' | 'domicilio';
  mesa?: string;
  nombre_cliente?: string;
  telefono_cliente?: string;
  direccion_entrega?: {
    calle?: string;
    numero?: string;
    colonia?: string;
    ciudad?: string;
    referencias?: string;
  } | null;
  nombre_empresa: string;
  direccion_empresa?: string;
  cobro_inmediato?: boolean;
  nota?: string;
  pagos_combinado?: {
    metodo: string;
    monto:  number;
  }[];
}

export interface TicketVentaData {
  orden: OrdenTicket;
}
