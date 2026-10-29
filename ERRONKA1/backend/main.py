from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import routers

app = FastAPI(title="Powerbank Kudeatzailea API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routers.erabiltzaile_router)
app.include_router(routers.erreserbak_router)

@app.get("/")
def read_root():
    return {"message": "Powerbank API-a martxan dago"}