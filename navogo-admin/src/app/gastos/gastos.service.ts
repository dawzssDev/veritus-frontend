import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  CategoriaGasto, Gasto, GastosListResponse, FiltrosGastos
} from './gastos.interface';

@Injectable({ providedIn: 'root' })
export class GastosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/gastos`;

  getGastos(filtros: FiltrosGastos = {}) {
    let params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, val]) => {
      if (val !== null && val !== undefined && val !== '') {
        params.set(key, String(val));
      }
    });
    const qs = params.toString();
    return this.http.get<GastosListResponse>(
      qs ? `${this.base}?${qs}` : this.base
    );
  }

  getGasto(id: number) {
    return this.http.get<Gasto>(`${this.base}/${id}`);
  }

  crearGasto(payload: any) {
    return this.http.post<Gasto>(this.base, payload);
  }

  actualizarGasto(id: number, payload: any) {
    return this.http.put<Gasto>(`${this.base}/${id}`, payload);
  }

  eliminarGasto(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }

  getCategorias() {
    return this.http.get<CategoriaGasto[]>(
      `${this.base}/categorias/listar`
    );
  }

  inicializarCategorias() {
    return this.http.post<{
      message: string;
      categorias: CategoriaGasto[];
    }>(`${this.base}/categorias/inicializar`, {});
  }

  crearCategoria(payload: { nombre: string; icono?: string; color?: string }) {
    return this.http.post<CategoriaGasto>(
      `${this.base}/categorias`, payload
    );
  }

  eliminarCategoria(id: number) {
    return this.http.delete(`${this.base}/categorias/${id}`);
  }
}
