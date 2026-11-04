from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ERABILTZAILEEN ESKEMAK

# Erabiltzailearen Login-a egiteko
class ErabiltzaileLogin(BaseModel):
    email: str
    pasahitza: str
    
class LoginResponse(BaseModel):
    email: str
    id_rol: str


# Administrazio atalerako login-a (rol 1 eta 3)
class AdminLoginResponse(BaseModel):
    id_erab: int
    izena: str
    email: str
    id_rol: int
    id_udalerria: int | None = None
    udalerria_izena: str | None = None
    token: str

    model_config = ConfigDict(from_attributes=True)


# Atal publikoko login-a (erabiltzaile arruntak eta administratzaileak)
class PublicLoginResponse(BaseModel):
    id_erab: int
    nan: str
    izena: str
    abizenak: str
    email: str
    helbidea: str
    id_rol: int
    id_udalerria: int | None = None
    udalerria_izena: str | None = None
    activo: bool
    token: str

    model_config = ConfigDict(from_attributes=True)


# Udalerriak
class CreateUdalerria(BaseModel):
    izena: str = Field(min_length=2, max_length=120)


class PatchUdalerria(BaseModel):
    izena: str | None = Field(default=None, min_length=2, max_length=120)
    activo: bool | None = None


class UdalerriaResponse(BaseModel):
    id_udalerria: int
    izena: str
    activo: bool
    kargagune_kopurua: int = 0

    model_config = ConfigDict(from_attributes=True)


# Erabiltzaileak zerrendatzeko (taula, zerrenda bat...)
class ListErabiltzaileak(BaseModel):
    id_erab: int
    nan: str = Field(min_length=9, max_length=9)
    izena: str = Field(min_length=2)
    abizenak: str = Field(min_length=2)
    email: str = Field(max_length=200)
    helbidea: str = Field(min_length=5)
    id_rol: int = Field(ge=1, le=3)
    id_udalerria: int | None = None
    udalerria_izena: str | None = None
    activo: bool = Field(default=True)

# Erabiltzaile bat sortzeko (datu basean gordetzeko eskema)
class CreateErabiltzaile(BaseModel):
    nan: str = Field(min_length=9, max_length=9)
    izena: str = Field(min_length=2)
    abizenak: str = Field(min_length=2)
    email: str = Field(max_length=200)
    pasahitza: str = Field(min_length=6)
    helbidea: str = Field(min_length=5)
    id_rol: int = Field(ge=1, le=3)
    id_udalerria: int | None = None

class PatchErabiltzaile(BaseModel):
    nan: str | None = Field(default=None, min_length=9, max_length=9)
    izena: str | None = Field(default=None,min_length=2)
    abizenak: str | None = Field(default=None,min_length=2)
    email: str | None = Field(default=None,max_length=200)
    pasahitza: str | None = Field(default=None,min_length=6)
    helbidea: str | None = Field(default=None,min_length=5)
    id_rol: int | None = Field(default=None,ge=1, le=3)
    id_udalerria: int | None = Field(default=None)
    activo: bool | None = Field(default=None)
    
class PatchErabiltzaileEgoera(BaseModel):
    activo: bool


# Atal publikorako erregistroa (rola beti 2 izango da)
class CreateErabiltzailePublico(BaseModel):
    nan: str = Field(min_length=9, max_length=9)
    izena: str = Field(min_length=2)
    abizenak: str = Field(min_length=2)
    email: str = Field(max_length=200)
    pasahitza: str = Field(min_length=6)
    helbidea: str = Field(min_length=5)


# Atal publikoko erabiltzailearen datuak (pasahitzik gabe)
class ErabiltzailePublicoResponse(BaseModel):
    id_erab: int
    nan: str
    izena: str
    abizenak: str
    email: str
    helbidea: str
    id_rol: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)


# Atal publikotik norberaren datuak aldatzeko
class UpdateErabiltzailePublico(BaseModel):
    nan: str | None = Field(default=None, min_length=9, max_length=9)
    izena: str | None = Field(default=None, min_length=2)
    abizenak: str | None = Field(default=None, min_length=2)
    email: str | None = Field(default=None, max_length=200)
    pasahitza: str | None = Field(default=None, min_length=6)
    helbidea: str | None = Field(default=None, min_length=5)

    
# ERRESERBEN ESKEMAK

