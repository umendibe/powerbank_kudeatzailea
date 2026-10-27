from fastapi import FastAPI

from database.database import Base, engine
from models import models  # noqa: F401
from routers.routers import powerbank_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Powerbank backend")
app.include_router(powerbank_router)


@app.get("/")
def health_check():
    return {"status": "ok"}
