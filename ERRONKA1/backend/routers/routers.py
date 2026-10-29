from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from database.database import get_db
from schemas import schemas
from services import services

# Erabiltzaileen bideratzailea
erabiltzaile_router = APIRouter(prefix="/alokaziosistema/erabiltzaileak", tags=["Erabiltzaileak"])

@erabiltzaile_router.get("/", response_model=list[schemas.ErabiltzaileResponse])
def read_erabiltzaileak(db: Session = Depends(get_db)):
    return services.get_erabiltzaileak(db)

@erabiltzaile_router.get("/{erab_id}", response_model=schemas.ErabiltzaileResponse)
def read_erabiltzaile_by_id(erab_id: int, db: Session = Depends(get_db)):
    return services.get_erabiltzaile_by_id(db, erab_id)

@erabiltzaile_router.post("/post", response_model=schemas.ErabiltzaileResponse, status_code=status.HTTP_201_CREATED)
def create_erabiltzaile(erabiltzaile: schemas.CreateErabiltzaile, db: Session = Depends(get_db)):
    return services.post_erabiltzaile(db, erabiltzaile)

# Erreserben bideratzailea
erreserbak_router = APIRouter(prefix="/alokaziosistema/erreserbak", tags=["Erreserbak"])

@erreserbak_router.post("/", response_model=schemas.ErreserbaResponse, status_code=status.HTTP_201_CREATED)
def create_erreserba(erreserba: schemas.ErreserbaCreate, id_erabiltzaile_aktiboa: int, db: Session = Depends(get_db)):
    return services.sortu_erreserba_logika(db, erreserba, id_erabiltzaile_aktiboa)