import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-config';
import {
  PostuResponse,
  TakillaCreate,
  TakillaIrudia,
  TakillaResponse,
  UdalerriaResponse
} from './kargaguneak-interface';

@Injectable({
  providedIn: 'root'
})
export class ApiDeiakKargaguneak {
  private readonly baseUrl = API_BASE;

  constructor(private http: HttpClient) {}

  getTakillak(): Observable<TakillaResponse[]> {
    return this.http.get<TakillaResponse[]>(`${this.baseUrl}/takillak/admin`);
  }

  getUdalerriak(admin = false): Observable<UdalerriaResponse[]> {
    const path = admin ? 'udalerriak/admin' : 'udalerriak';
    return this.http.get<UdalerriaResponse[]>(`${this.baseUrl}/${path}`);
  }

  sortuTakilla(takilla: TakillaCreate): Observable<TakillaResponse> {
    return this.http.post<TakillaResponse>(`${this.baseUrl}/takillak/post`, takilla);
  }

  aldatuTakilla(id: number, takilla: Partial<TakillaCreate>): Observable<TakillaResponse> {
    return this.http.patch<TakillaResponse>(`${this.baseUrl}/takillak/${id}/eguneratu`, takilla);
  }

  ezabatuTakilla(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.baseUrl}/takillak/${id}/delete`);
  }

  getPostuak(idTakilla: number): Observable<PostuResponse[]> {
    return this.http.get<PostuResponse[]>(`${this.baseUrl}/takillak/${idTakilla}/postuak`);
  }

  sortuPostua(idTakilla: number): Observable<PostuResponse> {
    return this.http.post<PostuResponse>(`${this.baseUrl}/takillak/${idTakilla}/postuak`, {});
  }

  ezabatuPostua(idPostu: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.baseUrl}/postuak/${idPostu}/delete`);
  }

  getIrudiak(idTakilla: number): Observable<TakillaIrudia[]> {
    return this.http.get<TakillaIrudia[]>(`${this.baseUrl}/takillak/${idTakilla}/irudiak`);
  }

  sortuIrudia(idTakilla: number, file: File): Observable<TakillaIrudia> {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<TakillaIrudia>(`${this.baseUrl}/takillak/${idTakilla}/irudiak`, data);
  }

  ezabatuIrudia(idTakilla: number, idIrudi: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(
      `${this.baseUrl}/takillak/${idTakilla}/irudiak/${idIrudi}`,
    );
  }
}