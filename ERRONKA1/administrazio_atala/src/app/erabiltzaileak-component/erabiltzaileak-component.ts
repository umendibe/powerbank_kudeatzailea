import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  GridReadyEvent,
  SelectionChangedEvent
} from 'ag-grid-community';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiDeiak } from './api-deiak';
import { ErabiltzaileCreate, ErabiltzaileEdit, ErabiltzaileResponse, ListErreserbak, PatchErabiltzaile } from './erabiltzaile-interface';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-erabiltzaileak-component',
  standalone: true,
  imports: [CommonModule, AgGridAngular, FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatTableModule],
  templateUrl: './erabiltzaileak-component.html',
  styleUrl: './erabiltzaileak-component.css'
})
export class ErabiltzaileakComponent implements OnInit {
  private apiService = inject(ApiDeiak);
  private cdr = inject(ChangeDetectorRef);

  errepikatuPasahitza = '';
  newUser: ErabiltzaileCreate = this.emptyUser();
  editingUserId = signal<number | null>(null);

  gordetzen = signal(false);
  gordetzeErrorea = signal<string | null>(null);
  erabiltzaileBakarra = signal<ErabiltzaileResponse | null>(null);
  erabiltzaileak = signal<ErabiltzaileResponse[]>([]);
  erreserbak = signal<ListErreserbak[]>([]);
  formulario = signal<boolean>(false);
  erreserbaTaula = signal<boolean>(false);

  displayedColumns: string[] = ['id_erreserba', 'id_erab', 'id_power', 'erreserba_hasiera', 'erreserba_bukaera', 'erabilera_hasiera', 'erabilera_bukaera', 'id_hasiera_takilla', 'id_bukaera_takilla', 'id_hasiera_postua', 'id_bukaera_postua', 'egoera'];
  dataSource: ListErreserbak[] = [];

  ngOnInit(): void {
    this.lortuInfoErabiltzaileak();
  }

  onEditUser(erabiltzaile: ErabiltzaileResponse): void {
    this.editingUserId.set(erabiltzaile.id_erab);
    this.newUser = {
      nan: erabiltzaile.nan,
      izena: erabiltzaile.izena,
      abizenak: erabiltzaile.abizenak,
      email: erabiltzaile.email,
      pasahitza: '', // No requerida al editar
      helbidea: erabiltzaile.helbidea,
      id_rol: erabiltzaile.id_rol,
      activo: erabiltzaile.activo
    };
    this.errepikatuPasahitza = '';
    this.gordetzeErrorea.set(null);
    this.formulario.set(true);
  }

  onSubmit(): void {
    if (this.gordetzen()) return;

    const erab_id = this.editingUserId();

    if (!erab_id) {
      if (!this.newUser.pasahitza) {
        this.gordetzeErrorea.set('Pasahitza ezin da hutsik egon.');
        return;
      }
      if (this.newUser.pasahitza !== this.errepikatuPasahitza) {
        this.gordetzeErrorea.set('Pasahitzak ez datoz bat.');
        return;
      }
    }

    this.gordetzen.set(true);
    this.gordetzeErrorea.set(null);

    if (erab_id !== null) {
      const editData: ErabiltzaileEdit = {
        nan: this.newUser.nan,
        izena: this.newUser.izena,
        abizenak: this.newUser.abizenak,
        email: this.newUser.email,
        helbidea: this.newUser.helbidea,
        id_rol: this.newUser.id_rol,
        activo: this.newUser.activo
      };

      this.apiService.editatuErabiltzaileak(erab_id, editData).subscribe({
        next: (res: ErabiltzaileResponse) => {
          this.erabiltzaileak.update(zerrenda =>
            zerrenda.map(item => item.id_erab === res.id_erab ? res : item)
          );
          this.gordetzen.set(false);
          this.closeForm();
        },
        error: (err) => console.log(err)
      });
    } else {
      this.apiService.gordeErabiltzailea(this.newUser).subscribe({
        next: (res: ErabiltzaileResponse) => {
          this.erabiltzaileak.update(list => [...list, res]);
          this.gordetzen.set(false);
          this.closeForm();
        },
        error: (err) => console.log(err)
      });
    }
  }

