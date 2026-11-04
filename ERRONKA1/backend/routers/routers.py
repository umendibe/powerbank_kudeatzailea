from typing import Annotated

from database import database
from fastapi import APIRouter, Depends, Header, HTTPException, status
from models import models
from schemas import schemas
from services import services
from sqlalchemy.orm import Session

DbSession = Annotated[Session, Depends(database.get_session)]


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def get_current_user(
    session: DbSession,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Saioa hasi behar duzu.",
        )
    user = services.get_user_by_token(session, token)
    if not user or not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Saioak ez du balio. Hasi saioa berriro.",
        )
    return user


CurrentUser = Annotated[models.Erabiltzaileak, Depends(get_current_user)]


def require_system_admin(user: CurrentUser):
    if not services.is_system_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administratzaile orokorra behar da.",
        )
    return user


SystemAdmin = Annotated[models.Erabiltzaileak, Depends(require_system_admin)]


def require_staff(user: CurrentUser):
    if not services.is_staff(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrazio-baimenik ez duzu.",
        )
    return user


StaffUser = Annotated[models.Erabiltzaileak, Depends(require_staff)]


powerbank_router = APIRouter(prefix="/alokaziosistema", tags=["POWERBANKS"])

################# GET ENDPOINTAK #################

# Erabiltzaile guztiak lortu
@powerbank_router.get("/erabiltzaileak", status_code=200, response_model=list[schemas.ListErabiltzaileak])
def get_all_participants(session: DbSession, user: SystemAdmin):
    return services.get_all_erabiltzaileak(session)


# Erabiltzaile bakarra lortu id bitartez
@powerbank_router.get("/erabiltzaileak/{id}", status_code=200, response_model=schemas.ListErabiltzaileak)
def get_by_id(id: int, session: DbSession, user: SystemAdmin):
    return services.get_erabiltzaile_id(id, session)


# Atal publikoko erabiltzailearen datuak (pasahitzik gabe)
@powerbank_router.get(
    "/erabiltzaileak/{id}/nire-datuak",
    status_code=200,
    response_model=schemas.ErabiltzailePublicoResponse,
)
def get_nire_datuak(id: int, session: DbSession, user: CurrentUser):
    if user.id_erab != id and not services.is_system_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ez duzu erabiltzaile honen datuetara sartzeko baimenik.",
        )
    return services.get_erabiltzaile_publico(session, id)


# Atal publikotik norberaren datuak aldatu
@powerbank_router.patch(
    "/erabiltzaileak/{id}/nire-datuak",
    status_code=200,
    response_model=schemas.ErabiltzailePublicoResponse,
)
def update_nire_datuak(
    id: int,
    erabiltzaile: schemas.UpdateErabiltzailePublico,
    session: DbSession,
    user: CurrentUser,
):
    if user.id_erab != id and not services.is_system_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ez duzu erabiltzaile honen datuak aldatzeko baimenik.",
        )
    return services.update_erabiltzaile_publico(session, id, erabiltzaile)


# Udalerriak (atal publikoa: aktiboak soilik)
@powerbank_router.get("/udalerriak", response_model=list[schemas.UdalerriaResponse])
def get_udalerriak(session: DbSession):
    return services.get_all_udalerriak(session)


# Udalerriak (administrazioa: guztiak)
@powerbank_router.get("/udalerriak/admin", response_model=list[schemas.UdalerriaResponse])
def get_udalerriak_admin(session: DbSession, user: SystemAdmin):
    return services.get_all_udalerriak(session, include_inactive=True)


@powerbank_router.post("/udalerriak", status_code=201, response_model=schemas.UdalerriaResponse)
def post_udalerria(
    udalerria: schemas.CreateUdalerria,
    session: DbSession,
    user: SystemAdmin,
):
    return services.create_udalerria(session, udalerria)


@powerbank_router.patch("/udalerriak/{id}", response_model=schemas.UdalerriaResponse)
def patch_udalerria(
    id: int,
    udalerria: schemas.PatchUdalerria,
    session: DbSession,
    user: SystemAdmin,
):
    return services.update_udalerria(session, id, udalerria)


# Powerbank guztiak lortu (atal publikoa)
@powerbank_router.get("/powerbanks", response_model=list[schemas.ListPowerbank])
def read_powerbanks(session: DbSession):
    return services.get_all_powerbanks(session)


