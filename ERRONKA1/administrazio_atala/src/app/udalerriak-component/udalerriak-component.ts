import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Udalerria {
  id_udalerria: number;
  izena: string;
  activo: boolean;
  kargagune_kopurua: number;
}

@Component({
  selector: 'app-udalerriak-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './udalerriak-component.html',
  styleUrl: './udalerriak-component.css',
})
export class UdalerriakComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:8000/alokaziosistema/udalerriak';

  readonly udalerriak = signal<Udalerria[]>([]);
  readonly kargatzen = signal(true);
  readonly errorea = signal<string | null>(null);
  readonly formularioa = signal(false);
  readonly gordetzen = signal(false);
  readonly formularioErrorea = signal<string | null>(null);
  readonly editatzenDenId = signal<number | null>(null);
  izena = '';

  ngOnInit(): void {
    this.kargatu();
  }

  kargatu(): void {
    this.kargatzen.set(true);
    this.errorea.set(null);
    this.http.get<Udalerria[]>(`${this.api}/admin`).subscribe({
      next: (udalerriak) => {
        this.udalerriak.set(udalerriak);
        this.kargatzen.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorea.set(this.mezua(error, 'Ezin izan dira udalerriak kargatu.'));
        this.kargatzen.set(false);
      },
    });
  }

  sortu(): void {
    this.editatzenDenId.set(null);
    this.izena = '';
    this.formularioErrorea.set(null);
    this.formularioa.set(true);
  }

  editatu(udalerria: Udalerria): void {
    this.editatzenDenId.set(udalerria.id_udalerria);
    this.izena = udalerria.izena;
    this.formularioErrorea.set(null);
    this.formularioa.set(true);
  }

  itxi(): void {
    if (this.gordetzen()) return;
    this.formularioa.set(false);
    this.editatzenDenId.set(null);
  }

  gorde(): void {
    const izena = this.izena.trim();
    if (izena.length < 2 || this.gordetzen()) return;

    this.gordetzen.set(true);
    this.formularioErrorea.set(null);
    const id = this.editatzenDenId();
    const request = id === null
      ? this.http.post<Udalerria>(this.api, { izena })
      : this.http.patch<Udalerria>(`${this.api}/${id}`, { izena });

    request.subscribe({
      next: () => {
        this.gordetzen.set(false);
        this.formularioa.set(false);
        this.kargatu();
      },
      error: (error: HttpErrorResponse) => {
        this.gordetzen.set(false);
        this.formularioErrorea.set(this.mezua(error, 'Ezin izan da udalerria gorde.'));
      },
    });
  }

  aldatuEgoera(udalerria: Udalerria): void {
    this.http
      .patch<Udalerria>(`${this.api}/${udalerria.id_udalerria}`, {
        activo: !udalerria.activo,
      })
      .subscribe({
        next: () => this.kargatu(),
        error: (error: HttpErrorResponse) => {
          this.errorea.set(this.mezua(error, 'Ezin izan da udalerria eguneratu.'));
        },
      });
  }

  private mezua(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.detail === 'string' ? error.error.detail : fallback;
  }
}
