import secrets
from datetime import datetime, timezone

from fastapi import HTTPException, status
from models import models
from schemas import schemas
from services.auth import get_password_hash, is_password_hash, verify_password
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session


def _hash_password(password: str) -> str:
    return get_password_hash(password)


def _autentifikatu(db: Session, email: str, password: str):
    """Find an active credential and upgrade legacy plain-text passwords."""
    db_erabiltzaile = db.scalars(
        select(models.Erabiltzaileak).where(models.Erabiltzaileak.email == email)
    ).first()

    if not db_erabiltzaile:
        return None

    stored_password = db_erabiltzaile.pasahitza or ""

    if is_password_hash(stored_password):
        if not verify_password(password, stored_password):
            return None
        return db_erabiltzaile

    # Compatibility for users created before hashing was enabled.
    if not secrets.compare_digest(
        stored_password.encode("utf-8"),
        password.encode("utf-8"),
    ):
        return None

    db_erabiltzaile.pasahitza = get_password_hash(password)
    try:
        db.commit()
        db.refresh(db_erabiltzaile)
    except SQLAlchemyError:
        db.rollback()

    return db_erabiltzaile


def get_all_erabiltzaileak(db: Session):
    try:
        stmt = select(models.Erabiltzaileak).order_by(models.Erabiltzaileak.id_erab)
        return db.scalars(stmt).all()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Errorea erabiltzaileak ekartzen") from e
    
def get_all_powerbanks(db: Session):
    try:
        stmt = select(models.Powerbank).order_by(models.Powerbank.id_power)
        return db.scalars(stmt).all()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Errorea erabiltzaileak ekartzen") from e

def get_available_postuak(db: Session):
    try:
        stmt = (
            select(models.Postuak)
            .where(models.Postuak.egoera == models.PostuakEgoeraEnum.hutsa)
            .order_by(models.Postuak.id_takilla, models.Postuak.id_postu)
        )
        return db.scalars(stmt).all()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Errorea postu erabilgarriak ekartzen") from e

def get_erabiltzaile_id(id: int, db: Session):
    erabiltzaile = db.get(models.Erabiltzaileak, id,)
    if erabiltzaile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da existitzen")
    return erabiltzaile


def delete_erabiltzaile(db: Session, id: int):
    erabiltzaile = db.get(models.Erabiltzaileak, id)
    if erabiltzaile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erabiltzailea aurkitu")

    try:
        db.delete(erabiltzaile)
        db.commit()
        return {"message": "Erabiltzailea ondo ezabatu da", "id": id}
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Erabiltzailea ezin da ezabatu, erreserbak lotuta dauzka.",
        ) from e


def post_erabiltzaile(db: Session, erabiltzaile: schemas.CreateErabiltzaile):
    datuak = erabiltzaile.model_dump()
    datuak["pasahitza"] = _hash_password(datuak["pasahitza"])
    db_erabiltzaile = models.Erabiltzaileak(**datuak, activo=True)
    try:
        db.add(db_erabiltzaile)
        db.commit()
        db.refresh(db_erabiltzaile)
        return db_erabiltzaile
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ezin da erabiltzailea gorde: NANa edo emaila dagoeneko erregistratuta egon daiteke, edo hautatutako rola ez da baliozkoa.",
        ) from e
    
    
def list_erreserbak(db: Session):
    try:
        stmt = select(models.Erreserbak).order_by(models.Erreserbak.id_erreserba)
        return db.scalars(stmt).all()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Errorea erreserbak ekartzen") from e


