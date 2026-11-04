import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  ICellRendererParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { ApiDeiakErreserbak } from './api-deiak-erreserbak';
import { ErreserbaAdmin, ErreserbaEgoera } from './erreserbak-interface';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  imports: [CommonModule, FormsModule, AgGridAngular],
  selector: 'app-erreserbak-component',
  styleUrl: './erreserbak-component.css',
  templateUrl: './erreserbak-component.html',
})
export class ErreserbakComponent implements OnInit {
  private readonly api = inject(ApiDeiakErreserbak);

  readonly erreserbak = signal<ErreserbaAdmin[]>([]);
  readonly kargatzen = signal(true);
  readonly taulaErrorea = signal<string | null>(null);

  readonly filterErabiltzaile = signal<number | null>(null);
  readonly filterKargagune = signal<number | null>(null);
  readonly filterPowerbank = signal<number | null>(null);
  readonly filterEgoera = signal<ErreserbaEgoera | ''>('');
  readonly filterDataHasiera = signal('');
  readonly filterDataBukaera = signal('');

  readonly egoeraAukerak: { value: ErreserbaEgoera; label: string }[] = [
    { value: 'aktiboa', label: 'Aktiboa' },
    { value: 'amaituta', label: 'Amaituta' },
    { value: 'ezeztatuta', label: 'Ezeztatuta' },
  ];

  readonly erabiltzaileAukerak = computed(() => {
    const map = new Map<
      number,
      { id_erab: number; izena: string; abizenak: string; email: string }
    >();

    for (const erreserba of this.erreserbak()) {
      map.set(erreserba.id_erab, {
        id_erab: erreserba.id_erab,
        izena: erreserba.erabiltzaile_izena,
        abizenak: erreserba.erabiltzaile_abizenak,
        email: erreserba.erabiltzaile_email,
      });
    }

    return [...map.values()].sort((a, b) =>
      `${a.izena} ${a.abizenak}`.localeCompare(`${b.izena} ${b.abizenak}`),
    );
  });

  readonly kargaguneAukerak = computed(() => {
    const map = new Map<number, { id_takilla: number; izena: string }>();

    for (const erreserba of this.erreserbak()) {
      map.set(erreserba.id_hasiera_takilla, {
        id_takilla: erreserba.id_hasiera_takilla,
        izena: erreserba.kargagune_izena,
      });
    }

    return [...map.values()].sort((a, b) => a.izena.localeCompare(b.izena));
  });

  readonly powerbankAukerak = computed(() => {
    const map = new Map<number, { id_power: number; karga: number }>();

    for (const erreserba of this.erreserbak()) {
      map.set(erreserba.id_power, {
        id_power: erreserba.id_power,
        karga: erreserba.powerbank_karga,
      });
    }

    return [...map.values()].sort((a, b) => a.id_power - b.id_power);
  });

  readonly filteredErreserbak = computed(() => {
    const erabiltzailea = this.filterErabiltzaile();
    const kargagunea = this.filterKargagune();
    const powerbank = this.filterPowerbank();
    const egoera = this.filterEgoera();
    const hasiera = this.filterDataHasiera();
    const bukaera = this.filterDataBukaera();

    return this.erreserbak().filter((erreserba) => {
      if (erabiltzailea !== null && erreserba.id_erab !== erabiltzailea) {
        return false;
      }

      if (kargagunea !== null && erreserba.id_hasiera_takilla !== kargagunea) {
        return false;
      }

      if (powerbank !== null && erreserba.id_power !== powerbank) {
        return false;
      }

      if (egoera !== '' && erreserba.egoera !== egoera) {
        return false;
      }

      const data = this.dataLokala(erreserba.erreserba_hasiera);
      if (hasiera && data < hasiera) {
        return false;
      }

      if (bukaera && data > bukaera) {
        return false;
      }

      return true;
    });
  });

  readonly iragazkiakAktibo = computed(
    () =>
      this.filterErabiltzaile() !== null ||
      this.filterKargagune() !== null ||
      this.filterPowerbank() !== null ||
      this.filterEgoera() !== '' ||
      this.filterDataHasiera() !== '' ||
      this.filterDataBukaera() !== '',
  );

  readonly egoeraAldatzekoa = signal<ErreserbaAdmin | null>(null);
  readonly egoeraBerria = signal<ErreserbaEgoera>('aktiboa');
  readonly egoeraGordetzen = signal(false);
  readonly egoeraErrorea = signal<string | null>(null);

