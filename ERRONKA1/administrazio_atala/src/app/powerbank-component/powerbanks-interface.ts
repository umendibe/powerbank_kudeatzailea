export interface PowerbankResponse {
  id_power: number
  id_postu: number
  id_takilla: number
  karga: number
}

export interface PowerbankCreate {
    id_postu: number
    id_takilla: number
    karga: number
}

export interface PostuDisponible {
  id_postu: number
  id_takilla: number
}

export interface PowerbankEdit {
  id_postu: number,
  id_takilla: number
}
