import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-config';
import { ErabiltzaileCreate, ErabiltzaileResponse, ListErreserbak, PatchErabiltzaile, ErabiltzaileEdit, UdalerriaOption } from './erabiltzaile-interface';

@Injectable({
    providedIn: 'root'
})

export class ApiDeiak {

    constructor(private http: HttpClient) { }

    getInfoErabiltzaileak(): Observable<ErabiltzaileResponse[]> {
        const url = `${API_BASE}/erabiltzaileak`;
        return this.http.get<ErabiltzaileResponse[]>(url);
    }

    getUdalerriak(): Observable<UdalerriaOption[]> {
        const url = `${API_BASE}/udalerriak/admin`;
        return this.http.get<UdalerriaOption[]>(url);
    }

    getInfoErabiltzaileakId(id: number): Observable<ErabiltzaileResponse> {
        const url = `${API_BASE}/erabiltzaileak/${id}`;
        return this.http.get<ErabiltzaileResponse>(url);
    }

    editatuErabiltzaileak(id: number, erabiltzaile: ErabiltzaileEdit): Observable<ErabiltzaileResponse> {
        const url = `${API_BASE}/erabiltzaileak/${id}/eguneratu`;
        return this.http.patch<ErabiltzaileResponse>(url, erabiltzaile);
    }

    ezabatuErabiltzailea(id: number): Observable<void> {
        const url = `${API_BASE}/erabiltzaileak/${id}/ezabatu`;
        return this.http.delete<void>(url);
    }

    gordeErabiltzailea(erabiltzaile: ErabiltzaileCreate): Observable<ErabiltzaileResponse> {
        const url = `${API_BASE}/erabiltzaileak/post`;
        return this.http.post<ErabiltzaileResponse>(url, erabiltzaile);
    }

    erabiltzaileEgoera(id: number, erabiltzailea: PatchErabiltzaile): Observable<ErabiltzaileResponse> {
        const url = `${API_BASE}/erabiltzaileak/${id}/egoera`;
        return this.http.put<ErabiltzaileResponse>(url, erabiltzailea);
    }

    erreserbakListatu(id: number): Observable<ListErreserbak[]> {
        const url = `${API_BASE}/erabiltzaileak/${id}/erreserbak`;
        return this.http.get<ListErreserbak[]>(url);
    }
}