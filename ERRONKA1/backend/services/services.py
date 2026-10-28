from fastapi import HTTPException, status
from models import models
from schemas import schemas
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session


def get_all_erabiltzaileak(db: Session):
    try:
        stmt = select(models.Erabiltzaileak).order_by(models.Erabiltzaileak.id_erab)
        return db.scalars(stmt).all()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Errorea erabiltzaileak ekartzen") from e

def get_erabiltzaile_id(id: int, db: Session):
    erabiltzaile = db.get(models.Erabiltzaileak, id,)
    if erabiltzaile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da existitzen")
    return erabiltzaile

def post_erabiltzaile(db: Session, erabiltzaile: schemas.CreateErabiltzaile):
    db_erabiltzaile = models.Erabiltzaileak(**erabiltzaile.model_dump())
    try:
        db.add(db_erabiltzaile)
        db.commit()
        db.refresh(db_erabiltzaile)
        return db_erabiltzaile
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Errorea") from e
    
    
def list_erreserbak(db: Session):
    try:
        stmt = select(models.Erreserbak).order_by(models.Erreserbak.id_erreserba)
        return db.scalars(stmt).all()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Errorea erreserbak ekartzen") from e
    
def patch_erabiltzailea(db: Session, id: int, erabiltzaile: schemas.CreateErabiltzaile):
    db_erabiltzaile = db.get(models.Erabiltzaileak, id)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da existitzen")
    
    for field, value in erabiltzaile.model_dump(exclude_unset=True).items():
        setattr(db_erabiltzaile, field, value)
    
    try:
        db.commit()
        db.refresh(db_erabiltzaile)
        return db_erabiltzaile
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Errorea") from e
    
def update_rola(db: Session, id: int, rola: int):
    db_erabiltzaile = db.get(models.Erabiltzaileak, id)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erabiltzailea aurkitu")
    
    db_erabiltzaile.id_rol = rola
    
    try:
        db.commit()
        db.refresh(db_erabiltzaile)
        return db_erabiltzaile
    except IntegrityError as e:
        raise HTTPException(status_code=status.HTTP_400, detail="Errorea") from e
    
def list_erabiltzaile_erreserba(db: Session, id: int):
    db_erabiltzaile = db.get(models.Erabiltzaileak, id)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erabiltzailea aurkitu")

    stmt = select(models.Erreserbak).where(models.Erreserbak.id_erab == id)
    
    return db.scalars(stmt).all()  
    
def create_takilla(db: Session, takilla: schemas.CreateTakilla):
    db_takilla = models.Takillak(**takilla.model_dump())
    try:
        db.add(db_takilla)
        db.commit()
        db.refresh(db_takilla)
        return db_takilla
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Errorea sortzen") from e    
    
def patch_takilla(db: Session, id: int, takilla: schemas.CreateTakilla):
    db_takilla = db.get(models.Takillak, id)
    if not db_takilla:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da existitzen")
    
    for field, value in takilla.model_dump(exclude_unset=True).items():
        setattr(db_takilla, field, value)
    
    try:
        db.commit()
        db.refresh(db_takilla)
        return db_takilla
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Errorea") from e
    
def delete_takilla(db: Session, id: int):
    db_takilla = db.get(models.Takillak, id)
    if not db_takilla:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da aurkitu takilla")
    
    try:
        db.delete(db_takilla)
        db.commit()
        return { "message": "Takilla ondo ezabatu da", "id": id }
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Errorea") from e