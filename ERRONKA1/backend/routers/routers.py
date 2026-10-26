from fastapi import APIRouter, HTTPException

from schemas import schemas
from database import database
from models import models

powerbank_router = APIRouter(prefix="/powerbanks", tags=["POWERBANKS"])