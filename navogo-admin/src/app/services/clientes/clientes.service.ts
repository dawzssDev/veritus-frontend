import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Cliente, Direccion } from '../../models/cliente.interface';
import { environment } from '../../../environments/environment';

export interface ClientesPaginados {
  data: Cliente[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  buscar(q: string): Observable<Cliente[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<{ data: Cliente[] }>(`${this.apiUrl}/clientes/buscar`, { params }).pipe(
      map(res => res.data ?? []),
      catchError(err => {
        console.error('❌ Error buscando clientes:', err);
        return throwError(() => err);
      })
    );
  }

  getAll(page = 1, perPage = 15, q = ''): Observable<ClientesPaginados> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    if (q) params = params.set('q', q);
    return this.http.get<ClientesPaginados>(`${this.apiUrl}/clientes`, { params }).pipe(
      catchError(err => {
        console.error('❌ Error obteniendo clientes:', err);
        return throwError(() => err);
      })
    );
  }

  getById(id: number): Observable<Cliente> {
    return this.http.get<{ data: Cliente }>(`${this.apiUrl}/clientes/${id}`).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('❌ Error obteniendo cliente:', err);
        return throwError(() => err);
      })
    );
  }

  crear(data: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<{ data: Cliente }>(`${this.apiUrl}/clientes`, data).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('❌ Error creando cliente:', err);
        return throwError(() => err);
      })
    );
  }

  actualizar(id: number, data: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<{ data: Cliente }>(`${this.apiUrl}/clientes/${id}`, data).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('❌ Error actualizando cliente:', err);
        return throwError(() => err);
      })
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clientes/${id}`).pipe(
      catchError(err => {
        console.error('❌ Error eliminando cliente:', err);
        return throwError(() => err);
      })
    );
  }

  agregarDireccion(id: number, dir: Partial<Direccion>): Observable<Direccion> {
    return this.http.post<Direccion>(`${this.apiUrl}/clientes/${id}/direcciones`, dir).pipe(
      catchError(err => {
        console.error('❌ Error agregando dirección:', err);
        return throwError(() => err);
      })
    );
  }

  actualizarDireccion(clienteId: number, dirId: number, dir: Partial<Direccion>): Observable<Direccion> {
    return this.http.put<Direccion>(`${this.apiUrl}/clientes/${clienteId}/direcciones/${dirId}`, dir).pipe(
      catchError(err => {
        console.error('❌ Error actualizando dirección:', err);
        return throwError(() => err);
      })
    );
  }

  eliminarDireccion(id: number, dirId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clientes/${id}/direcciones/${dirId}`).pipe(
      catchError(err => {
        console.error('❌ Error eliminando dirección:', err);
        return throwError(() => err);
      })
    );
  }
}
