import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ErabiltzaileCreate, ErabiltzaileResponse, ListErreserbak, PatchErabiltzaile, ErabiltzaileEdit } from './erabiltzaile-interface';

@Injectable({
    providedIn: 'root'
})

export class ApiDeiak {

    host: string = "localhost:8000";

    constructor(private http: HttpClient) { }

    getInfoErabiltzaileak(): Observable<ErabiltzaileResponse[]> {
        const url = `http://${this.host}/alokaziosistema/erabiltzaileak`;
        return this.http.get<ErabiltzaileResponse[]>(url);
    }

    getInfoErabiltzaileakId(id: number): Observable<ErabiltzaileResponse> {
        const url = `http://${this.host}/alokaziosistema/erabiltzaileak/${id}`;
        return this.http.get<ErabiltzaileResponse>(url);
    }

    editatuErabiltzaileak(id: number, erabiltzaile: ErabiltzaileEdit): Observable<ErabiltzaileResponse> {
        const url = `http://${this.host}/alokaziosistema/erabiltzaileak/${id}/eguneratu`;
        return this.http.patch<ErabiltzaileResponse>(url, erabiltzaile);
    }

    ezabatuErabiltzailea(id: number): Observable<void> {
        const url = `http://${this.host}/alokaziosistema/erabiltzaileak/${id}/ezabatu`;
        return this.http.delete<void>(url);
    }

    gordeErabiltzailea(erabiltzaile: ErabiltzaileCreate): Observable<ErabiltzaileResponse> {
        const url = `http://${this.host}/alokaziosistema/erabiltzaileak/post`;
        return this.http.post<ErabiltzaileResponse>(url, erabiltzaile);
    }

    erabiltzaileEgoera(id: number, erabiltzailea: PatchErabiltzaile): Observable<ErabiltzaileResponse> {
        const url = `http://${this.host}/alokaziosistema/erabiltzaileak/${id}/egoera`;
        return this.http.put<ErabiltzaileResponse>(url, erabiltzailea);
    }

    erreserbakListatu(id: number): Observable<ListErreserbak[]> {
        const url = `http://${this.host}/alokaziosistema/erabiltzaileak/${id}/erreserbak`;
        return this.http.get<ListErreserbak[]>(url);
    }
}