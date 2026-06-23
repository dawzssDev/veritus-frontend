import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Categorias {
  private apiUrl = environment.apiUrl + '/';
  
    constructor(private http: HttpClient) {}
  
    get(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}getCategorias`);
    }
  
    getById(id: number): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}getCategorias/${id}`);
    }
  
    post(data: any): Observable<any>{
      return this.http.post(`${this.apiUrl}postCategorias`, data)
    }
  
    update(id: number, data: any): Observable<any>{
      return this.http.put(`${this.apiUrl}putCategorias/${id}`, data)
    }

    delete(id: number): Observable<any>{
      return this.http.delete(`${this.apiUrl}deleteCategorias/${id}`)
    }
}
