import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-config';
import {
  ErreserbaAdmin,
  ErreserbaEgoera,
  ErreserbaResponse,
} from './erreserbak-interface';

@Injectable({
  providedIn: 'root',
})
export class ApiDeiakErreserbak {
  private readonly baseUrl = API_BASE;

  constructor(private http: HttpClient) {}

  getErreserbak(): Observable<ErreserbaAdmin[]> {
    return this.http.get<ErreserbaAdmin[]>(`${this.baseUrl}/erreserbak/admin`);
  }

  aldatuEgoera(
    id: number,
    egoera: ErreserbaEgoera,
  ): Observable<ErreserbaResponse> {
    return this.http.patch<ErreserbaResponse>(
      `${this.baseUrl}/erreserbak/${id}/egoera`,
      { egoera },
    );
  }

  ezeztatu(id: number): Observable<ErreserbaResponse> {
    return this.http.patch<ErreserbaResponse>(
      `${this.baseUrl}/erreserbak/${id}/ezeztatu`,
      {},
    );
  }
}
