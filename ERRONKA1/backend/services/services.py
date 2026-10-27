from sqlalchemy.orm import Session

from models.models import Erreserbak


def list_erreserbak(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Erreserbak).offset(skip).limit(limit).all()
