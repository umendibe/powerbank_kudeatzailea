export type TakillaEgoera = 'erabilgarri' | 'mantentze_lanetan' | 'zerbitzuz_kanpo';

export interface TakillaResponse {
  id_takilla: number;
  izena: string;
  helbidea: string;
  deskribapena: string | null;
  latitude: number | null;
  longitude: number | null;
  id_udalerria: number;
  udalerria_izena: string | null;
  egoera: TakillaEgoera;
}

export interface TakillaCreate {
  izena: string;
  helbidea: string;
  deskribapena: string | null;
  latitude: number | null;
  longitude: number | null;
  id_udalerria: number;
  egoera: TakillaEgoera;
}

export interface UdalerriaResponse {
  id_udalerria: number;
  izena: string;
  activo: boolean;
  kargagune_kopurua: number;
}

export interface PostuResponse {
  id_postu: number;
  id_takilla: number;
  egoera: 'hutsa' | 'kargatuta' | 'kargatzen';
}
