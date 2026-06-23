import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable }            from 'rxjs';
import { environment } from '../../environments/environment';
import {
  MetricasCorte, CorteCaja, ResumenDia, TipoCorte
} from './corte-caja.interface';

@Injectable({ providedIn: 'root' })
export class CorteCajaService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getResumenDia(fecha?: string): Observable<{ data: ResumenDia }> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<{ data: ResumenDia }>(
      `${this.apiUrl}/cortes-caja/resumen-dia`, { params }
    );
  }

  getPreview(tipo: TipoCorte, fecha?: string):
    Observable<{ data: MetricasCorte }> {
    let params = new HttpParams().set('tipo', tipo);
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<{ data: MetricasCorte }>(
      `${this.apiUrl}/cortes-caja/preview`, { params }
    );
  }

  cerrar(payload: {
    tipo:              TipoCorte;
    fecha?:            string;
    fondo_inicial:     number;
    efectivo_contado?: number;
    retiro_efectivo?:  number;
    notas?:            string;
  }): Observable<{ data: CorteCaja; message: string }> {
    return this.http.post<{ data: CorteCaja; message: string }>(
      `${this.apiUrl}/cortes-caja`, payload
    );
  }

  getHistorial(filtros: {
    fecha?: string;
    tipo?:  TipoCorte;
    page?:  number;
  } = {}): Observable<any> {
    let params = new HttpParams();
    if (filtros.fecha) params = params.set('fecha', filtros.fecha);
    if (filtros.tipo)  params = params.set('tipo',  filtros.tipo);
    if (filtros.page)  params = params.set('page',  filtros.page);
    return this.http.get(
      `${this.apiUrl}/cortes-caja`, { params }
    );
  }

  getDetalle(id: number): Observable<{ data: CorteCaja }> {
    return this.http.get<{ data: CorteCaja }>(
      `${this.apiUrl}/cortes-caja/${id}`
    );
  }
}