def list_erreserbak_admin(db: Session):
    try:
        stmt = (
            select(
                models.Erreserbak,
                models.Erabiltzaileak.izena,
                models.Erabiltzaileak.abizenak,
                models.Erabiltzaileak.email,
                models.Takillak.izena,
                models.Powerbank.karga,
            )
            .join(models.Erabiltzaileak, models.Erreserbak.id_erab == models.Erabiltzaileak.id_erab)
            .join(models.Takillak, models.Erreserbak.id_hasiera_takilla == models.Takillak.id_takilla)
            .join(models.Powerbank, models.Erreserbak.id_power == models.Powerbank.id_power)
            .order_by(models.Erreserbak.id_erreserba)
        )

        erreserbak = []
        for (
            erreserba,
            erabiltzaile_izena,
            erabiltzaile_abizenak,
            erabiltzaile_email,
            kargagune_izena,
            powerbank_karga,
        ) in db.execute(stmt).all():
            datuak = schemas.ListErreserbak.model_validate(erreserba).model_dump()
            erreserbak.append(
                schemas.ErreserbaAdminResponse(
                    **datuak,
                    erabiltzaile_izena=erabiltzaile_izena,
                    erabiltzaile_abizenak=erabiltzaile_abizenak,
                    erabiltzaile_email=erabiltzaile_email,
                    kargagune_izena=kargagune_izena,
                    powerbank_karga=powerbank_karga,
                )
            )

        return erreserbak
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errorea erreserbak ekartzen",
        ) from e


def patch_erreserba_egoera(db: Session, id: int, egoera: str):
    db_erreserba = db.get(models.Erreserbak, id)
    if not db_erreserba:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erreserba aurkitu")

    egoera_enum = models.ErreserbaEgoeraEnum(egoera)

    if egoera_enum == models.ErreserbaEgoeraEnum.aktiboa and db_erreserba.egoera != models.ErreserbaEgoeraEnum.aktiboa:
        overlap = db.scalars(
            select(models.Erreserbak).where(
                models.Erreserbak.id_erreserba != id,
                models.Erreserbak.egoera == models.ErreserbaEgoeraEnum.aktiboa,
                models.Erreserbak.id_hasiera_postua == db_erreserba.id_hasiera_postua,
                models.Erreserbak.erreserba_hasiera < db_erreserba.erreserba_bukaera,
                models.Erreserbak.erreserba_bukaera > db_erreserba.erreserba_hasiera,
            )
        ).first()
        if overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Beste erreserba aktibo bat dago tarte horretan postu berean.",
            )

    try:
        db_erreserba.egoera = egoera_enum
        db.commit()
        db.refresh(db_erreserba)
        return db_erreserba
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errorea erreserbaren egoera aldatzen",
        ) from e


def cancel_erreserba(db: Session, id: int):
    db_erreserba = db.get(models.Erreserbak, id)
    if not db_erreserba:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erreserba aurkitu")

    if db_erreserba.egoera == models.ErreserbaEgoeraEnum.ezeztatuta:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Erreserba hau dagoeneko ezeztatuta dago.",
        )

    if db_erreserba.egoera != models.ErreserbaEgoeraEnum.aktiboa:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Soilik erreserba aktiboak ezeztatu daitezke.",
        )

    try:
        db_erreserba.egoera = models.ErreserbaEgoeraEnum.ezeztatuta
        db.commit()
        db.refresh(db_erreserba)
        return db_erreserba
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errorea erreserba ezeztatzen",
        ) from e
    
def patch_erabiltzailea(db: Session, id: int, erabiltzaile: schemas.CreateErabiltzaile):
    db_erabiltzaile = db.get(models.Erabiltzaileak, id)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da existitzen")

    datuak = erabiltzaile.model_dump(exclude_unset=True)
    if datuak.get("pasahitza"):
        datuak["pasahitza"] = _hash_password(datuak["pasahitza"])

    for field, value in datuak.items():
        setattr(db_erabiltzaile, field, value)
    
    try:
        db.commit()
        db.refresh(db_erabiltzaile)
        return db_erabiltzaile
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Errorea") from e
    
def update_rola(db: Session, id: int, rola: int):
    db_erabiltzaile = db.get(models.Erabiltzaileak, id)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erabiltzailea aurkitu")
    
    db_erabiltzaile.id_rol = rola
    
    try:
        db.commit()
        db.refresh(db_erabiltzaile)
        return db_erabiltzaile
    except IntegrityError as e:
        raise HTTPException(status_code=status.HTTP_400, detail="Errorea") from e
    
