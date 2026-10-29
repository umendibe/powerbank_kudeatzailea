from pydantic import BaseModel, Field
from datetime import datetime

# ERABILTZAILEEN ESKEMAK
class CreateErabiltzaile(BaseModel):
    nan: str = Field(min_length=9, max_length=9)
    izena: str = Field(min_length=2)
    abizenak: str = Field(min_length=2)
    email: str = Field(max_length=200)
    pasahitza: str = Field(min_length=6)
    helbidea: str = Field(min_length=5)
    id_rol: int = Field(ge=1, le=2)

class ErabiltzaileResponse(BaseModel):
    id_erab: int
    nan: str
    izena: str
    abizenak: str
    email: str
    helbidea: str
    id_rol: int

    class Config:
        from_attributes = True
        orm_mode = True

# ERRESERBEN ESKEMAK
class ErreserbaCreate(BaseModel):
    id_power: int
    erreserba_hasiera: datetime
    erreserba_bukaera: datetime
    id_hasiera_takilla: int
    id_hasiera_postua: int

class ErreserbaResponse(BaseModel):
    id_erreserba: int
    id_erab: int
    id_power: int
    erreserba_hasiera: datetime
    erreserba_bukaera: datetime
    id_hasiera_takilla: int
    id_hasiera_postua: int
    egoera: str

    class Config:
        from_attributes = True
        orm_mode = True