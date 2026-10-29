from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from models.models import Erabiltzaileak, Erreserbak, Postuak
from schemas.schemas import CreateErabiltzaile, ErreserbaCreate
from services.auth import get_password_hash
from datetime import datetime

# ERABILTZAILEEN LOGIKA
def get_erabiltzaileak(db: Session):
    return db.execute(select(Erabiltzaileak)).scalars().all()

def get_erabiltzaile_by_id(db: Session, erab_id: int):
    erabiltzailea = db.execute(select(Erabiltzaileak).where(Erabiltzaileak.id_erab == erab_id)).scalars().first()
    if not erabiltzailea:
        raise HTTPException(status_code=404, detail="Erabiltzailea ez da aurkitu")
    return erabiltzailea

def post_erabiltzaile(db: Session, erabiltzaile_berria: CreateErabiltzaile):
    # Emaila existitzen den konprobatu
    db_email = db.execute(select(Erabiltzaileak).where(Erabiltzaileak.email == erabiltzaile_berria.email)).scalars().first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email hori jada erregistratuta dago.")

    # NAN existitzen den konprobatu
    db_nan = db.execute(select(Erabiltzaileak).where(Erabiltzaileak.nan == erabiltzaile_berria.nan)).scalars().first()
    if db_nan:
        raise HTTPException(status_code=400, detail="NAN hori jada erregistratuta dago.")

    zifratua = get_password_hash(erabiltzaile_berria.pasahitza)

    berria = Erabiltzaileak(
        nan=erabiltzaile_berria.nan,
        izena=erabiltzaile_berria.izena,
        abizenak=erabiltzaile_berria.abizenak,
        email=erabiltzaile_berria.email,
        pasahitza=zifratua,
        helbidea=erabiltzaile_berria.helbidea,
        id_rol=erabiltzaile_berria.id_rol
    )
    
    db.add(berria)
    db.commit()
    db.refresh(berria)
    return berria

# ERRESERBEN LOGIKA
def sortu_erreserba_logika(db: Session, erreserba: ErreserbaCreate, id_erabiltzaile_aktiboa: int):
    if erreserba.erreserba_hasiera >= erreserba.erreserba_bukaera:
        raise HTTPException(status_code=400, detail="Hasiera data ezin da amaiera data edo geroagokoa izan.")
        
    if erreserba.erreserba_hasiera.replace(tzinfo=None) < datetime.now():
        raise HTTPException(status_code=400, detail="Ezin da iraganeko datarako erreserbarik egin.")

    postua = db.execute(select(Postuak).where(Postuak.id_postu == erreserba.id_hasiera_postua)).scalars().first()
    if not postua or postua.egoera == 'zerbitzuz kanpo':
        raise HTTPException(status_code=400, detail="Postu hau ez dago erabilgarri.")

    gainjartzea = db.execute(
        select(Erreserbak).where(
            Erreserbak.id_hasiera_postua == erreserba.id_hasiera_postua,
            Erreserbak.egoera == 'aktiboa',
            Erreserbak.erreserba_hasiera < erreserba.erreserba_bukaera,
            Erreserbak.erreserba_bukaera > erreserba.erreserba_hasiera
        )
    ).scalars().first()

    if gainjartzea:
        raise HTTPException(status_code=409, detail="Karga-postu honek erreserba bat du tarte horretan.")

    nova_erreserba = Erreserbak(
        id_erab=id_erabiltzaile_aktiboa,
        id_power=erreserba.id_power,
        erreserba_hasiera=erreserba.erreserba_hasiera,
        erreserba_bukaera=erreserba.erreserba_bukaera,
        id_hasiera_takilla=erreserba.id_hasiera_takilla,
        id_hasiera_postua=erreserba.id_hasiera_postua,
        egoera='aktiboa'
    )
    
    db.add(nova_erreserba)
    db.commit()
    db.refresh(nova_erreserba)
    return nova_erreserba