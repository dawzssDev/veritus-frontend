export interface AreaImpresion {
  id: number;
  business_id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  categorias?: { id: number; nombre: string }[];
}

export interface CategoriaConArea {
  id: number;
  nombre: string;
  area_impresion_id: number | null;
}
