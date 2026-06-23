import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductAdicionalGroup } from '../../models/business.interface';

export interface OpcionComplemento {
  extra: string;
  estatus: boolean;
  precio: number | null;
  'precio-extra': number | null;
}

export interface GrupoComplemento {
  id: number;
  titulo: string;
  opciones: OpcionComplemento[];
}

export type GrupoComplementoPayload = Pick<GrupoComplemento, 'titulo' | 'opciones'>;

@Injectable({ providedIn: 'root' })
export class CatalogoComplementosService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/catalogo-complementos`;

  getCatalogo(): Observable<GrupoComplemento[]> {
    return this.http.get<GrupoComplemento[]>(this.url);
  }

  crearGrupo(grupo: GrupoComplementoPayload): Observable<GrupoComplemento> {
    return this.http.post<GrupoComplemento>(this.url, grupo);
  }

  actualizarGrupo(
    id: number,
    grupo: GrupoComplementoPayload
  ): Observable<GrupoComplemento> {
    return this.http.put<GrupoComplemento>(`${this.url}/${id}`, grupo);
  }

  eliminarGrupo(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/${id}`);
  }

  sincronizar(ids?: number[]) {
    const body = ids?.length ? { ids } : {};
    return this.http.post<{
      actualizados: number;
      total: number;
      mensaje: string;
    }>(`${this.url}/sincronizar`, body);
  }

  /** Compatibilidad con diálogo de importación en productos */
  getAll(): Observable<ProductAdicionalGroup[]> {
    return this.getCatalogo().pipe(
      map((grupos) =>
        (Array.isArray(grupos) ? grupos : []).map((g) => ({
          id: g.id,
          catalogo_id: g.id,
          titulo: g.titulo,
          opciones: g.opciones,
        }))
      ),
      catchError((err) => throwError(() => err))
    );
  }
}
