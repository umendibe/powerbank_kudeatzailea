from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import database
from models import models
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