import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostuDisponible, PowerbankCreate, PowerbankEdit, PowerbankResponse } from './powerbanks-interface';
@Injectable({
    providedIn: 'root'
})

export class ApiDeiakPowerbanks {
    host: string = "localhost:8000";

    constructor(private http: HttpClient) { }

    getInfoPowerbanks(): Observable<PowerbankResponse[]> {
        const url = `http://${this.host}/alokaziosistema/powerbanks`;
        return this.http.get<PowerbankResponse[]>(url);
    }

    getPostuakErabilgarriak(): Observable<PostuDisponible[]> {
        const url = `http://${this.host}/alokaziosistema/postuak/erabilgarriak`;
        return this.http.get<PostuDisponible[]>(url);
    }

    gordePowerbank(powerbank: PowerbankCreate): Observable<PowerbankResponse> {
        const url = `http://${this.host}/alokaziosistema/powerbanks/post`;
        return this.http.post<PowerbankResponse>(url, powerbank);
    }

    editatuTokia(id_power: number, powerbank: PowerbankEdit): Observable<PowerbankResponse> {
        const url = `http://${this.host}/alokaziosistema/powerbanks/${id_power}/aldatuTokia`;
        return this.http.patch<PowerbankResponse>(url, powerbank);
    }

    ezabatuPowerbank(id_power: number): Observable<{ message: string; id: number }> {
        const url = `http://${this.host}/alokaziosistema/powerbanks/${id_power}/ezabatu`;
        return this.http.delete<{ message: string; id: number }>(url);
    }
}