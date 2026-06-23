import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ResumenFacturacion,
  DatosFiscales,
} from '../../models/facturacion.interface';

/**
 * Servicio para manejar facturación y datos fiscales
 */
@Injectable({
  providedIn: 'root',
})
export class FacturacionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Obtener el resumen de facturación del usuario
   */
  getResumenFacturacion(): Observable<{ data: ResumenFacturacion }> {
    return this.http.get<{ data: ResumenFacturacion }>(
      `${this.apiUrl}/stripe/resumen-facturacion`
    );
  }

  /**
   * Generar URL de pago para saldo pendiente
   */
  pagarPendiente(): Observable<{
    data: { url: string; monto: number; moneda: string }
  }> {
    return this.http.post<any>(
      `${this.apiUrl}/stripe/pagar-pendiente`,
      {}
    );
  }

  /**
   * Obtener datos fiscales del usuario
   */
  getDatosFiscales(): Observable<{ data: DatosFiscales | null }> {
    return this.http.get<{ data: DatosFiscales | null }>(
      `${this.apiUrl}/datos-fiscales`
    );
  }

  /**
   * Guardar o actualizar datos fiscales
   */
  guardarDatosFiscales(
    payload: DatosFiscales
  ): Observable<{ data: DatosFiscales; message: string }> {
    return this.http.post<{ data: DatosFiscales; message: string }>(
      `${this.apiUrl}/datos-fiscales`,
      payload
    );
  }
}
