from fastapi import APIRouter, HTTPException

from database import database
from models import models
from schemas import schemas

powerbank_router = APIRouter(prefix="/powerbanks", tags=["POWERBANKS"])

@powerbank_router.get("", status_code=200)
def get_all_participants():
    return database.get_all_participants()