  listErreserbakUser(id_erab: number): void {
    this.apiService.erreserbakListatu(id_erab).subscribe({
      next: (res: ListErreserbak[]) => {
        this.erreserbak.set(res);
        this.dataSource = res;
        this.erreserbaTaula.set(true);
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Errorea erreserbak kargatzean: ", err)
    });
  }

  onEgoeraAldatu(erabiltzaile: ErabiltzaileResponse): void {
    const aldatutakoDatuak: PatchErabiltzaile = { activo: !erabiltzaile.activo };

    this.apiService.erabiltzaileEgoera(erabiltzaile.id_erab, aldatutakoDatuak).subscribe({
      next: (res: ErabiltzaileResponse) => {
        this.erabiltzaileak.update(zerrenda =>
          zerrenda.map(item => item.id_erab === res.id_erab ? res : item)
        );
      },
      error: (err) => console.error('Errorea erabiltzailearen egoera aldatzean:', err)
    });
  }

  lortuInfoErabiltzaileak(): void {
    this.apiService.getInfoErabiltzaileak().subscribe({
      next: (res: ErabiltzaileResponse[]) => this.erabiltzaileak.set(res),
      error: (err) => console.error('Errorea erabiltzaileak kargatzean:', err)
    });
  }

  onDeleteUser(erabiltzaile: ErabiltzaileResponse): void {
    if (confirm(`${erabiltzaile.izena} ezabatu nahi duzu?`)) {
      this.apiService.ezabatuErabiltzailea(erabiltzaile.id_erab).subscribe({
        next: () => {
          this.erabiltzaileak.update(zerrenda =>
            zerrenda.filter(item => item.id_erab !== erabiltzaile.id_erab)
          );
        },
        error: (err) => console.error('Errorea erabiltzailea ezabatzean:', err)
      });
    }
  }

  openForm(): void {
    this.editingUserId.set(null);
    this.newUser = this.emptyUser();
    this.errepikatuPasahitza = '';
    this.gordetzeErrorea.set(null);
    this.formulario.set(true);
  }

  closeForm(): void {
    this.formulario.set(false);
    this.editingUserId.set(null);
  }

  private emptyUser(): ErabiltzaileCreate {
    return {
      nan: '',
      izena: '',
      abizenak: '',
      email: '',
      pasahitza: '',
      helbidea: '',
      id_rol: 2,
      activo: true
    };
  }

  colDefs: ColDef<ErabiltzaileResponse>[] = [
    { field: 'id_erab', headerName: 'ID', width: 90, flex: 0 },
    { field: 'nan', headerName: 'NAN', filter: 'agTextColumnFilter' },
    { field: 'izena', headerName: 'IZENA' },
    { field: 'abizenak', headerName: 'ABIZENAK' },
    { field: 'email', headerName: 'EMAIL' },
    { field: 'pasahitza', headerName: 'PASAHITZA' },
    { field: 'helbidea', headerName: 'HELBIDEA' },
    { field: 'id_rol', headerName: 'ROL ID' },
    { field: 'activo', headerName: 'AKTIBO' },
    {
      headerName: 'Akzioak',
      field: 'id_erab',
      width: 200,
      flex: 0,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.className = 'd-flex gap-2 align-items-center h-100';

        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn btn-success btn-sm';
        btnEdit.innerHTML = '<i class="bi bi-pencil"></i>';
        btnEdit.addEventListener('click', () => this.onEditUser(params.data));

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn btn-danger btn-sm';
        btnDelete.innerHTML = '<i class="bi bi-trash"></i>';
        btnDelete.addEventListener('click', () => this.onDeleteUser(params.data));

        const btnDesaktibatu = document.createElement('button');
        btnDesaktibatu.className = 'btn btn-warning btn-sm';
        btnDesaktibatu.innerHTML = '<i class="bi bi-x-circle"></i>';
        btnDesaktibatu.addEventListener('click', () => this.onEgoeraAldatu(params.data));

        const btnErreserba = document.createElement('button');
        btnErreserba.className = 'btn btn-primary btn-sm';
        btnErreserba.innerHTML = '<i class="bi bi-list"></i>';
        btnErreserba.addEventListener('click', () => this.listErreserbakUser(params.data.id_erab));

        container.appendChild(btnEdit);
        container.appendChild(btnDelete);
        container.appendChild(btnDesaktibatu);
        container.appendChild(btnErreserba);

        return container;
      }
    }
  ];

  defaultColDef: ColDef = {
    flex: 1,
    filter: true,
    sortable: true,
    resizable: true
  };

  pagination = true;
  paginationPageSize = 5;
  paginationPageSizeSelector: number[] | boolean = [5, 10, 20];
}