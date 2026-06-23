import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mesa, EstadoMesa, ApiResponse, QrData } from '../../models/mesa.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/mesas';

  getAll(): Observable<ApiResponse<Mesa[]>> {
    return this.http.get<ApiResponse<Mesa[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<Mesa>> {
    return this.http.get<ApiResponse<Mesa>>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Mesa>): Observable<ApiResponse<Mesa>> {
    return this.http.post<ApiResponse<Mesa>>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Mesa>): Observable<ApiResponse<Mesa>> {
    return this.http.put<ApiResponse<Mesa>>(`${this.apiUrl}/${id}`, data);
  }

  cambiarEstado(
    id: number, 
    estado: EstadoMesa, 
    extra?: {
      nombreCliente?: string;
      hora_reserva?: string;
      id_orden?: number;
    }
  ): Observable<ApiResponse<Mesa>> {
    return this.http.patch<ApiResponse<Mesa>>(
      `${this.apiUrl}/${id}/estado`, 
      { estado, ...extra }
    );
  }

  actualizarPosicion(id: number, x: number, y: number): Observable<ApiResponse<Mesa>> {
    return this.http.patch<ApiResponse<Mesa>>(
      `${this.apiUrl}/${id}/posicion`, 
      { posicion_x: x, posicion_y: y }
    );
  }

  actualizarTamano(
    id: number,
    ancho: number,
    alto: number,
    posicion_x: number,
    posicion_y: number
  ): Observable<ApiResponse<Mesa>> {
    return this.http.patch<ApiResponse<Mesa>>(
      `${this.apiUrl}/${id}/tamano`,
      { ancho, alto, posicion_x, posicion_y }
    );
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  obtenerQr(id: number): Observable<ApiResponse<QrData>> {
    return this.http.get<ApiResponse<QrData>>(`${this.apiUrl}/${id}/qr`);
  }

  regenerarQr(id: number): Observable<ApiResponse<QrData>> {
    return this.http.post<ApiResponse<QrData>>(`${this.apiUrl}/${id}/qr/regenerar`, {});
  }

  split(mesaId: number, ordenId: number): Observable<ApiResponse<Mesa>> {
    return this.http.post<ApiResponse<Mesa>>(
      `${this.apiUrl}/${mesaId}/split`,
      { orden_id: ordenId }
    );
  }

  splitMesa(mesaId: number, ordenId: number): Observable<ApiResponse<Mesa>> {
    return this.split(mesaId, ordenId);
  }

  merge(payload: {
    mesa_principal_id: number;
    mesas_secundarias: number[];
    orden_id: number | null;
  }): Observable<ApiResponse<Mesa>> {
    return this.http.post<ApiResponse<Mesa>>(
      `${this.apiUrl}/merge`,
      payload
    );
  }
}
