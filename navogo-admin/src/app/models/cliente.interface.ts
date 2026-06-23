export interface Direccion {
  id: number;
  alias: string;
  calle: string;
  colonia: string;
  ciudad: string;
  referencia: string;
  predeterminada: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  email: string | null;
  direcciones: Direccion[];
  notas: string | null;
  total_pedidos: number;
  ultimo_pedido: string | null;
}
