export type TakillaEgoera = 'erabilgarri' | 'mantentze_lanetan' | 'zerbitzuz_kanpo';

export interface TakillaResponse {
  id_takilla: number;
  izena: string;
  helbidea: string;
  egoera: TakillaEgoera;
}

export interface TakillaCreate {
  izena: string;
  helbidea: string;
  egoera: TakillaEgoera;
}

export interface PostuResponse {
  id_postu: number;
  id_takilla: number;
  egoera: 'hutsa' | 'kargatuta' | 'kargatzen';
}