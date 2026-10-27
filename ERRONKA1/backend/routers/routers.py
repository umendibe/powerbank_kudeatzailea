from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import database
from models import models
from schemas import schemas
from services import services

powerbank_router = APIRouter(prefix="/powerbanks", tags=["POWERBANKS"])

@powerbank_router.get("", status_code=200)
def get_all_participants(db: Session = Depends(database.get_db)):
    return services.get_all_erabiltzaileak(db)