  readonly ezeztatzekoa = signal<ErreserbaAdmin | null>(null);
  readonly ezeztatzen = signal(false);
  readonly ezeztatzeErrorea = signal<string | null>(null);

  readonly defaultColDef: ColDef = {
    flex: 1,
    filter: true,
    sortable: true,
    resizable: true,
  };
  readonly pagination = true;
  readonly paginationPageSize = 10;
  readonly paginationPageSizeSelector: number[] = [5, 10, 20, 50];

  readonly colDefs: ColDef<ErreserbaAdmin>[] = [
    { field: 'id_erreserba', headerName: 'ID', width: 80, flex: 0 },
    {
      headerName: 'ERABILTZAILEA',
      valueGetter: (params) =>
        `${params.data?.erabiltzaile_izena ?? ''} ${params.data?.erabiltzaile_abizenak ?? ''}`.trim(),
      filter: 'agTextColumnFilter',
    },
    {
      field: 'id_power',
      headerName: 'POWERBANK',
      width: 130,
      flex: 0,
      valueFormatter: (params) =>
        `#${params.value} (${params.data?.powerbank_karga ?? '-'}%)`,
    },
    {
      headerName: 'KARGAGUNEA',
      valueGetter: (params) =>
        params.data
          ? `#${params.data.id_hasiera_takilla} - ${params.data.kargagune_izena}`
          : '',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'erreserba_hasiera',
      headerName: 'HASIERA',
      valueFormatter: (params) => this.formatDate(params.value),
    },
    {
      field: 'erreserba_bukaera',
      headerName: 'BUKAERA',
      valueFormatter: (params) => this.formatDate(params.value),
    },
    {
      field: 'egoera',
      headerName: 'EGOERA',
      width: 140,
      flex: 0,
      valueFormatter: (params) => this.egoeraLabel(params.value),
      cellRenderer: (params: ICellRendererParams<ErreserbaAdmin>) =>
        this.egoeraBadge(params.value as ErreserbaEgoera),
    },
    {
      headerName: 'AKZIOAK',
      width: 130,
      flex: 0,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<ErreserbaAdmin>) => {
        const erreserba = params.data;
        const container = document.createElement('div');
        container.className = 'd-flex gap-1 align-items-center h-100';
        if (!erreserba) {
          return container;
        }

        const egoeraBotoia = this.actionButton(
          'btn-primary',
          'bi-arrow-repeat',
          'Egoera aldatu',
          () => this.irekiEgoera(erreserba),
        );

        const ezeztatuBotoia = this.actionButton(
          'btn-danger',
          'bi-x-circle',
          'Erreserba ezeztatu',
          () => this.ezeztatuEskatu(erreserba),
        );
        ezeztatuBotoia.disabled = erreserba.egoera !== 'aktiboa';
        if (erreserba.egoera !== 'aktiboa') {
          ezeztatuBotoia.title = 'Soilik erreserba aktiboak ezeztatu daitezke';
        }

        container.append(egoeraBotoia, ezeztatuBotoia);
        return container;
      },
    },
  ];

  ngOnInit(): void {
    this.kargatuErreserbak();
  }

  kargatuErreserbak(): void {
    this.kargatzen.set(true);
    this.taulaErrorea.set(null);

    this.api.getErreserbak().subscribe({
      next: (erreserbak) => {
        this.erreserbak.set(erreserbak);
        this.kargatzen.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea erreserbak kargatzean:', error);
        this.taulaErrorea.set(
          this.errorMezua(error, 'Ezin izan dira erreserbak kargatu.'),
        );
        this.kargatzen.set(false);
      },
    });
  }

  garbituIragazkiak(): void {
    this.filterErabiltzaile.set(null);
    this.filterKargagune.set(null);
    this.filterPowerbank.set(null);
    this.filterEgoera.set('');
    this.filterDataHasiera.set('');
    this.filterDataBukaera.set('');
  }

  irekiEgoera(erreserba: ErreserbaAdmin): void {
    this.egoeraAldatzekoa.set(erreserba);
    this.egoeraBerria.set(erreserba.egoera);
    this.egoeraErrorea.set(null);
  }

  itxiEgoera(): void {
    if (this.egoeraGordetzen()) {
      return;
    }
    this.egoeraAldatzekoa.set(null);
    this.egoeraErrorea.set(null);
  }

  gordeEgoera(): void {
    const erreserba = this.egoeraAldatzekoa();
    if (!erreserba || this.egoeraGordetzen()) {
      return;
    }

    const egoera = this.egoeraBerria();
    if (egoera === erreserba.egoera) {
      this.itxiEgoera();
      return;
    }

    this.egoeraGordetzen.set(true);
    this.egoeraErrorea.set(null);

    this.api.aldatuEgoera(erreserba.id_erreserba, egoera).subscribe({
      next: (updated) => {
        this.erreserbak.update((rows) =>
          rows.map((row) =>
            row.id_erreserba === erreserba.id_erreserba
              ? { ...row, egoera: updated.egoera as ErreserbaEgoera }
              : row,
          ),
        );
        this.egoeraGordetzen.set(false);
        this.egoeraAldatzekoa.set(null);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea erreserbaren egoera aldatzean:', error);
        this.egoeraErrorea.set(
          this.errorMezua(error, 'Ezin izan da erreserbaren egoera aldatu.'),
        );
        this.egoeraGordetzen.set(false);
      },
    });
  }

  ezeztatuEskatu(erreserba: ErreserbaAdmin): void {
    if (erreserba.egoera !== 'aktiboa') {
      return;
    }
    this.ezeztatzekoa.set(erreserba);
    this.ezeztatzeErrorea.set(null);
  }

  itxiEzeztatzea(): void {
    if (this.ezeztatzen()) {
      return;
    }
    this.ezeztatzekoa.set(null);
    this.ezeztatzeErrorea.set(null);
  }

  berretsiEzeztatzea(): void {
    const erreserba = this.ezeztatzekoa();
    if (!erreserba || this.ezeztatzen()) {
      return;
    }

    this.ezeztatzen.set(true);
    this.ezeztatzeErrorea.set(null);

    this.api.ezeztatu(erreserba.id_erreserba).subscribe({
      next: (updated) => {
        this.erreserbak.update((rows) =>
          rows.map((row) =>
            row.id_erreserba === erreserba.id_erreserba
              ? { ...row, egoera: updated.egoera as ErreserbaEgoera }
              : row,
          ),
        );
        this.ezeztatzen.set(false);
        this.ezeztatzekoa.set(null);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Errorea erreserba ezeztatzean:', error);
        this.ezeztatzeErrorea.set(
          this.errorMezua(error, 'Ezin izan da erreserba ezeztatu.'),
        );
        this.ezeztatzen.set(false);
      },
    });
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    const data = new Date(value);
    if (Number.isNaN(data.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('eu-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data);
  }

  private dataLokala(value: string): string {
    const data = new Date(value);
    if (Number.isNaN(data.getTime())) {
      return value.slice(0, 10);
    }

    const urtea = data.getFullYear();
    const hilabetea = String(data.getMonth() + 1).padStart(2, '0');
    const eguna = String(data.getDate()).padStart(2, '0');
    return `${urtea}-${hilabetea}-${eguna}`;
  }

  private egoeraLabel(egoera: string): string {
    return (
      this.egoeraAukerak.find((option) => option.value === egoera)?.label ??
      egoera
    );
  }

  private egoeraBadge(egoera: ErreserbaEgoera): HTMLElement {
    const badge = document.createElement('span');
    badge.className = `badge rounded-pill px-2 py-1 ${this.egoeraBadgeClass(egoera)}`;
    badge.innerHTML = `<i class="bi ${this.egoeraIcon(egoera)} me-1"></i>${this.egoeraLabel(egoera)}`;
    return badge;
  }

  private egoeraBadgeClass(egoera: ErreserbaEgoera): string {
    switch (egoera) {
      case 'aktiboa':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'amaituta':
        return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      case 'ezeztatuta':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:
        return 'bg-info-subtle text-info border border-info-subtle';
    }
  }

  private egoeraIcon(egoera: ErreserbaEgoera): string {
    switch (egoera) {
      case 'aktiboa':
        return 'bi-check-circle-fill';
      case 'amaituta':
        return 'bi-clock-history';
      case 'ezeztatuta':
        return 'bi-x-circle-fill';
      default:
        return 'bi-info-circle';
    }
  }

  private actionButton(
    color: string,
    icon: string,
    title: string,
    action: () => void,
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

  private errorMezua(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.detail === 'string'
      ? error.error.detail
      : fallback;
  }
}
