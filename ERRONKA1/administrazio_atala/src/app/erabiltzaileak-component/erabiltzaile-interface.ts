export interface ErabiltzaileResponse {
  id_erab: number;
  nan: string;
  izena: string;
  abizenak: string;
  email: string;
  helbidea: string;
  id_rol: number;
  id_udalerria: number | null;
  udalerria_izena: string | null;
  activo: boolean;
}

export interface ErabiltzaileEdit {
  nan: string;
  izena: string;
  abizenak: string;
  email: string;
  helbidea: string;
  id_rol: number;
  id_udalerria: number | null;
  activo: boolean;
}

export interface ErabiltzaileCreate {
  nan: string;
  izena: string;
  abizenak: string;
  email: string;
  pasahitza: string;
  helbidea: string;
  id_rol: number;
  id_udalerria: number | null;
  activo: boolean;
}

export interface PatchErabiltzaile {
  activo: boolean;
}

export interface UdalerriaOption {
  id_udalerria: number;
  izena: string;
  activo: boolean;
  kargagune_kopurua: number;
}

export interface ListErreserbak {
  id_erreserba: number;
  id_erab: number;
  id_power: number;
  erreserba_hasiera: string;
  erreserba_bukaera: string;
  erabilera_hasiera: string;
  erabilera_bukaera: string;
  id_hasiera_takilla: number;
  id_bukaera_takilla: number;
  id_hasiera_postua: number;
  id_bukaera_postua: number;
  egoera: string;
}
