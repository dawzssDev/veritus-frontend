import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Factura, FacturapiConfig, OrdenParaFacturar, ClienteFiscal
} from './facturacion.interface';

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/facturacion`;

  getConfig() {
    return this.http.get<{
      data: FacturapiConfig | null;
      configurado: boolean;
    }>(`${this.base}/config`);
  }

  saveConfig(payload: {
    rfc:            string;
    razon_social:   string;
    regimen_fiscal: string;
    codigo_postal:  string;
  }) {
    return this.http.post<{
      data: FacturapiConfig;
      message: string;
    }>(`${this.base}/config`, payload);
  }

  getFacturas(filtros: {
    fecha_inicio?: string;
    fecha_fin?: string;
    rfc?: string;
    estatus?: string;
    page?: number;
  } = {}) {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '')
        params = params.set(k, String(v));
    });
    return this.http.get<any>(
      `${this.base}/facturas`, { params }
    );
  }

  emitirFactura(payload: any) {
    return this.http.post<{
      data: Factura;
      message: string;
    }>(`${this.base}/emitir`, payload);
  }

  descargarPdf(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/facturas/${id}/pdf`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  descargarXml(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/facturas/${id}/xml`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  enviarEmail(id: number, email: string) {
    return this.http.post<{ ok: boolean; message: string }>(
      `${this.base}/facturas/${id}/email`,
      { email }
    );
  }

  cancelarFactura(id: number, payload: {
    motivo: string;
    folio_sustitucion?: string;
  }) {
    return this.http.post<{
      data: Factura;
      message: string;
    }>(`${this.base}/facturas/${id}/cancelar`, payload);
  }

  buscarOrdenes(filtros: {
    folio?: string;
    fecha?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    return this.http.get<{ data: OrdenParaFacturar[] }>(
      `${this.base}/ordenes`, { params }
    );
  }

  buscarClientesFiscales(q: string) {
    return this.http.get<{ data: ClienteFiscal[] }>(
      `${this.base}/clientes/buscar`,
      { params: { q } }
    );
  }

  getClientesFiscales(page = 1) {
    return this.http.get<any>(
      `${this.base}/clientes`,
      { params: { page } }
    );
  }

  crearClienteFiscal(payload: Partial<ClienteFiscal>) {
    return this.http.post<{
      data: ClienteFiscal;
      message: string;
    }>(`${this.base}/clientes`, payload);
  }

  actualizarClienteFiscal(
    id: number,
    payload: Partial<ClienteFiscal>
  ) {
    return this.http.put<{
      data: ClienteFiscal;
      message: string;
    }>(`${this.base}/clientes/${id}`, payload);
  }

  eliminarClienteFiscal(id: number) {
    return this.http.delete<{ message: string }>(
      `${this.base}/clientes/${id}`
    );
  }
}
