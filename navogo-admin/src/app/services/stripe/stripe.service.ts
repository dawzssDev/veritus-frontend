import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InvoicesResponse } from '../../models/facturacion.interface';
import { environment } from '../../../environments/environment';

/**
 * Servicio para interactuar con Stripe vía el backend de Laravel
 */
@Injectable({
  providedIn: 'root',
})
export class StripeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Obtener todas las facturas (invoices) del usuario autenticado
   */
  getInvoices(): Observable<InvoicesResponse> {
    return this.http.get<InvoicesResponse>(
      `${this.apiUrl}/stripe/invoices`
    );
  }

  /**
   * Obtener las URLs del PDF de una factura específica
   * @param invoiceId - ID de la invoice en Stripe
   */
  getInvoicePdf(invoiceId: string): Observable<{
    pdf_url: string;
    hosted_url: string;
  }> {
    return this.http.get<{ pdf_url: string; hosted_url: string }>(
      `${this.apiUrl}/stripe/invoices/${invoiceId}/pdf`
    );
  }
}
