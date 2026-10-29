import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-kargaguneak',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kargaguneak-component.html'
})
export class KargaguneakComponent implements OnInit {
  kargaguneak: any[] = [];
  kargaguneBerria = { izena: '', helbidea: '', egoera: 'erabilgarri', irudia: null };

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.kargaguneakKargatu();
  }

  kargaguneakKargatu() {
    this.http.get<any[]>('http://localhost:8000/kargaguneak').subscribe(data => {
      this.kargaguneak = data;
    });
  }

  kargaguneaSortu() {
    this.http.post('http://localhost:8000/kargaguneak', this.kargaguneBerria).subscribe(() => {
      this.kargaguneakKargatu();
      this.kargaguneBerria = { izena: '', helbidea: '', egoera: 'erabilgarri', irudia: null };
    });
  }

  kargaguneaDesaktibatu(id: number) {
    this.http.put(`http://localhost:8000/kargaguneak/${id}/desaktibatu`, {}).subscribe(() => {
      this.kargaguneakKargatu();
    });
  }
}