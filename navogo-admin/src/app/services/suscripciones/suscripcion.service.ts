import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Suscripcion,
  SuscripcionResponse,
  SuscripcionListResponse,
} from '../../models/suscripcion.interface';

@Injectable({
  providedIn: 'root',
})
export class SuscripcionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Obtener todas las suscripciones con filtros opcionales
   */
  getAll(filters?: {
    estatus?: string;
    plan?: string;
  }): Observable<SuscripcionListResponse> {
    let params = new HttpParams();
    if (filters?.estatus) {
      params = params.set('estatus', filters.estatus);
    }
    if (filters?.plan) {
      params = params.set('plan', filters.plan);
    }

    return this.http.get<SuscripcionListResponse>(
      `${this.apiUrl}/suscripciones`,
      { params }
    );
  }

  /**
   * Obtener una suscripción por ID
   */
  getById(id: string): Observable<SuscripcionResponse> {
    return this.http.get<SuscripcionResponse>(
      `${this.apiUrl}/suscripciones/${id}`
    );
  }

  /**
   * Cancelar una suscripción al final del período
   */
  cancelar(id: string): Observable<SuscripcionResponse> {
    return this.http.patch<SuscripcionResponse>(
      `${this.apiUrl}/suscripciones/${id}/cancelar`,
      {}
    );
  }

  /**
   * Reanudar una suscripción cancelada
   */
  reanudar(id: string): Observable<SuscripcionResponse> {
    return this.http.patch<SuscripcionResponse>(
      `${this.apiUrl}/suscripciones/${id}/reanudar`,
      {}
    );
  }
}
