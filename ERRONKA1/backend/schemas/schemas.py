from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ErabiltzaileLogin(BaseModel):
    email: str
    pasahitza: str


class ErreserbaCreate(BaseModel):
    id_power: int
    erreserba_hasiera: datetime
    erreserba_bukaera: datetime
    id_hasiera_takilla: int
    id_hasiera_postua: int


class ErreserbaResponse(ErreserbaCreate):
    id_erreserba: int
    id_erab: int
    egoera: str

    model_config =  ConfigDict(from_attributes=True)