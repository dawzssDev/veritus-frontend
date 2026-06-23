import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Empresas {
  private apiUrl = environment.apiUrl + '/';
  
    constructor(private http: HttpClient) {}
  
    get(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}getEmpresas`);
    }
  
    getById(id: number): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}getEmpresas/${id}`);
    }
  
    post(data: any): Observable<any>{
      return this.http.post(`${this.apiUrl}postEmpresas`, data)
    }
  
    update(id: number, data: any): Observable<any>{
      // Si es FormData, agregar _method para simular PUT
      if (data instanceof FormData) {
        data.append('_method', 'PUT');
        return this.http.post(`${this.apiUrl}putEmpresas/${id}`, data);
      }
      return this.http.put(`${this.apiUrl}putEmpresas/${id}`, data);
    }

    delete(id: number): Observable<any>{
      return this.http.delete(`${this.apiUrl}deleteEmpresas/${id}`)
    }
}
