import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateOrderRequest } from '../../models/checkout.interface';
import { AgregarItemsResponse, ItemNuevoPayload } from '../../models/mesa.interface';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createOrder(payload: CreateOrderRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, payload).pipe(
      catchError((error) => {
        console.error('❌ Error creando orden:', error);
        return throwError(() => error);
      })
    );
  }

  // Admin
  listOrders(opts?: string | { fecha?: string; fechaDesde?: string; fechaHasta?: string }): Observable<any> {
    const empresaId = this.authService.getEmpresaId();
    
    if (empresaId === null) {
      return throwError(() => new Error('No se encontró el ID de empresa del usuario'));
    }

    // Agregar sucursal_id como query param si el usuario tiene sucursal asignada
    let params = new HttpParams();
    const sucursalId = this.authService.getSucursalId();
    if (sucursalId !== null) {
      params = params.set('sucursal_id', sucursalId.toString());
    }

    // Parámetros de fecha: cadena simple (compat. anterior) u objeto con fecha única o rango
    if (typeof opts === 'string') {
      params = params.set('fecha', opts);
    } else if (opts?.fecha) {
      params = params.set('fecha', opts.fecha);
    } else if (opts?.fechaDesde) {
      params = params.set('fecha_inicio', opts.fechaDesde);
      if (opts.fechaHasta) params = params.set('fecha_fin', opts.fechaHasta);
    }
    
    return this.http.get(`${this.apiUrl}/orders/${empresaId}`, { params }).pipe(
      catchError((error) => {
        console.error('❌ Error listando órdenes:', error);
        return throwError(() => error);
      })
    );
  }

  getOrder(orderId: number): Observable<any> {
    const empresaId = this.authService.getEmpresaId();
    
    if (empresaId === null) {
      return throwError(() => new Error('No se encontró el ID de empresa del usuario'));
    }
    
    return this.http.get(`${this.apiUrl}/orders/${orderId}/${empresaId}`).pipe(
      catchError((error) => {
        console.error('❌ Error obteniendo orden:', error);
        return throwError(() => error);
      })
    );
  }

  updateOrderChecks(orderId: number, patch: { pago_confirmado?: boolean; envio_confirmado?: boolean; estatus?: number }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/orders/${orderId}`, patch).pipe(
      catchError((error) => {
        console.error('❌ Error actualizando checks:', error);
        return throwError(() => error);
      })
    );
  }

  agregarItems(
    orderId: number,
    items: ItemNuevoPayload[]
  ): Observable<AgregarItemsResponse> {
    return this.http.post<AgregarItemsResponse>(
      `${this.apiUrl}/orders/${orderId}/items`,
      { items }
    );
  }

  actualizarOrden(
    ordenId: number,
    payload: {
      pago_confirmado?:  boolean;
      envio_confirmado?: boolean;
      estatus?:          number;
      payment_method?:   'efectivo' | 'transferencia' | 'tarjeta' | 'combinado';
    }
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/orders/${ordenId}`,
      payload
    );
  }

  pagarCombinado(
    ordenId: number,
    pagos: { metodo: string; monto: number }[]
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/orders/${ordenId}/pago-combinado`,
      { pagos }
    );
  }

  marcarItemEntregado(itemId: number, entregado: boolean): Observable<unknown> {
    return this.http.patch(
      `${this.apiUrl}/order-items/${itemId}/entregado`,
      { entregado }
    );
  }

  marcarItemListoEmplatado(itemId: number, listo: boolean): Observable<unknown> {
    return this.http.patch(
      `${this.apiUrl}/order-items/${itemId}/listo-emplatado`,
      { listo_emplatado: listo }
    );
  }
}
