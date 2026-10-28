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