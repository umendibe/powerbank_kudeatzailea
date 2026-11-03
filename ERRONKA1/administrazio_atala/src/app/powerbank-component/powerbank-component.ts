import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiDeiakPowerbanks } from './api-deiak-powerbanks';
import { PowerbankResponse, PowerbankCreate, PowerbankEdit, PostuDisponible } from './powerbanks-interface';

@Component({
  imports: [CommonModule, AgGridAngular, FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatTableModule],
  selector: 'app-powerbank-component',
  styleUrl: './powerbank-component.css',
  templateUrl: './powerbank-component.html',
})
export class PowerbankComponent implements OnInit {

  private apiService = inject(ApiDeiakPowerbanks)

  powerbanks = signal<PowerbankResponse[]>([]);
  postuakErabilgarriak = signal<PostuDisponible[]>([]);
  newPower: PowerbankCreate = this.emptyPower();
  editingPowerId = signal<number | null>(null);
  formulario = signal<boolean>(false);
  gordetzeErrorea = signal<string | null>(null);
  gordetzen = signal(false);
  powerbankEzabatzeko = signal<PowerbankResponse | null>(null);
  powerbankEzabatzen = signal(false);
  ezabatzekoErrorea = signal<string | null>(null);


  private emptyPower(): PowerbankCreate {
      return {
        id_postu: 0,
        id_takilla: 0,
        karga: 100
      };
    }

  ngOnInit() {
    this.lortuInfoPowerbanks();
    this.lortuPostuakErabilgarriak();
  }

  lortuInfoPowerbanks(): void {
    this.apiService.getInfoPowerbanks().subscribe({
      next: (res: PowerbankResponse[]) => {
        this.powerbanks.set(res)
      },
      error: (err) => console.error('Errorea powerbank-ak kargatzean:', err)
    });
  }

  lortuPostuakErabilgarriak(): void {
    this.apiService.getPostuakErabilgarriak().subscribe({
      next: (res) => this.postuakErabilgarriak.set(res),
      error: (err) => console.error('Errorea postu erabilgarriak kargatzean:', err)
    });
  }

  takillakErabilgarriak(): number[] {
    return [...new Set(this.postuakErabilgarriak().map(postu => postu.id_takilla))];
  }

  postuakTakillan(id_takilla: number): PostuDisponible[] {
    return this.postuakErabilgarriak().filter(postu => postu.id_takilla === id_takilla);
  }

  onTakillaChange(): void {
    this.newPower.id_postu = 0;
  }

  onPositionChange(powerbank: PowerbankResponse): void {
    this.editingPowerId.set(powerbank.id_power);
    this.newPower = {
      id_postu: powerbank.id_postu,
      id_takilla: powerbank.id_takilla,
      karga: powerbank.karga
    };
    this.gordetzeErrorea.set(null);
    this.formulario.set(true);
  }

  openForm(): void {
    this.editingPowerId.set(null);
    this.newPower = this.emptyPower();
    this.gordetzeErrorea.set(null);
    this.formulario.set(true);
  }

  closeForm(): void {
    this.formulario.set(false);
    this.editingPowerId.set(null);
  }

  onDeletePowerbank(powerbank: PowerbankResponse): void {
    this.ezabatzekoErrorea.set(null);
    this.powerbankEzabatzeko.set(powerbank);
  }

  itxiPowerbankEzabaketa(): void {
    if (this.powerbankEzabatzen()) return;
    this.powerbankEzabatzeko.set(null);
    this.ezabatzekoErrorea.set(null);
  }

  berretsiPowerbankEzabaketa(): void {
    const powerbank = this.powerbankEzabatzeko();
    if (!powerbank || this.powerbankEzabatzen()) return;

    this.powerbankEzabatzen.set(true);
    this.ezabatzekoErrorea.set(null);
    this.apiService.ezabatuPowerbank(powerbank.id_power).subscribe({
      next: () => {
        this.powerbanks.update(list =>
          list.filter(item => item.id_power !== powerbank.id_power)
        );
        this.lortuPostuakErabilgarriak();
        this.powerbankEzabatzen.set(false);
        this.powerbankEzabatzeko.set(null);
      },
      error: (err) => {
        console.error('Errorea powerbank-a ezabatzean:', err);
        const detail = err.error?.detail;
        this.ezabatzekoErrorea.set(
          typeof detail === 'string' ? detail : 'Ezin izan da powerbank-a ezabatu.'
        );
        this.powerbankEzabatzen.set(false);
      }
    });
  }

  onSubmit(): void {
      if (this.gordetzen()) return;
  
      const power_id = this.editingPowerId();
  
      if (power_id === null) {
        if (!this.newPower.id_takilla) {
          this.gordetzeErrorea.set('Takilla ezin da hutsik egon.');
          return;
        }
        if (!this.newPower.id_postu) {
          this.gordetzeErrorea.set('Postua ezin da hutsik egon.');
          return;
        }
      }
  
      this.gordetzen.set(true);
      this.gordetzeErrorea.set(null);
  
      if (power_id !== null) {
        const editData: PowerbankEdit = {
          id_postu: this.newPower.id_postu,
          id_takilla: this.newPower.id_takilla
        };
  
        this.apiService.editatuTokia(power_id, editData).subscribe({
          next: (res: PowerbankResponse) => {
            this.powerbanks.update(zerrenda =>
              zerrenda.map(item => item.id_power === res.id_power ? res : item)
            );
            this.lortuPostuakErabilgarriak();
            this.gordetzen.set(false);
            this.closeForm();
          },
          error: (err) => {
            console.error('Errorea powerbankaren tokia aldatzean:', err);
            this.gordetzeErrorea.set('Ezin izan da powerbankaren tokia aldatu.');
            this.gordetzen.set(false);
          }
        });
      } else {
        const createData: PowerbankCreate = {
          id_postu: this.newPower.id_postu,
          id_takilla: this.newPower.id_takilla,
          karga: this.newPower.karga
        };
        this.apiService.gordePowerbank(createData).subscribe({
          next: () => {
            this.lortuInfoPowerbanks();
            this.lortuPostuakErabilgarriak();
            this.gordetzen.set(false);
            this.closeForm();
          },
          error: (err) => {
            console.error('Errorea powerbank-a sortzean:', err);
            const detail = err.error?.detail;
            this.gordetzeErrorea.set(
              typeof detail === 'string' ? detail : 'Ezin izan da powerbank-a sortu.'
            );
            this.gordetzen.set(false);
          }
        });
      }
    }


  colDefs: ColDef<PowerbankResponse>[] = [
      { field: 'id_power', headerName: 'ID', width: 90, flex: 0 },
      { field: 'id_postu', headerName: 'POSTU', filter: 'agTextColumnFilter' },
      { field: 'id_takilla', headerName: 'TAKILLA' },
      { field: 'karga', headerName: 'KARGA' },
      {
        headerName: 'Akzioak',
        field: 'id_power',
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
          btnEdit.addEventListener('click', () => this.onPositionChange(params.data));
          container.appendChild(btnEdit);

          const btnDelete = document.createElement('button');
          btnDelete.className = 'btn btn-danger btn-sm';
          btnDelete.innerHTML = '<i class="bi bi-trash"></i>';
          btnDelete.addEventListener('click', () => this.onDeletePowerbank(params.data));
          container.appendChild(btnDelete);
  
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
