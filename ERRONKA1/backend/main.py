from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import Base, engine
from models import models  # noqa: F401
from routers.routers import powerbank_router

Base.metadata.create_all(bind=engine)

<<<<<<< HEAD
app.include_router(routers.powerbank_router)

origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
=======
app = FastAPI(title="Powerbank backend")
app.include_router(powerbank_router)


@app.get("/")
def health_check():
    return {"status": "ok"}
>>>>>>> master