# Administrazio atalerako powerbank-ak rolaren arabera
@powerbank_router.get("/powerbanks/admin", response_model=list[schemas.ListPowerbank])
def read_powerbanks_admin(session: DbSession, user: StaffUser):
    return services.get_all_powerbanks(session, user)


@powerbank_router.get("/postuak/erabilgarriak", response_model=list[schemas.PostuDisponible])
def read_available_postuak(session: DbSession, user: StaffUser):
    return services.get_available_postuak(session, user)


# Erabiltzaile baten erreserba guztiak lortu
@powerbank_router.get("/erabiltzaileak/{id}/erreserbak", status_code=200, response_model=list[schemas.ListErreserbak])
def get_erreserbak_erabiltzaile(id: int, session: DbSession, user: CurrentUser):
    if user.id_erab != id and not services.is_system_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ez duzu beste erabiltzaile baten erreserbak ikusteko baimenik.",
        )
    return services.list_erabiltzaile_erreserba(session, id)


@powerbank_router.get("/erreserbak", status_code=status.HTTP_200_OK, response_model=list[schemas.ErreserbaResponse])
def get_erreserbak(session: DbSession):
    return services.list_erreserbak(session)


# Administrazio atalean erreserba guztiak datu osagarriekin lortu
@powerbank_router.get(
    "/erreserbak/admin",
    status_code=status.HTTP_200_OK,
    response_model=list[schemas.ErreserbaAdminResponse],
)
def get_erreserbak_admin(session: DbSession, user: StaffUser):
    return services.list_erreserbak_admin(session, user)


# Erreserbaren egoera aldatu
@powerbank_router.patch(
    "/erreserbak/{id}/egoera",
    status_code=status.HTTP_200_OK,
    response_model=schemas.ErreserbaResponse,
)
def update_erreserba_egoera(
    id: int,
    egoera: schemas.PatchErreserbaEgoera,
    session: DbSession,
    user: StaffUser,
):
    return services.patch_erreserba_egoera(session, id, egoera.egoera, user)


# Erreserba ezeztatu
@powerbank_router.patch(
    "/erreserbak/{id}/ezeztatu",
    status_code=status.HTTP_200_OK,
    response_model=schemas.ErreserbaResponse,
)
def cancel_erreserba(id: int, session: DbSession, user: StaffUser):
    return services.cancel_erreserba(session, id, user)


# Atal publikotik erreserba berria sortu
@powerbank_router.post(
    "/erreserbak/publiko",
    status_code=status.HTTP_201_CREATED,
    response_model=schemas.ErreserbaResponse,
)
def create_erreserba_publico(
    erreserba: schemas.ErreserbaPublicoCreate,
    session: DbSession,
    user: CurrentUser,
):
    return services.create_erreserba_publico(session, erreserba, user)


# Atal publikotik norberaren etorkizuneko erreserba ezeztatu
@powerbank_router.patch(
    "/erreserbak/{id}/ezeztatu-publikoa",
    status_code=status.HTTP_200_OK,
    response_model=schemas.ErreserbaResponse,
)
def cancel_erreserba_publico(
    id: int,
    datuak: schemas.ErreserbaPublicoCancel,
    session: DbSession,
    user: CurrentUser,
):
    return services.cancel_erreserba_publico(session, id, user.id_erab)


@powerbank_router.post("/login", status_code=status.HTTP_200_OK)
def login(datuak: schemas.ErabiltzaileLogin, db: DbSession):
    return services.login(db, datuak.email, datuak.pasahitza)


# Administrazio ataleko login-a: soilik rol 1 duten erabiltzaile aktiboak
@powerbank_router.post(
    "/login/admin",
    status_code=status.HTTP_200_OK,
    response_model=schemas.AdminLoginResponse,
)
def admin_login(datuak: schemas.ErabiltzaileLogin, db: DbSession):
    user = services.admin_login(db, datuak.email, datuak.pasahitza)
    token = services.create_auth_session(db, user.id_erab)
    return schemas.AdminLoginResponse(
        id_erab=user.id_erab,
        izena=user.izena,
        email=user.email,
        id_rol=user.id_rol,
        id_udalerria=user.id_udalerria,
        udalerria_izena=services.get_udalerria_izena(db, user.id_udalerria),
        token=token,
    )


