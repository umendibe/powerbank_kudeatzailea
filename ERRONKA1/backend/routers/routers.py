<<<<<<< HEAD
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import database
from schemas import schemas
from services import services

powerbank_router = APIRouter(prefix="/powerbanks", tags=["POWERBANKS"])

DbSession = Annotated[Session, Depends(database.get_session)]

@powerbank_router.get("/erabiltzaileak", status_code=200, response_model=list[schemas.ListErabiltzaileak])
def get_all_participants(session: DbSession):
    return services.get_all_erabiltzaileak(session)

@powerbank_router.get("/erabiltzaileak/{id}", status_code=200, response_model=schemas.ListErabiltzaileak)
def get_by_id(id: int, session: DbSession):
    return services.get_erabiltzaile_id(id, session)

@powerbank_router.post("/erabiltzaileak/post", status_code=201, response_model=schemas.CreateErabiltzaile)
def create_erabiltzaile(session: DbSession, erabiltzaile: schemas.CreateErabiltzaile):
    return services.post_erabiltzaile(session, erabiltzaile)
=======
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.models import Erreserbak, Postuak
from schemas.schemas import ErreserbaCreate, ErreserbaResponse

powerbank_router = APIRouter(prefix="/powerbanks", tags=["POWERBANKS"])


@powerbank_router.get("/", response_model=list[ErreserbaResponse])
def read_powerbanks(db: Session = Depends(get_db)):
    reservations = db.query(Erreserbak).all()
    return reservations


@powerbank_router.post("/", response_model=ErreserbaResponse, status_code=status.HTTP_201_CREATED)
def create_powerbank_reservation(erreserba: ErreserbaCreate, db: Session = Depends(get_db)):
    if erreserba.erreserba_hasiera >= erreserba.erreserba_bukaera:
        raise HTTPException(status_code=400, detail="Hasiera data ezin da amaiera data edo geroagokoa izan.")

    if erreserba.erreserba_hasiera.replace(tzinfo=None) < __import__("datetime").datetime.now():
        raise HTTPException(status_code=400, detail="Ezin da iraganeko datarako erreserbarik egin.")

    postua = db.query(Postuak).filter(Postuak.id_postu == erreserba.id_hasiera_postua).first()
    if not postua or postua.egoera  ==   'zerbitzuz kanpo':
        raise HTTPException(status_code=400, detail="Postu  hau ez dago erabilgarri.")

    overlap = db.query(Erreserbak).filter(
        Erreserbak.id_hasiera_postua == erreserba.id_hasiera_postua,
        Erreserbak.egoera == 'aktiboa',
        Erreserbak.erreserba_hasiera < erreserba.erreserba_bukaera,
        Erreserbak.erreserba_bukaera > erreserba.erreserba_hasiera,
    ).first()
    if overlap:
        raise HTTPException(status_code=409, detail="Karga - postu honek erreserba bat du tarte horretan.")

    nova = Erreserbak(
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
>>>>>>> master