def list_erabiltzaile_erreserba(db: Session, id: int):
    db_erabiltzaile = db.get(models.Erabiltzaileak, id)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erabiltzailea aurkitu")

    stmt = select(models.Erreserbak).where(models.Erreserbak.id_erab == id)
    
    return db.scalars(stmt).all()  
    
def create_takilla(db: Session, takilla: schemas.CreateTakilla):
    takilla_data = takilla.model_dump()
    takilla_data["egoera"] = models.TakillakEgoeraEnum(takilla_data["egoera"])
    db_takilla = models.Takillak(**takilla_data)
    try:
        db.add(db_takilla)
        db.commit()
        db.refresh(db_takilla)
        return db_takilla
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Errorea sortzen") from e    
    
def get_all_takillak(db: Session):
    try:
        stmt = select(models.Takillak).order_by(models.Takillak.id_takilla)
        return db.scalars(stmt).all()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Errorea takillak ekartzen") from e


def get_takilla(db: Session, id: int):
    takilla = db.get(models.Takillak, id)
    if not takilla:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da kargagunea aurkitu")
    return takilla


def get_takilla_irudiak(db: Session, id_takilla: int | None = None):
    try:
        stmt = select(models.TakillakIrudiak).order_by(models.TakillakIrudiak.id_irudi)
        if id_takilla is not None:
            if not db.get(models.Takillak, id_takilla):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ez da kargagunea aurkitu",
                )
            stmt = stmt.where(models.TakillakIrudiak.id_takilla == id_takilla)
        return db.scalars(stmt).all()
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errorea kargaguneen irudiak ekartzen",
        ) from e

def patch_takilla(db: Session, id: int, takilla: schemas.PatchTakilla):
    db_takilla = db.get(models.Takillak, id)
    if not db_takilla:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da existitzen")
    
    for field, value in takilla.model_dump(exclude_unset=True).items():
        if field == "egoera" and value is not None:
            value = models.TakillakEgoeraEnum(value)
        setattr(db_takilla, field, value)
    
    try:
        db.commit()
        db.refresh(db_takilla)
        return db_takilla
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Errorea") from e

def get_postuak_takillan(db: Session, id_takilla: int):
    if not db.get(models.Takillak, id_takilla):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da takilla aurkitu")
    stmt = (
        select(models.Postuak)
        .where(models.Postuak.id_takilla == id_takilla)
        .order_by(models.Postuak.id_postu)
    )
    return db.scalars(stmt).all()

def create_postua(db: Session, id_takilla: int):
    if not db.get(models.Takillak, id_takilla):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da takilla aurkitu")
    db_postu = models.Postuak(
        id_takilla=id_takilla,
        egoera=models.PostuakEgoeraEnum.hutsa,
    )
    try:
        db.add(db_postu)
        db.commit()
        db.refresh(db_postu)
        return db_postu
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Errorea postua sortzen") from e

def delete_postua(db: Session, id_postu: int):
    db_postu = db.get(models.Postuak, id_postu)
    if not db_postu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da postua aurkitu")
    if db_postu.egoera != models.PostuakEgoeraEnum.hutsa:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ezin da okupatuta dagoen postua ezabatu")

    try:
        db.delete(db_postu)
        db.commit()
        return {"message": "Postua ondo ezabatu da", "id": id_postu}
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Postua ezin da ezabatu, erreserba bati lotuta dagoelako",
        ) from e
    
