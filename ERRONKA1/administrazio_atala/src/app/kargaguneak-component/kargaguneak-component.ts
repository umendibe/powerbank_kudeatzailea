import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { AuthService } from '../auth/auth.service';
import { ApiDeiakKargaguneak } from './api-deiak-kargaguneak';
import {
  PostuResponse,
  TakillaCreate,
  TakillaEgoera,
  TakillaIrudia,
  TakillaResponse,
  UdalerriaResponse
} from './kargaguneak-interface';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  imports: [CommonModule, FormsModule, AgGridAngular],
  selector: 'app-kargaguneak-component',
  styleUrl: './kargaguneak-component.css',
  templateUrl: './kargaguneak-component.html',
})
export class KargaguneakComponent implements OnInit {
  private readonly apiService = inject(ApiDeiakKargaguneak);
  private readonly auth = inject(AuthService);

  readonly isMunicipalityAdmin = this.auth.isMunicipalityAdmin;
  readonly udalerriak = signal<UdalerriaResponse[]>([]);
  readonly filterUdalerria = signal<number | null>(null);
  takillak = signal<TakillaResponse[]>([]);
  taulaErrorea = signal<string | null>(null);
  readonly takillakFiltratuak = computed(() => {
    const filter = this.filterUdalerria();
    if (filter === null) return this.takillak();
    return this.takillak().filter((takilla) => takilla.id_udalerria === filter);
  });
  formularioa = signal(false);
  editatzenDenId = signal<number | null>(null);
  formularioaGordetzen = signal(false);
  formularioErrorea = signal<string | null>(null);
  takillaDatuak: TakillaCreate = this.takillaBerria();
  ezabatzekoTakilla = signal<TakillaResponse | null>(null);
  takillaEzabatzen = signal(false);
  ezabaketaErrorea = signal<string | null>(null);
  postuakTakillan = signal<PostuResponse[]>([]);
  postuakKargatzen = signal(false);
  postuaGehitzen = signal(false);
  postuaEzabatzenId = signal<number | null>(null);
  postuenErrorea = signal<string | null>(null);
  aukeratutakoTakillaPostuak = signal<TakillaResponse | null>(null);
  irudiak = signal<TakillaIrudia[]>([]);
  irudiakKargatzen = signal(false);
  irudiakErrorea = signal<string | null>(null);
  irudiaIgotzen = signal(false);
  aukeratutakoTakillaIrudiak = signal<TakillaResponse | null>(null);

  readonly egoeraAukerak: { value: TakillaEgoera; label: string }[] = [
    { value: 'erabilgarri', label: 'Erabilgarri' },
    { value: 'mantentze_lanetan', label: 'Mantentze-lanetan' },
    { value: 'zerbitzuz_kanpo', label: 'Zerbitzuz kanpo' }
  ];

  readonly defaultColDef: ColDef = {
    flex: 1,
    filter: true,
    sortable: true,
    resizable: true
  };
  readonly pagination = true;
  readonly paginationPageSize = 5;
  readonly paginationPageSizeSelector: number[] = [5, 10, 20];

