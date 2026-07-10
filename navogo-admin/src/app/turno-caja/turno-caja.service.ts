import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  TurnoCaja, MovimientoCaja,
  AbrirTurnoPayload, CerrarTurnoPayload,
  MovimientoCajaPayload,
} from './turno-caja.interface';

@Injectable({ providedIn: 'root' })
export class TurnoCajaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/turnos-caja`;

  /**
   * Turno actualmente abierto (o data: null si no hay)
   */
  getActual(): Observable<{ data: TurnoCaja | null }> {
    return this.http.get<{ data: TurnoCaja | null }>(
      `${this.base}/actual`
    );
  }

  abrir(payload: AbrirTurnoPayload):
    Observable<{ data: TurnoCaja; message: string }> {
    return this.http.post<{ data: TurnoCaja; message: string }>(
      `${this.base}/abrir`, payload
    );
  }

  registrarMovimiento(payload: MovimientoCajaPayload):
    Observable<{ data: MovimientoCaja; message: string }> {
    return this.http.post<{ data: MovimientoCaja; message: string }>(
      `${this.base}/movimiento`, payload
    );
  }

  cerrar(payload: CerrarTurnoPayload):
    Observable<{ data: TurnoCaja; message: string }> {
    return this.http.post<{ data: TurnoCaja; message: string }>(
      `${this.base}/cerrar`, payload
    );
  }

  getHistorial(filtros: {
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    per_page?: number;
  } = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== undefined && v !== null)
        params = params.set(k, String(v));
    });
    return this.http.get(`${this.base}`, { params });
  }

  getDetalle(id: number): Observable<{ data: TurnoCaja }> {
    return this.http.get<{ data: TurnoCaja }>(
      `${this.base}/${id}`
    );
  }

  getTicketTurno(id: number) {
    return this.http.get<{ data: any }>(
      `${this.base}/${id}/ticket`
    );
  }

  getTicketDia(fecha?: string) {
    const params = fecha ? `?fecha=${fecha}` : '';
    return this.http.get<{ data: any }>(
      `${this.base}/ticket-dia${params}`
    );
  }
}
