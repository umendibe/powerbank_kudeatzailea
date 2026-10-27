import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { 
  ColDef, 
  ModuleRegistry, 
  AllCommunityModule, 
  GridReadyEvent,
  SelectionChangedEvent
} from 'ag-grid-community';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

// Register AG Grid modules once
ModuleRegistry.registerModules([AllCommunityModule]);

interface UserRow {
  id_erab: number;
  nan: string;
  izena: string;
  abizenak: string;
  email: string;
  pasahitza: string;
  helbidea: string;
  rol: number;
}

@Component({
  selector: 'app-erabiltzaileak-component',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './erabiltzaileak-component.html',
  styleUrl: './erabiltzaileak-component.css'
})
export class ErabiltzaileakComponent implements OnInit {
  
  constructor(private http: HttpClient) { }
  
  datuak = signal<UserRow[]>([]);

  ngOnInit(): void {
    this.lortuInfo();
  }

  // getInfo(): Observable<any> {
  //   const url = `http://localhost:8000/powerbanks`;
  //   return this.http.get<any[]>(url).pipe(
  //     map((res: any[])=> {
  //       return res.map((row: any[]) => ({
  //         id_erab: row[0],
  //         nan: row[1],
  //         izena: row[2],
  //         abizenak: row[3],
  //         email: row[4],
  //         pasahitza: row[5],
  //         helbidea: row[6],
  //         rol: row[7]
  //       }))
  //     })
  //   );
  // }

  getInfo(): Observable<any> {
    const url = `http://localhost:8000/powerbanks/erabiltzaileak`;
    return this.http.get(url);
  }


  lortuInfo(): void {
    this.getInfo().subscribe ({
      next: (res: UserRow[]) => {
        this.datuak.set(res);
      },
      error: (err) => {
        console.error('Errorea erabiltzaileak kargatzean:', err);
      }
    })
  }


  colDefs: ColDef<UserRow>[] = [
    { field: 'id_erab', headerName: 'ID', width: 90, flex: 0 },
    { field: 'nan', headerName: 'NAN', filter: 'agTextColumnFilter' },
    { field: 'izena', headerName: 'IZENA' },
    { field: 'abizenak', headerName: 'ABIZENAK' },
    { field: 'email', headerName: 'EMAIL' },
    { field: 'pasahitza', headerName: 'PASAHITZA' },
    { field: 'helbidea', headerName: 'HELBIDEA' },
    { field: 'rol', headerName: 'ROL ID' }
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

  onGridReady(params: GridReadyEvent): void {
    console.log('AG Grid is ready');
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    const selectedRows = event.api.getSelectedRows();
    console.log('Selected rows:', selectedRows);
  }
}