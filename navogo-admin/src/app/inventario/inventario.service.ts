import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  Insumo, Proveedor, KardexResponse
} from './inventario.interface';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/inventario`;

  // ── Insumos ──────────────────────────
  getInsumos(filtros?: {
    categoria?: string;
    busqueda?: string;
    solo_stock_bajo?: boolean;
  }) {
    let params = new URLSearchParams();
    if (filtros?.categoria)
      params.set('categoria', filtros.categoria);
    if (filtros?.busqueda)
      params.set('busqueda', filtros.busqueda);
    if (filtros?.solo_stock_bajo)
      params.set('solo_stock_bajo', '1');

    return this.http.get<Insumo[]>(
      `${this.base}/insumos?${params.toString()}`
    );
  }

  getCategorias() {
    return this.http.get<string[]>(
      `${this.base}/insumos/categorias`
    );
  }

  getInsumo(id: number) {
    return this.http.get<Insumo>(
      `${this.base}/insumos/${id}`
    );
  }

  crearInsumo(payload: any) {
    return this.http.post<Insumo>(
      `${this.base}/insumos`, payload
    );
  }

  actualizarInsumo(id: number, payload: any) {
    return this.http.put<Insumo>(
      `${this.base}/insumos/${id}`, payload
    );
  }

  eliminarInsumo(id: number) {
    return this.http.delete(
      `${this.base}/insumos/${id}`
    );
  }

  // ── Movimientos ──────────────────────
  registrarEntrada(insumoId: number, payload: {
    cantidad: number;
    costo_unitario: number;
    referencia?: string;
  }) {
    return this.http.post<{
      insumo: Insumo; movimiento: any
    }>(
      `${this.base}/insumos/${insumoId}/entrada`,
      payload
    );
  }

  registrarSalida(insumoId: number, payload: {
    cantidad: number;
    motivo: string;
    referencia?: string;
  }) {
    return this.http.post<{
      insumo: Insumo; movimiento: any
    }>(
      `${this.base}/insumos/${insumoId}/salida`,
      payload
    );
  }

  registrarAjuste(insumoId: number, payload: {
    stock_real: number;
    referencia?: string;
  }) {
    return this.http.post<{
      insumo: Insumo; movimiento: any
    }>(
      `${this.base}/insumos/${insumoId}/ajuste`,
      payload
    );
  }

  getKardex(insumoId: number, page = 1) {
    return this.http.get<KardexResponse>(
      `${this.base}/insumos/${insumoId}/kardex?page=${page}`
    );
  }

  // ── Proveedores ──────────────────────
  getProveedores() {
    return this.http.get<Proveedor[]>(
      `${this.base}/proveedores`
    );
  }

  crearProveedor(payload: any) {
    return this.http.post<Proveedor>(
      `${this.base}/proveedores`, payload
    );
  }
}
