/**
 * MODELOS DE DATOS PARA MENÚ PÚBLICO
 * Interfaz Business, Category, Product
 */

export interface Business {
  id: number;
  slug?: string;
  nombre: string;
  descripcion?: string;
  logo?: string;
  imagen?: string; // Campo del backend Laravel
  imagen_url?: string; // Para el banner
  banner?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  lat?: number;
  lng?: number;
  latitud?: number | string; // Nuevos campos de coordenadas
  longitud?: number | string;
  horarios?: string | any; // Puede ser string o objeto JSON
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  // Métodos de pago (admin)
  pago_efectivo?: number;
  pago_tarjeta?: number;
  pago_transferencia?: number;

  // Datos de transferencia (admin)
  titular?: string;
  banco?: string;
  clabe?: string;
  categoria?: string; // Campo del backend
  estado?: 'activo' | 'inactivo' | number;
  estatus?: number | 'activo' | 'inactivo'; // Campo del backend Laravel (a veces llega como string)
  
  // Configuración de envío
  status_envio?: number | boolean;
  costo_base?: number;
  costo_por_km?: number;
  radio_max_km?: number;
  envio_gratis_km?: number;
  envio_gratis_monto?: number;
  
  categorias?: Category[];
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  productos?: Product[];
}

export interface Product {
  id: number;
  categoria_id: number;
  categoria?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_variable?: number | null;
  descuento?: number | null;
  is_combo?: number | null;
  is_promo?: number | null;
  fecha_inicio_promo?: string | null;
  fecha_fin_promo?: string | null;
  is_recurrente?: number | null;
  dias_promo?: number[] | null;
  imagen?: string;
  imagen_url?: string;
  estado: 'activo' | 'inactivo';
  destacado?: boolean;
  adicionales?: ProductAdicionalGroup[];
}

export interface ProductAdicionalOption {
  extra: string;
  estatus: boolean;
  precio?: number | null;
  'precio-extra'?: number | null;
}

export interface ProductAdicionalGroup {
  id?: string | number;
  catalogo_id?: number | null;
  titulo: string;
  opciones: ProductAdicionalOption[];
}

export interface ProductDetail {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_variable?: number | null;
  descuento?: number | null;
  is_combo?: number | null;
  is_promo?: number | null;
  fecha_inicio_promo?: string | null;
  fecha_fin_promo?: string | null;
  is_recurrente?: number | null;
  dias_promo?: number[] | null;
  imagen?: string;
  imagen_url?: string;
  empresa_id?: number;
  created_at?: string;
  updated_at?: string;
  adicionales?: ProductAdicionalGroup[];
}

export interface MenuResponse {
  success: boolean;
  data: Business;
  message?: string;
}

/**
 * Configuración de envío de la empresa
 */
export interface ShippingConfig {
  status_envio: number | boolean;
  costo_base: number;
  costo_por_km: number;
  radio_max_km?: number;
  envio_gratis_km?: number;
  envio_gratis_monto?: number;
}

export interface ShippingConfigResponse {
  success: boolean;
  data?: ShippingConfig;
  message?: string;
}
