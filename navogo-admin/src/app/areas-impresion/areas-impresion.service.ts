import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AreaImpresion, CategoriaConArea }
  from './areas-impresion.interface';

@Injectable({ providedIn: 'root' })
export class AreasImpresionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/areas-impresion`;

  getAreas() {
    return this.http.get<{ data: AreaImpresion[] }>(
      this.base
    );
  }

  crearArea(payload: Partial<AreaImpresion>) {
    return this.http.post<{
      data: AreaImpresion; message: string
    }>(this.base, payload);
  }

  actualizarArea(id: number,
    payload: Partial<AreaImpresion>) {
    return this.http.put<{
      data: AreaImpresion; message: string
    }>(`${this.base}/${id}`, payload);
  }

  eliminarArea(id: number) {
    return this.http.delete<{ message: string }>(
      `${this.base}/${id}`
    );
  }

  asignarCategorias(
    areaId: number | null,
    categoriaIds: number[]
  ) {
    return this.http.post<{ message: string }>(
      `${this.base}/asignar-categorias`,
      { area_id: areaId, categoria_ids: categoriaIds }
    );
  }

  categoriasSinArea() {
    return this.http.get<{
      data: CategoriaConArea[]
    }>(`${this.base}/categorias-sin-area`);
  }
}
