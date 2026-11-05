import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-config';
import { PostuDisponible, PowerbankCreate, PowerbankEdit, PowerbankResponse } from './powerbanks-interface';
@Injectable({
    providedIn: 'root'
})

export class ApiDeiakPowerbanks {
    constructor(private http: HttpClient) { }

    getInfoPowerbanks(): Observable<PowerbankResponse[]> {
        const url = `${API_BASE}/powerbanks/admin`;
        return this.http.get<PowerbankResponse[]>(url);
    }

    getPostuakErabilgarriak(): Observable<PostuDisponible[]> {
        const url = `${API_BASE}/postuak/erabilgarriak`;
        return this.http.get<PostuDisponible[]>(url);
    }

    gordePowerbank(powerbank: PowerbankCreate): Observable<PowerbankResponse> {
        const url = `${API_BASE}/powerbanks/post`;
        return this.http.post<PowerbankResponse>(url, powerbank);
    }

    editatuTokia(id_power: number, powerbank: PowerbankEdit): Observable<PowerbankResponse> {
        const url = `${API_BASE}/powerbanks/${id_power}/aldatuTokia`;
        return this.http.patch<PowerbankResponse>(url, powerbank);
    }

    ezabatuPowerbank(id_power: number): Observable<{ message: string; id: number }> {
        const url = `${API_BASE}/powerbanks/${id_power}/ezabatu`;
        return this.http.delete<{ message: string; id: number }>(url);
    }
}