def delete_takilla(db: Session, id: int):
    db_takilla = db.scalars(
        select(models.Takillak)
        .where(models.Takillak.id_takilla == id)
        .with_for_update()
    ).first()
    if not db_takilla:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da aurkitu takilla")
    
    postuak = db.scalars(
        select(models.Postuak)
        .where(models.Postuak.id_takilla == id)
        .with_for_update()
    ).all()
    postu_ids = [postua.id_postu for postua in postuak]

    powerbank_conditions = [models.Powerbank.id_takilla == id]
    if postu_ids:
        powerbank_conditions.append(models.Powerbank.id_postu.in_(postu_ids))
    if db.scalars(
        select(models.Powerbank.id_power)
        .where(or_(*powerbank_conditions))
        .limit(1)
    ).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Takilla ezin da ezabatu: powerbank bat edo gehiago ditu. Kendu edo mugitu powerbankak lehenik.",
        )
    if any(postua.egoera != models.PostuakEgoeraEnum.hutsa for postua in postuak):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Takilla ezin da ezabatu: postu okupatuak edo erabilgarriak ez diren postuak ditu.",
        )

    reservation_conditions = [
        models.Erreserbak.id_hasiera_takilla == id,
        models.Erreserbak.id_bukaera_takilla == id,
    ]
    if postu_ids:
        reservation_conditions.extend(
            [
                models.Erreserbak.id_hasiera_postua.in_(postu_ids),
                models.Erreserbak.id_bukaera_postua.in_(postu_ids),
            ]
        )
    if db.scalars(
        select(models.Erreserbak.id_erreserba)
        .where(or_(*reservation_conditions))
        .limit(1)
    ).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Takilla ezin da ezabatu: erreserba-historian agertzen da.",
        )

    try:
        image_rows = db.scalars(
            select(models.TakillakIrudiak).where(models.TakillakIrudiak.id_takilla == id)
        ).all()
        for image_row in image_rows:
            db.delete(image_row)
        for postua in postuak:
            db.delete(postua)
        db.delete(db_takilla)
        db.commit()
        return {"message": "Takilla ondo ezabatu da", "id": id}
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Takilla ezin da ezabatu, datu lotuak dituelako.",
        ) from e
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errorea takilla ezabatzen.",
        ) from e
    
def create_powerbank(db: Session, powerbank: schemas.CreatePowerbank):
    db_postu = db.scalars(
        select(models.Postuak)
        .where(models.Postuak.id_postu == powerbank.id_postu)
        .with_for_update()
    ).first()
    if not db_postu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aukeratutako postua ez da aurkitu")
    if db_postu.id_takilla != powerbank.id_takilla:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Postua ez dagokio aukeratutako takillari")
    if db_postu.egoera != models.PostuakEgoeraEnum.hutsa:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Aukeratutako postua ez dago hutsik")

    db_powerbank = models.Powerbank(**powerbank.model_dump())
    try:
        db_postu.egoera = models.PostuakEgoeraEnum.kargatuta
        db.add(db_powerbank)
        db.commit()
        db.refresh(db_powerbank)
        return db_powerbank
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Errorea powerbank-a sortzen") from e
    
def patch_powerbank_position(db: Session, id_power: int, powerbank: schemas.PowerbankTokiaPatch):
    db_powerbank = db.get(models.Powerbank, id_power)
    if not db_powerbank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da powerbank-a aurkitu")

    update_data = powerbank.model_dump(exclude_unset=True)
    old_postu_id = db_powerbank.id_postu
    new_postu_id = update_data.get("id_postu", old_postu_id)

    try:
        if new_postu_id != old_postu_id:
            postuak = db.scalars(
                select(models.Postuak)
                .where(models.Postuak.id_postu.in_([old_postu_id, new_postu_id]))
                .with_for_update()
            ).all()
            postuak_by_id = {postu.id_postu: postu for postu in postuak}
            old_postu = postuak_by_id.get(old_postu_id)
            new_postu = postuak_by_id.get(new_postu_id)

            if not old_postu:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Powerbank-aren uneko postua ez da aurkitu",
                )
            if not new_postu:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Aukeratutako postua ez da aurkitu",
                )
            if new_postu.egoera != models.PostuakEgoeraEnum.hutsa:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Aukeratutako postua ez dago erabilgarri",
                )

            old_postu.egoera = models.PostuakEgoeraEnum.hutsa
            new_postu.egoera = models.PostuakEgoeraEnum.kargatuta

        for field, value in update_data.items():
            setattr(db_powerbank, field, value)

        db.commit()
        db.refresh(db_powerbank)
        return db_powerbank
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Errorea powerbankaren tokia aldatzen") from e

