import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductDetail } from '../../models/business.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Productos {
  private apiUrl = environment.apiUrl + '/';
  
    constructor(private http: HttpClient) {}
  
    get(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}getProductos`);
    }
  
    getById(id: number): Observable<ProductDetail> {
      return this.http.get<ProductDetail>(`${this.apiUrl}getProductos/${id}`);
    }
  
    post(data: any): Observable<any>{
      return this.http.post(`${this.apiUrl}postProductos`, data)
    }
  
    update(id: number, data: any): Observable<any>{
      return this.http.put(`${this.apiUrl}putProductos/${id}`, data)
    }

    delete(id: number): Observable<any>{
      return this.http.delete(`${this.apiUrl}deleteProductos/${id}`)
    }
}