  readonly colDefs: ColDef<TakillaResponse>[] = [
    { field: 'id_takilla', headerName: 'ID', width: 90, flex: 0 },
    { field: 'izena', headerName: 'IZENA', filter: 'agTextColumnFilter' },
    { field: 'helbidea', headerName: 'HELBIDEA' },
    {
      headerName: 'UDALERRIA',
      valueGetter: params => params.data?.udalerria_izena ?? params.data?.id_udalerria ?? '',
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'KOKAPENA',
      width: 160,
      flex: 0,
      valueGetter: params => {
        const latitude = params.data?.latitude;
        const longitude = params.data?.longitude;
        return latitude != null && longitude != null
          ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          : '—';
      },
    },
    {
      field: 'egoera',
      headerName: 'EGOERA',
      valueFormatter: params => this.egoeraAukerak.find(option => option.value === params.value)?.label ?? params.value ?? ''
    },
    {
      headerName: 'AKZIOAK',
      width: 270,
      flex: 0,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<TakillaResponse>) => {
        const takilla = params.data;
        const container = document.createElement('div');
        container.className = 'd-flex gap-1 align-items-center h-100';
        if (!takilla) return container;

        container.append(
          this.actionButton('btn-success', 'bi-pencil', 'Datuak aldatu', () => this.editatu(takilla)),
          this.actionButton('btn-info', 'bi-grid-3x3', 'Postuak kudeatu', () => this.postuakKudeatu(takilla)),
          this.actionButton('btn-secondary', 'bi-images', 'Irudiak', () => this.irudiakKudeatu(takilla)),
          this.actionButton(
            takilla.egoera === 'zerbitzuz_kanpo' ? 'btn-secondary' : 'btn-warning',
            takilla.egoera === 'zerbitzuz_kanpo' ? 'bi-check-circle' : 'bi-pause-circle',
            takilla.egoera === 'zerbitzuz_kanpo' ? 'Aktibatu' : 'Desaktibatu',
            () => this.egoeraAldatu(takilla)
          ),
          this.actionButton('btn-danger', 'bi-trash', 'Ezabatu', () => this.ezabatuEskatu(takilla))
        );
        return container;
      }
    }
  ];

  ngOnInit(): void {
    this.kargatuTakillak();
    this.apiService.getUdalerriak(this.auth.isSystemAdmin()).subscribe({
      next: (udalerriak) => this.udalerriak.set(udalerriak),
      error: (error: HttpErrorResponse) => {
        console.error('Errorea udalerriak kargatzean:', error);
      },
    });
  }

  private takillaBerria(): TakillaCreate {
    return {
      izena: '',
      helbidea: '',
      deskribapena: null,
      latitude: null,
      longitude: null,
      id_udalerria: this.auth.session()?.id_udalerria ?? 0,
      egoera: 'erabilgarri',
    };
  }

  private actionButton(
    color: string,
    icon: string,
    title: string,
    action: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn ${color} btn-sm`;
    button.title = title;
    button.setAttribute('aria-label', title);
    button.innerHTML = `<i class="bi ${icon}"></i>`;
    button.addEventListener('click', action);
    return button;
  }

  kargatuTakillak(): void {
    this.taulaErrorea.set(null);
    this.apiService.getTakillak().subscribe({
      next: takillak => this.takillak.set(takillak),
      error: (error: HttpErrorResponse) => {
        console.error('Errorea takillak kargatzean:', error);
        this.taulaErrorea.set('Ezin izan dira takillak kargatu.');
      }
    });
  }

  sortuBerria(): void {
    this.editatzenDenId.set(null);
    this.takillaDatuak = this.takillaBerria();
    this.formularioErrorea.set(null);
    this.formularioa.set(true);
  }

  editatu(takilla: TakillaResponse): void {
    this.editatzenDenId.set(takilla.id_takilla);
    this.takillaDatuak = {
      izena: takilla.izena,
      helbidea: takilla.helbidea,
      deskribapena: takilla.deskribapena,
      latitude: takilla.latitude,
      longitude: takilla.longitude,
      id_udalerria: this.isMunicipalityAdmin()
        ? (this.auth.session()?.id_udalerria ?? takilla.id_udalerria)
        : takilla.id_udalerria,
      egoera: takilla.egoera,
    };
    this.formularioErrorea.set(null);
    this.formularioa.set(true);
  }

  itxiFormularioa(): void {
    if (this.formularioaGordetzen()) return;
    this.formularioa.set(false);
    this.editatzenDenId.set(null);
  }

  gordeTakilla(): void {
    if (this.formularioaGordetzen()) return;

    if (this.isMunicipalityAdmin()) {
      this.takillaDatuak.id_udalerria =
        this.auth.session()?.id_udalerria ?? this.takillaDatuak.id_udalerria;
    }
    if (!this.takillaDatuak.id_udalerria) {
      this.formularioErrorea.set('Aukeratu udalerri bat.');
      return;
    }

    this.formularioaGordetzen.set(true);
    this.formularioErrorea.set(null);
    const id = this.editatzenDenId();
    const request = id === null
      ? this.apiService.sortuTakilla(this.takillaDatuak)
      : this.apiService.aldatuTakilla(id, this.takillaDatuak);
    request.subscribe({
      next: () => {
        this.formularioaGordetzen.set(false);
        this.formularioa.set(false);
        this.kargatuTakillak();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea takilla gordetzean:', error);
        this.formularioErrorea.set(this.errorMezua(error, 'Ezin izan da takilla gorde.'));
        this.formularioaGordetzen.set(false);
      }
    });
  }

  egoeraAldatu(takilla: TakillaResponse): void {
    const egoera: TakillaEgoera = takilla.egoera === 'zerbitzuz_kanpo'
      ? 'erabilgarri'
      : 'zerbitzuz_kanpo';
    this.apiService.aldatuTakilla(takilla.id_takilla, { egoera }).subscribe({
      next: updated => {
        this.takillak.update(rows =>
          rows.map(row => row.id_takilla === updated.id_takilla ? { ...row, ...updated } : row)
        );
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea takillaren egoera aldatzean:', error);
        this.taulaErrorea.set(this.errorMezua(error, 'Ezin izan da egoera aldatu.'));
      }
    });
  }

  ezabatuEskatu(takilla: TakillaResponse): void {
    this.ezabaketaErrorea.set(null);
    this.ezabatzekoTakilla.set(takilla);
  }

  itxiEzabaketa(): void {
    if (this.takillaEzabatzen()) return;
    this.ezabatzekoTakilla.set(null);
    this.ezabaketaErrorea.set(null);
  }

  berretsiEzabaketa(): void {
    const takilla = this.ezabatzekoTakilla();
    if (!takilla || this.takillaEzabatzen()) return;
    this.takillaEzabatzen.set(true);
    this.ezabaketaErrorea.set(null);
    this.apiService.ezabatuTakilla(takilla.id_takilla).subscribe({
      next: () => {
        this.takillak.update(rows => rows.filter(row => row.id_takilla !== takilla.id_takilla));
        this.takillaEzabatzen.set(false);
        this.ezabatzekoTakilla.set(null);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea takilla ezabatzean:', error);
        this.ezabaketaErrorea.set(this.errorMezua(error, 'Ezin izan da takilla ezabatu.'));
        this.takillaEzabatzen.set(false);
      }
    });
  }

  postuakKudeatu(takilla: TakillaResponse): void {
    this.aukeratutakoTakillaPostuak.set(takilla);
    this.postuakTakillan.set([]);
    this.postuenErrorea.set(null);
    this.kargatuPostuak(takilla.id_takilla);
  }

  itxiPostuak(): void {
    this.aukeratutakoTakillaPostuak.set(null);
    this.postuenErrorea.set(null);
  }

  private kargatuPostuak(idTakilla: number): void {
    this.postuakKargatzen.set(true);
    this.apiService.getPostuak(idTakilla).subscribe({
      next: postuak => {
        this.postuakTakillan.set(postuak);
        this.postuakKargatzen.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea postuak kargatzean:', error);
        this.postuenErrorea.set(this.errorMezua(error, 'Ezin izan dira postuak kargatu.'));
        this.postuakKargatzen.set(false);
      }
    });
  }

  postuaGehitu(): void {
    const takilla = this.aukeratutakoTakillaPostuak();
    if (!takilla || this.postuaGehitzen()) return;
    this.postuaGehitzen.set(true);
    this.postuenErrorea.set(null);
    this.apiService.sortuPostua(takilla.id_takilla).subscribe({
      next: postu => {
        this.postuakTakillan.update(rows => [...rows, postu]);
        this.postuaGehitzen.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea postua sortzean:', error);
        this.postuenErrorea.set(this.errorMezua(error, 'Ezin izan da postua sortu.'));
        this.postuaGehitzen.set(false);
      }
    });
  }

  postuaEzabatu(postu: PostuResponse): void {
    if (this.postuaEzabatzenId() !== null) return;
    this.postuaEzabatzenId.set(postu.id_postu);
    this.postuenErrorea.set(null);
    this.apiService.ezabatuPostua(postu.id_postu).subscribe({
      next: () => {
        this.postuakTakillan.update(rows => rows.filter(row => row.id_postu !== postu.id_postu));
        this.postuaEzabatzenId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea postua ezabatzean:', error);
        this.postuenErrorea.set(this.errorMezua(error, 'Ezin izan da postua ezabatu.'));
        this.postuaEzabatzenId.set(null);
      }
    });
  }

  irudiakKudeatu(takilla: TakillaResponse): void {
    this.aukeratutakoTakillaIrudiak.set(takilla);
    this.irudiak.set([]);
    this.irudiakErrorea.set(null);
    this.kargatuIrudiak(takilla.id_takilla);
  }

  itxiIrudiak(): void {
    this.aukeratutakoTakillaIrudiak.set(null);
    this.irudiakErrorea.set(null);
  }

  private kargatuIrudiak(idTakilla: number): void {
    this.irudiakKargatzen.set(true);
    this.apiService.getIrudiak(idTakilla).subscribe({
      next: irudiak => {
        this.irudiak.set(irudiak);
        this.irudiakKargatzen.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea irudiak kargatzean:', error);
        this.irudiakErrorea.set(this.errorMezua(error, 'Ezin izan dira irudiak kargatu.'));
        this.irudiakKargatzen.set(false);
      }
    });
  }

  irudiaIgo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const takilla = this.aukeratutakoTakillaIrudiak();
    if (!file || !takilla || this.irudiaIgotzen()) return;

    this.irudiaIgotzen.set(true);
    this.irudiakErrorea.set(null);
    this.apiService.sortuIrudia(takilla.id_takilla, file).subscribe({
      next: irudia => {
        this.irudiak.update(rows => [...rows, irudia]);
        this.irudiaIgotzen.set(false);
        input.value = '';
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea irudia igotzean:', error);
        this.irudiakErrorea.set(this.errorMezua(error, 'Ezin izan da irudia igo.'));
        this.irudiaIgotzen.set(false);
        input.value = '';
      }
    });
  }

  irudiaEzabatu(irudia: TakillaIrudia): void {
    const takilla = this.aukeratutakoTakillaIrudiak();
    if (!takilla) return;
    this.irudiakErrorea.set(null);
    this.apiService.ezabatuIrudia(takilla.id_takilla, irudia.id_irudi).subscribe({
      next: () => {
        this.irudiak.update(rows => rows.filter(row => row.id_irudi !== irudia.id_irudi));
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea irudia ezabatzean:', error);
        this.irudiakErrorea.set(this.errorMezua(error, 'Ezin izan da irudia ezabatu.'));
      }
    });
  }

  irudiUrl(url: string): string {
    return url.startsWith('/') ? `/api${url}` : url;
  }

  private errorMezua(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.detail === 'string' ? error.error.detail : fallback;
  }
}