def delete_powerbank(db: Session, id_power: int):
    db_powerbank = db.get(models.Powerbank, id_power)
    if not db_powerbank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da powerbank-a aurkitu")

    postu = db.scalars(
        select(models.Postuak)
        .where(models.Postuak.id_postu == db_powerbank.id_postu)
        .with_for_update()
    ).first()
    if not postu:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Powerbank-aren postua ez da aurkitu",
        )

    try:
        erreserbak = db.scalars(
            select(models.Erreserbak)
            .where(models.Erreserbak.id_power == id_power)
            .with_for_update()
        ).all()
        for erreserba in erreserbak:
            db.delete(erreserba)

        postu.egoera = models.PostuakEgoeraEnum.hutsa
        db.delete(db_powerbank)
        db.commit()
        return {"message": "Powerbank-a ondo ezabatu da", "id": id_power}
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Powerbank-a ezin da ezabatu, hari lotutako erreserbak daudelako.",
        ) from e
    
def patch_activo(db: Session, id_erab: int, erabiltzaile: schemas.PatchErabiltzaileEgoera):
    db_erabiltzaile = db.get(models.Erabiltzaileak, id_erab)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erabiltzailea aurkitu")
    
    db_erabiltzaile.activo = erabiltzaile.activo
    
    try:
        db.commit()
        db.refresh(db_erabiltzaile)
        return db_erabiltzaile
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Errorea erabiltzailearen egoera aldatzerakoan") from e
    
    
def login(db: Session, email: str, password: str):
    db_erabiltzaile = _autentifikatu(db, email, password)

    if not db_erabiltzaile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Ez da erabiltzailea aurkitu edo pasahitza okerra da"
        )
        
    return db_erabiltzaile.id_rol


def admin_login(db: Session, email: str, password: str):
    db_erabiltzaile = _autentifikatu(db, email, password)

    if not db_erabiltzaile:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Emaila edo pasahitza okerra da",
        )

    if not db_erabiltzaile.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Erabiltzailearen kontua ez dago aktibo",
        )

    if db_erabiltzaile.id_rol != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kontu honek ez du administrazio baimenik",
        )

    return db_erabiltzaile


################ ATAL PUBLIKOA ################

def public_login(db: Session, email: str, password: str):
    db_erabiltzaile = _autentifikatu(db, email, password)

    if not db_erabiltzaile:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Emaila edo pasahitza okerra da",
        )

    if not db_erabiltzaile.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Erabiltzailearen kontua ez dago aktibo",
        )

    return db_erabiltzaile


def register_erabiltzaile_publico(db: Session, erabiltzaile: schemas.CreateErabiltzailePublico):
    datuak = erabiltzaile.model_dump()
    datuak["pasahitza"] = _hash_password(datuak["pasahitza"])
    db_erabiltzaile = models.Erabiltzaileak(
        **datuak,
        id_rol=2,
        activo=True,
    )

    try:
        db.add(db_erabiltzaile)
        db.commit()
        db.refresh(db_erabiltzaile)
        return db_erabiltzaile
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ezin da erabiltzailea erregistratu: NANa edo emaila dagoeneko erregistratuta dago.",
        ) from e


def get_erabiltzaile_publico(db: Session, id: int):
    db_erabiltzaile = db.get(models.Erabiltzaileak, id)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erabiltzailea aurkitu")
    return db_erabiltzaile


def update_erabiltzaile_publico(
    db: Session,
    id: int,
    erabiltzaile: schemas.UpdateErabiltzailePublico,
):
    db_erabiltzaile = db.get(models.Erabiltzaileak, id)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erabiltzailea aurkitu")

    datuak = erabiltzaile.model_dump(exclude_unset=True)
    if datuak.get("pasahitza"):
        datuak["pasahitza"] = _hash_password(datuak["pasahitza"])

    for field, value in datuak.items():
        if value is None:
            continue
        setattr(db_erabiltzaile, field, value)

    try:
        db.commit()
        db.refresh(db_erabiltzaile)
        return db_erabiltzaile
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ezin izan dira datuak gorde: NANa edo emaila dagoeneko erabilita dago.",
        ) from e


