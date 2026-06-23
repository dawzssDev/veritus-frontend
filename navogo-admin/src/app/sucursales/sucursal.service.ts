import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sucursal, AsignarUsuarioPayload } from './sucursal.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SucursalService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<{ data: Sucursal[] }> {
    return this.http.get<{ data: Sucursal[] }>(
      `${this.apiUrl}/sucursales`
    );
  }

  getById(id: number): Observable<{ data: Sucursal }> {
    return this.http.get<{ data: Sucursal }>(
      `${this.apiUrl}/sucursales/${id}`
    );
  }

  crear(payload: Partial<Sucursal>): Observable<{ data: Sucursal; message: string }> {
    return this.http.post<{ data: Sucursal; message: string }>(
      `${this.apiUrl}/sucursales`, payload
    );
  }

  actualizar(id: number, payload: Partial<Sucursal>): Observable<{ data: Sucursal; message: string }> {
    return this.http.put<{ data: Sucursal; message: string }>(
      `${this.apiUrl}/sucursales/${id}`, payload
    );
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/sucursales/${id}`
    );
  }

  asignarUsuario(sucursalId: number, payload: AsignarUsuarioPayload): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/sucursales/${sucursalId}/asignar-usuario`,
      payload
    );
  }

  removerUsuario(usuarioId: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/sucursales/remover-usuario/${usuarioId}`, {}
    );
  }
}
