import { CartItem } from './cart.interface';

export type ShippingType = 'domicilio' | 'recoger' | 'local';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'combinado';

export interface CustomerContact {
  name: string;
  phoneCountry: string; // Ej: +52
  phone: string; // Solo dígitos
}

export interface DeliveryAddress {
  colonia: string;
  ciudad?: string;
  calle: string;
  numero: string;
  entreCalles?: string;
  referencias?: string;
  lat?: number;
  lng?: number;
}

export interface CheckoutDraft {
  businessId: number;
  shippingType: ShippingType;
  contact: CustomerContact;
  address?: DeliveryAddress;
  tip: number;
  paymentMethod: PaymentMethod;
  note?: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

export interface CreateOrderItemRequest {
  product_id?: number | null;
  name: string;
  quantity: number;
  unit_price: number;
  selections?: unknown[] | null;
}

export interface CreateOrderRequest {
  business_id: number;
  sucursal_id?: number | null;
  customer_name: string;
  customer_phone: string;
  shipping_type: ShippingType;
  payment_method: PaymentMethod;
  pago_confirmado: boolean;
  envio_confirmado: boolean;

  // Domicilio: JSON con campos de dirección (tabla orders.delivery_address)
  delivery_address?: DeliveryAddress | null;
  // ID de mesa si el pedido es para mesa
  mesa_id?: number | null;
  // ID del cliente registrado (domicilio)
  cliente_id?: number | null;
  // Nota general del pedido (tabla orders.note)
  note?: string | null;

  tip: number;
  shipping_cost: number;
  subtotal: number;
  total: number;

  items: CreateOrderItemRequest[];

  pagos?: { metodo: string; monto: number }[];

  cobro_inmediato?: boolean;
  tiempo_entrega_estimado?: string | null;
}
