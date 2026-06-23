/**
 * INTERFACES PARA MÓDULO DE FACTURACIÓN
 */

export type EstatusFactura = 'pagada' | 'pendiente' | 'vencida' | 'cancelada';

export interface Factura {
  id: string;
  folio: string; // FAC-2026-001
  periodo: string; // Abril 2026
  fechaEmision: string; // ISO string
  fechaVencimiento: string; // ISO string
  fechaPago?: string; // ISO string, solo si pagada
  concepto: string;
  plan: string; // Starter | Business | Enterprise
  subtotal: number;
  iva: number; // 16%
  total: number;
  estatus: EstatusFactura;
  metodoPago?: string;
  urlPdf?: string | null;
}

export interface DatosFiscales {
  id?:            number;
  usuario_id?:    number;
  razon_social:   string;
  rfc:            string;
  regimen_fiscal: string;
  uso_cfdi:       string;
  calle:          string;
  colonia:        string;
  municipio:      string;
  estado:         string;
  cp:             string;
  email_fiscal:   string;
  // Alias para compatibilidad con código existente
  razonSocial?: string;
  regimenFiscal?: string;
  usoCfdi?: string;
  numeroExterior?: string;
  numeroInterior?: string;
  ciudad?: string;
  codigoPostal?: string;
  pais?: string;
  email?: string;
}

export interface ResumenFacturacion {
  plan_actual:          string | null;
  periodo:              string | null;
  precio:               number;
  moneda:               string;
  total_pagado:         number;
  saldo_pendiente:      number;
  proximo_vencimiento:  string | null;
  fecha_renovacion:     string | null;
  periodo_fin:          string | null;
  estatus:              string | null;
  trial_fin:            string | null;
  dias_trial:           number | null;
  stripe_customer_id:   string;
  stripe_subscription_id: string;
}

/**
 * INTERFACES PARA STRIPE
 */

export interface StripeInvoice {
  id:               string;
  numero:           string | null;
  estatus:          'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  monto:            number;
  moneda:           string;
  fecha_creacion:   string;
  fecha_vencimiento:string | null;
  periodo_inicio:   string | null;
  periodo_fin:      string | null;
  pdf_url:          string | null;
  hosted_url:       string | null;
  descripcion:      string | null;
  subtotal:         number;
  impuestos:        number;
  total:            number;
  pagada:           boolean;
  intentos_cobro:   number;
  plan:             string | null;
}

export interface InvoicesResponse {
  data:        StripeInvoice[];
  total:       number;
  customer_id: string;
}
