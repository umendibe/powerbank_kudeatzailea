from typing import Annotated

from database import database
from fastapi import APIRouter, Depends, HTTPException, status
from models import models
from schemas import schemas
from services import services
from sqlalchemy import select
from sqlalchemy.orm import Session

DbSession = Annotated[Session, Depends(database.get_session)]


powerbank_router = APIRouter(prefix="/powerbanks", tags=["POWERBANKS"])


@powerbank_router.get("/erabiltzaileak", status_code=200, response_model=list[schemas.ListErabiltzaileak])
def get_all_participants(session: DbSession):
    return services.get_all_erabiltzaileak(session)

@powerbank_router.get("/erabiltzaileak/{id}", status_code=200, response_model=schemas.ListErabiltzaileak)
def get_by_id(id: int, session: DbSession):
    return services.get_erabiltzaile_id(id, session)

@powerbank_router.post("/erabiltzaileak/post", status_code=201, response_model=schemas.CreateErabiltzaile)
def create_erabiltzaile(session: DbSession, erabiltzaile: schemas.CreateErabiltzaile):
    return services.post_erabiltzaile(session, erabiltzaile)


@powerbank_router.get("/", response_model=list[schemas.ErreserbaResponse])
def read_powerbanks(session: DbSession):
    return services.list_erreserbak(session)


###TODO, HAU ALDATU EGIN BEHAR DA MIKELEK ESKATU DUEN MODUAN EGITEKO
@powerbank_router.post("/", response_model=schemas.ErreserbaResponse, status_code=status.HTTP_201_CREATED)
def create_powerbank_reservation(erreserba: schemas.ErreserbaCreate, db: DbSession):
    if erreserba.erreserba_hasiera >= erreserba.erreserba_bukaera:
        raise HTTPException(status_code=400, detail="Hasiera data ezin da amaiera data edo geroagokoa izan.")

    if erreserba.erreserba_hasiera.replace(tzinfo=None) < __import__("datetime").datetime.now():
        raise HTTPException(status_code=400, detail="Ezin da iraganeko datarako erreserbarik egin.")

    postua = db.query(models.Postuak).filter(models.Postuak.id_postu == erreserba.id_hasiera_postua).first()
    if not postua or postua.egoera  ==   'zerbitzuz kanpo':
        raise HTTPException(status_code=400, detail="Postu  hau ez dago erabilgarri.")

    overlap = db.query(models.Erreserbak).filter(
        models.Erreserbak.id_hasiera_postua == erreserba.id_hasiera_postua,
        models.Erreserbak.egoera == 'aktiboa',
        models.Erreserbak.erreserba_hasiera < erreserba.erreserba_bukaera,
        models.Erreserbak.erreserba_bukaera > erreserba.erreserba_hasiera,
    ).first()
    if overlap:
        raise HTTPException(status_code=409, detail="Karga - postu honek erreserba bat du tarte horretan.")

    nova = models.Erreserbak(
        id_erab=1,
        id_power=erreserba.id_power,
        erreserba_hasiera=erreserba.erreserba_hasiera,
        erreserba_bukaera=erreserba.erreserba_bukaera,
        id_hasiera_takilla=erreserba.id_hasiera_takilla,
        id_hasiera_postua=erreserba.id_hasiera_postua,
        egoera  = 'aktiboa',
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova




