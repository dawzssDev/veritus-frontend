import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Usuarios {
  private apiUrl = environment.apiUrl + '/';

  constructor(private http: HttpClient) {}

  get(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}getUsuarios`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}getUsuarios/${id}`);
  }

  post(data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}postUsuarios`, data);
  }

  update(id: number, data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}putUsuarios/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}deleteUsuarios/${id}`);
  }
}
