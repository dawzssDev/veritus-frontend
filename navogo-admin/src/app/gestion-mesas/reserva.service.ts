import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable }            from 'rxjs';
import { Reserva, DisponibilidadMesa } from './reserva.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getReservas(filtros: {
    fecha?:      string;
    fecha_inicio?:string;
    fecha_fin?:  string;
    mesa_id?:    number;
    estatus?:    string;
  } = {}): Observable<{ data: Reserva[] }> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params = params.set(k, String(v));
    });
    return this.http.get<{ data: Reserva[] }>(
      `${this.apiUrl}/reservas`, { params }
    );
  }

  crear(payload: any): Observable<{ data: Reserva; message: string }> {
    return this.http.post<{ data: Reserva; message: string }>(
      `${this.apiUrl}/reservas`, payload
    );
  }

  actualizar(id: number, payload: any):
    Observable<{ data: Reserva; message: string }> {
    return this.http.put<{ data: Reserva; message: string }>(
      `${this.apiUrl}/reservas/${id}`, payload
    );
  }

  cambiarEstatus(id: number, estatus: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/reservas/${id}/estatus`, { estatus }
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reservas/${id}`);
  }

  getDisponibilidad(params: {
    fecha: string; hora_inicio: string; duracion_minutos: number;
  }): Observable<{ data: DisponibilidadMesa[] }> {
    let p = new HttpParams()
      .set('fecha',            params.fecha)
      .set('hora_inicio',      params.hora_inicio)
      .set('duracion_minutos', String(params.duracion_minutos));
    return this.http.get<{ data: DisponibilidadMesa[] }>(
      `${this.apiUrl}/reservas/disponibilidad`, { params: p }
    );
  }
}