# Atal publikoko login-a: erabiltzaile aktibo guztiak
@powerbank_router.post(
    "/login/public",
    status_code=status.HTTP_200_OK,
    response_model=schemas.PublicLoginResponse,
)
def public_login(datuak: schemas.ErabiltzaileLogin, db: DbSession):
    user = services.public_login(db, datuak.email, datuak.pasahitza)
    token = services.create_auth_session(db, user.id_erab)
    return schemas.PublicLoginResponse(
        id_erab=user.id_erab,
        nan=user.nan,
        izena=user.izena,
        abizenak=user.abizenak,
        email=user.email,
        helbidea=user.helbidea,
        id_rol=user.id_rol,
        id_udalerria=user.id_udalerria,
        udalerria_izena=services.get_udalerria_izena(db, user.id_udalerria),
        activo=user.activo,
        token=token,
    )


@powerbank_router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _bearer_token(authorization)
    if token:
        services.delete_auth_session(db, token)
    return {"message": "Saioa itxi da."}

################# POST ENDPOINTAK #################

@powerbank_router.post("/erabiltzaileak/post", status_code=201, response_model=schemas.ListErabiltzaileak)
def create_erabiltzaile(
    session: DbSession,
    erabiltzaile: schemas.CreateErabiltzaile,
    user: SystemAdmin,
):
    return services.post_erabiltzaile(session, erabiltzaile)


# Atal publikoko erregistroa: rola beti 2 (erabiltzaile arrunta)
@powerbank_router.post(
    "/erabiltzaileak/erregistratu",
    status_code=201,
    response_model=schemas.ErabiltzailePublicoResponse,
)
def register_erabiltzaile_publico(
    session: DbSession,
    erabiltzaile: schemas.CreateErabiltzailePublico,
):
    return services.register_erabiltzaile_publico(session, erabiltzaile)


@powerbank_router.post("/takillak/post", status_code=201, response_model=schemas.TakillaResponse)
def post_takilla(
    session: DbSession,
    takilla: schemas.CreateTakilla,
    user: StaffUser,
):
    return services.create_takilla(session, takilla, user)


@powerbank_router.get("/takillak", response_model=list[schemas.TakillaResponse])
def get_takillak(session: DbSession, id_udalerria: int | None = None):
    return services.get_all_takillak(session, id_udalerria)


@powerbank_router.get("/takillak/admin", response_model=list[schemas.TakillaResponse])
def get_takillak_admin(session: DbSession, user: StaffUser):
    return services.get_all_takillak(session, user=user, include_inactive=True)


# Kargagune guztien irudiak (zerrenda komuna)
@powerbank_router.get("/takillak/irudiak", response_model=list[schemas.TakillaIrudiaResponse])
def get_takilla_irudiak(session: DbSession):
    return services.get_takilla_irudiak(session)


# Kargagune bakarraren xehetasunak
@powerbank_router.get("/takillak/{id}", response_model=schemas.TakillaResponse)
def get_takilla(id: int, session: DbSession):
    return services.get_takilla(session, id)


# Kargagune baten irudiak
@powerbank_router.get("/takillak/{id}/irudiak", response_model=list[schemas.TakillaIrudiaResponse])
def get_takilla_irudiak_by_id(id: int, session: DbSession):
    return services.get_takilla_irudiak(session, id)


@powerbank_router.get("/takillak/{id}/postuak", response_model=list[schemas.PostuResponse])
def get_postuak_takillan(id: int, session: DbSession):
    return services.get_postuak_takillan(session, id)


@powerbank_router.post("/takillak/{id}/postuak", status_code=201, response_model=schemas.PostuResponse)
def postu_berria(id: int, session: DbSession, user: StaffUser):
    return services.create_postua(session, id, user)


@powerbank_router.delete("/postuak/{id}/delete", status_code=status.HTTP_200_OK)
def delete_postua(id: int, session: DbSession, user: StaffUser):
    return services.delete_postua(session, id, user)


@powerbank_router.post("/powerbanks/post", status_code=201, response_model=schemas.ListPowerbank)
def create_powerbank(
    session: DbSession,
    powerbank: schemas.CreatePowerbank,
    user: StaffUser,
):
    return services.create_powerbank(session, powerbank, user)

################# PATCH ENDPOINTAK #################

@powerbank_router.patch("/erabiltzaileak/{id}/eguneratu", status_code=200, response_model=schemas.ListErabiltzaileak)
def update_erabiltzaile(
    id: int,
    erabiltzaile: schemas.PatchErabiltzaile,
    session: DbSession,
    user: SystemAdmin,
):
    return services.patch_erabiltzailea(session, id, erabiltzaile)


