export type ErreserbaEgoera = 'aktiboa' | 'amaituta' | 'ezeztatuta';

export interface ErreserbaAdmin {
  id_erreserba: number;
  id_erab: number;
  erabiltzaile_izena: string;
  erabiltzaile_abizenak: string;
  erabiltzaile_email: string;
  id_power: number;
  powerbank_karga: number;
  erreserba_hasiera: string;
  erreserba_bukaera: string;
  erabilera_hasiera: string | null;
  erabilera_bukaera: string | null;
  id_hasiera_takilla: number;
  id_bukaera_takilla: number | null;
  kargagune_izena: string;
  id_hasiera_postua: number;
  id_bukaera_postua: number | null;
  egoera: ErreserbaEgoera;
}

export interface ErreserbaResponse {
  id_erreserba: number;
  id_erab: number;
  id_power: number;
  erreserba_hasiera: string;
  erreserba_bukaera: string;
  id_hasiera_takilla: number;
  id_hasiera_postua: number;
  egoera: string;
}
