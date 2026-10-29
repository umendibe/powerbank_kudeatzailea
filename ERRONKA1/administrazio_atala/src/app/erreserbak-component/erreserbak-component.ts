import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-erreserbak',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './erreserbak-component.html'
})
export class ErreserbakComponent implements OnInit {
    erreserbak: any[] = [];
    iragazkia = '';

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.erreserbakKargatu();
    }

    erreserbakKargatu() {
        this.http.get<any[]>('http://localhost:8000/erreserbak').subscribe(data => {
            this.erreserbak = data;
        });
    }

    erreserbaEzeztatu(id: number) {
        this.http.put(`http://localhost:8000/erreserbak/${id}/ezeztatu`, {}).subscribe(() => {
            this.erreserbakKargatu();
        });
    }
}