@powerbank_router.patch("/erabiltzaileak/{id}/rola", status_code=200, response_model=schemas.ListErabiltzaileak)
def update_rola(id: int, rola: int, session: DbSession, user: SystemAdmin):
    return services.update_rola(session, id, rola)

@powerbank_router.patch("/takillak/{id}/eguneratu", status_code=200, response_model=schemas.TakillaResponse)
def update_takilla(
    id: int,
    takilla: schemas.PatchTakilla,
    session: DbSession,
    user: StaffUser,
):
    return services.patch_takilla(session, id, takilla, user)


@powerbank_router.patch("/powerbanks/{id}/aldatuTokia", status_code=status.HTTP_200_OK, response_model=schemas.ListPowerbank)
def powerbank_tokia_aldatu(
    session: DbSession,
    id: int,
    powerbank: schemas.PowerbankTokiaPatch,
    user: StaffUser,
):
    return services.patch_powerbank_position(session, id, powerbank, user)


@powerbank_router.put("/erabiltzaileak/{id}/egoera", status_code=status.HTTP_200_OK, response_model=schemas.PatchErabiltzaile)
def egoera_aldatu(
    session: DbSession,
    id: int,
    erabiltzaile: schemas.PatchErabiltzaileEgoera,
    user: SystemAdmin,
):
    return services.patch_activo(session, id, erabiltzaile)


################# DELETE ENDPOINTAK #################

@powerbank_router.delete("/takillak/{id}/delete", status_code=status.HTTP_200_OK)
def delete_takilla(id: int, session: DbSession, user: StaffUser):
    return services.delete_takilla(session, id, user)


@powerbank_router.delete("/erabiltzaileak/{id}/ezabatu", status_code=status.HTTP_200_OK)
def delete_erabiltzaile(id: int, session: DbSession, user: SystemAdmin):
    return services.delete_erabiltzaile(session, id)


@powerbank_router.delete("/powerbanks/{id}/ezabatu", status_code=status.HTTP_200_OK)
def delete_powerbank(id: int, session: DbSession, user: StaffUser):
    return services.delete_powerbank(session, id, user)

###TODO, HAU ALDATU EGIN BEHAR DA MIKELEK ESKATU DUEN MODUAN EGITEKO
@powerbank_router.post("/", response_model=schemas.ErreserbaResponse, status_code=status.HTTP_201_CREATED)
def create_powerbank_reservation(erreserba: schemas.ErreserbaCreate, db: DbSession):
    if erreserba.erreserba_hasiera >= erreserba.erreserba_bukaera:
        raise HTTPException(status_code=400, detail="Hasiera data ezin da amaiera data edo geroagokoa izan.")

    if erreserba.erreserba_hasiera.replace(tzinfo=None) < __import__("datetime").datetime.now():
        raise HTTPException(status_code=400, detail="Ezin da iraganeko datarako erreserbarik egin.")

    postua = db.query(models.Postuak).filter(models.Postuak.id_postu == erreserba.id_hasiera_postua).first()
    if not postua or postua.egoera  ==   'zerbitzuz kanpo':
        raise HTTPException(status_code=400, detail="Postu  hau ez dago erabilgarri.")

    overlap = db.query(models.Erreserbak).filter(
        models.Erreserbak.id_hasiera_postua == erreserba.id_hasiera_postua,
        models.Erreserbak.egoera == models.ErreserbaEgoeraEnum.aktiboa,
        models.Erreserbak.erreserba_hasiera < erreserba.erreserba_bukaera,
        models.Erreserbak.erreserba_bukaera > erreserba.erreserba_hasiera,
    ).first()
    if overlap:
        raise HTTPException(status_code=409, detail="Karga - postu honek erreserba bat du tarte horretan.")

    nova = models.Erreserbak(
        id_erab=1,
        id_power=erreserba.id_power,
        erreserba_hasiera=erreserba.erreserba_hasiera,
        erreserba_bukaera=erreserba.erreserba_bukaera,
        id_hasiera_takilla=erreserba.id_hasiera_takilla,
        id_hasiera_postua=erreserba.id_hasiera_postua,
        egoera  = models.ErreserbaEgoeraEnum.aktiboa,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova
