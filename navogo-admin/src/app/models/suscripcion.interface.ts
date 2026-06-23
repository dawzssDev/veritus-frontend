export interface Suscripcion {
  id: string;
  plan: string;
  periodo: 'mensual' | 'anual';
  estatus: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  precio: number;
  moneda: string;
  proximo_cobro?: string;
  periodo_fin?: string;
  trial_fin?: string;
  dias_restantes_trial?: number;
  marca_tarjeta?: string;
  ultimos_4_digitos?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SuscripcionResponse {
  data: Suscripcion;
  message?: string;
}

export interface SuscripcionListResponse {
  data: Suscripcion[];
  message?: string;
}
