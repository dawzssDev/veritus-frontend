import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { Ticket }             from './ticket.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTickets(): Observable<{ data: Ticket[] }> {
    return this.http.get<{ data: Ticket[] }>(`${this.apiUrl}/tickets`);
  }

  crear(payload: {
    titulo:      string;
    descripcion: string;
    categoria:   string;
    prioridad:   string;
  }): Observable<{ data: Ticket; message: string }> {
    return this.http.post<{ data: Ticket; message: string }>(
      `${this.apiUrl}/tickets`,
      payload
    );
  }
}
