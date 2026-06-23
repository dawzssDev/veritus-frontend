import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductoTV {
  id:          number;
  nombre:      string;
  descripcion: string | null;
  precio:      number;
  imagen:      string | null;
  categoria:   string;
}

export interface CategoriaTV {
  id:        number;
  nombre:    string;
  productos: ProductoTV[];
}

@Injectable({ providedIn: 'root' })
export class TvService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getCatalogo(empresaId: number): Observable<{ empresa: string; logo: string | null; data: CategoriaTV[] }> {
    return this.http.get<{ empresa: string; logo: string | null; data: CategoriaTV[] }>(
      `${this.apiUrl}/menu-tv/${empresaId}`
    );
  }
}
