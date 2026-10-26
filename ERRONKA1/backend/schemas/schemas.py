from pydantic import BaseModel

class ListErabiltzaileak(BaseModel):
    id: int
    nan: str
    izena: str
    abizenak: str
    email: str
    pasahitza: str
    helbidea: str
    id_rol: int