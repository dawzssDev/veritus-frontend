import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of }        from 'rxjs';
import { map, catchError }       from 'rxjs/operators';
import { FiltrosVentas }         from './ventas.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getHistorial(filtros: FiltrosVentas = {}): Observable<any> {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, val]) => {
      if (val !== null && val !== undefined && val !== '') {
        params = params.set(key, String(val));
      }
    });

    return this.http.get(
      `${this.apiUrl}/ordenes/historial`, { params }
    );
  }

  /** Devuelve el total acumulado de órdenes de la empresa (para el folio secuencial). */
  getTotalOrdenes(): Observable<number> {
    return this.getHistorial({ page: 1, per_page: 1 }).pipe(
      map((res: any) => res.meta?.total ?? 0),
      catchError(() => of(0))
    );
  }

  /**
   * Devuelve el folio secuencial de una orden específica según su posición
   * en el historial completo (orden más antigua = #1, más reciente = #N).
   */
  getFolioDeOrden(orderId: number): Observable<number> {
    return this.getHistorial({ page: 1, per_page: 1000 }).pipe(
      map((res: any) => {
        const orders: any[] = res.data ?? [];
        const total: number = res.meta?.total ?? orders.length;
        const idx = orders.findIndex((o: any) => o.id === orderId);
        return idx >= 0 ? total - idx : total;
      }),
      catchError(() => of(0))
    );
  }
}