# Erreserbak listatzeko
class ListErreserbak(BaseModel):
    id_erreserba: int
    id_erab: int
    id_power: int
    erreserba_hasiera: datetime 
    erreserba_bukaera: datetime 
    erabilera_hasiera: datetime | None = None
    erabilera_bukaera: datetime | None = None
    id_hasiera_takilla: int  
    id_bukaera_takilla: int | None = None
    id_hasiera_postua: int 
    id_bukaera_postua: int | None = None
    egoera: str = Field(max_lenght=20)

    
    class Config:
        from_attributes = True


# Administrazio atalean erreserbak erakusteko (erabiltzaile, kargagune eta powerbank datuekin)
class ErreserbaAdminResponse(ListErreserbak):
    erabiltzaile_izena: str
    erabiltzaile_abizenak: str
    erabiltzaile_email: str
    kargagune_izena: str
    id_udalerria: int | None = None
    udalerria_izena: str | None = None
    powerbank_karga: int


# Erreserbaren egoera aldatzeko
class PatchErreserbaEgoera(BaseModel):
    egoera: Literal["aktiboa", "amaituta", "ezeztatuta"]


# Atal publikotik erreserba bat sortzeko
class ErreserbaPublicoCreate(BaseModel):
    id_erab: int
    id_power: int
    erreserba_hasiera: datetime
    erreserba_bukaera: datetime
    id_hasiera_takilla: int
    id_hasiera_postua: int


# Atal publikotik norberaren erreserba ezeztatzeko
class ErreserbaPublicoCancel(BaseModel):
    id_erab: int

    
# Erabiltzaile batek erreserba bat sortzeko (datu basean gordetzeko)
class CreateErreserba(BaseModel):
    id_erab: int
    id_power: int
    erreserba_hasiera: str = Field(min_length=6)
    erreserba_bukaera: str = Field(min_lenght=6)
    erabilera_hasiera: str = Field(min_lenght=6)
    erabilera_bukaera: str = Field(min_lenght=6)
    id_hasiera_takilla: int = Field(min_lenght=6)
    id_bukaera_takilla: int = Field(min_lenght=6)
    id_hasiera_postua: int = Field(min_lenght=6)
    id_bukaera_postua: int = Field(min_lenght=6)
    egoera: str = Field(max_lenght=20)

# POWERBANK-AK

#Powerbank-ak listatzeko (bakoitza non dagoen jakiteko)
class ListPowerbank(BaseModel):
    id_power: int
    id_takilla: int
    id_postu: int
    karga: int = Field(ge=0, le= 100)

    model_config = ConfigDict(from_attributes=True)

class PostuDisponible(BaseModel):
    id_postu: int
    id_takilla: int

    model_config = ConfigDict(from_attributes=True)
    
# Powerbank sortzeko 
class CreatePowerbank(BaseModel):
    id_postu: int
    id_takilla: int
    karga: int = Field(ge=0, le= 100)
    
class PowerbankTokiaPatch(BaseModel):
    id_takilla: int | None = Field(default=None)
    id_postu: int | None = Field(default=None)
    
########################### ERRESERBAK-AK###########################
    


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
    
    
############### KARGAGUNEAK ###############

# Takillak sortu
class CreateTakilla(BaseModel):
    izena: str = Field(min_length=2, max_length=100)
    helbidea: str = Field(min_length=3, max_length=200)
    deskribapena: str | None = Field(default=None, max_length=300)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    id_udalerria: int
    egoera: Literal["erabilgarri", "mantentze_lanetan", "zerbitzuz_kanpo"]
    
class PatchTakilla(BaseModel):
    izena: str | None = Field(default=None, min_length=2, max_length=100)
    helbidea: str | None = Field(default=None,min_length=3, max_length=200)
    deskribapena: str | None = Field(default=None, max_length=300)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    id_udalerria: int | None = None
    egoera: Literal["erabilgarri", "mantentze_lanetan", "zerbitzuz_kanpo"] | None = None
    
class TakillaResponse(BaseModel):
    id_takilla: int
    izena: str = Field(min_length=2, max_length=100)
    helbidea: str = Field(min_length=3, max_length=200)
    deskribapena: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    id_udalerria: int
    udalerria_izena: str | None = None
    egoera: str = Field(max_length=20)

    model_config = ConfigDict(from_attributes=True)


class TakillaIrudiaResponse(BaseModel):
    id_irudi: int
    id_takilla: int
    url: str

    model_config = ConfigDict(from_attributes=True)

class PostuResponse(BaseModel):
    id_postu: int
    id_takilla: int
    egoera: str

    model_config = ConfigDict(from_attributes=True)