def create_erreserba_publico(db: Session, erreserba: schemas.ErreserbaPublicoCreate):
    hasiera = erreserba.erreserba_hasiera
    bukaera = erreserba.erreserba_bukaera

    if hasiera.tzinfo is None:
        hasiera = hasiera.replace(tzinfo=timezone.utc)
    if bukaera.tzinfo is None:
        bukaera = bukaera.replace(tzinfo=timezone.utc)

    if hasiera >= bukaera:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hasiera ordua amaiera ordua baino lehenago izan behar da.",
        )

    if hasiera <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ezin da iraganeko datarako erreserbarik egin.",
        )

    db_erabiltzaile = db.get(models.Erabiltzaileak, erreserba.id_erab)
    if not db_erabiltzaile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erabiltzailea aurkitu")
    if not db_erabiltzaile.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Erabiltzailearen kontua ez dago aktibo",
        )

    db_takilla = db.get(models.Takillak, erreserba.id_hasiera_takilla)
    if not db_takilla:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da kargagunea aurkitu")
    if db_takilla.egoera != models.TakillakEgoeraEnum.erabilgarri:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kargagunea ez dago erabilgarri.",
        )

    db_postu = db.get(models.Postuak, erreserba.id_hasiera_postua)
    if not db_postu or db_postu.id_takilla != erreserba.id_hasiera_takilla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ez da karga-postua aurkitu kargagune honetan.",
        )

    db_powerbank = db.get(models.Powerbank, erreserba.id_power)
    if not db_powerbank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da powerbank-a aurkitu")
    if (
        db_powerbank.id_postu != erreserba.id_hasiera_postua
        or db_powerbank.id_takilla != erreserba.id_hasiera_takilla
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Aukeratutako powerbank-a ez dago karga-postu horretan.",
        )

    overlap = db.scalars(
        select(models.Erreserbak).where(
            models.Erreserbak.egoera == models.ErreserbaEgoeraEnum.aktiboa,
            models.Erreserbak.erreserba_hasiera < bukaera,
            models.Erreserbak.erreserba_bukaera > hasiera,
            or_(
                models.Erreserbak.id_hasiera_postua == erreserba.id_hasiera_postua,
                models.Erreserbak.id_power == erreserba.id_power,
            ),
        )
    ).first()
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Powerbank edo karga-postu honek erreserba bat du tarte horretan.",
        )

    db_erreserba = models.Erreserbak(
        id_erab=erreserba.id_erab,
        id_power=erreserba.id_power,
        erreserba_hasiera=hasiera,
        erreserba_bukaera=bukaera,
        id_hasiera_takilla=erreserba.id_hasiera_takilla,
        id_hasiera_postua=erreserba.id_hasiera_postua,
        egoera=models.ErreserbaEgoeraEnum.aktiboa,
    )

    try:
        db.add(db_erreserba)
        db.commit()
        db.refresh(db_erreserba)
        return db_erreserba
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errorea erreserba sortzen",
        ) from e


def cancel_erreserba_publico(db: Session, id: int, id_erab: int):
    db_erreserba = db.get(models.Erreserbak, id)
    if not db_erreserba:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ez da erreserba aurkitu")

    if db_erreserba.id_erab != id_erab:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ez duzu erreserba hau ezeztatzeko baimenik.",
        )

    if db_erreserba.egoera != models.ErreserbaEgoeraEnum.aktiboa:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Soilik erreserba aktiboak ezeztatu daitezke.",
        )

    hasiera = db_erreserba.erreserba_hasiera
    if hasiera.tzinfo is None:
        hasiera = hasiera.replace(tzinfo=timezone.utc)

    if hasiera <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Etorkizuneko erreserbak soilik ezeztatu daitezke.",
        )

    try:
        db_erreserba.egoera = models.ErreserbaEgoeraEnum.ezeztatuta
        db.commit()
        db.refresh(db_erreserba)
        return db_erreserba
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errorea erreserba ezeztatzen",
        ) from e
    
    