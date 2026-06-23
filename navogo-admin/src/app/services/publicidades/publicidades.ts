import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Publicidades {
  private apiUrl = 'https://api.Dawz.com.mx/api/';
  
    constructor(private http: HttpClient) {}
  
    get(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}getPublicidades`);
    }
  
    getById(id: number): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}getPublicidades/${id}`);
    }
  
    post(data: any): Observable<any>{
      return this.http.post(`${this.apiUrl}postPublicidades`, data)
    }
  
    update(id: number, data: any): Observable<any>{
      return this.http.put(`${this.apiUrl}putPublicidades/${id}`, data)
    }

    delete(id: number): Observable<any>{
      return this.http.delete(`${this.apiUrl}deletePublicidades/${id}`)
    }
}
