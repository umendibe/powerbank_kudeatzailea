from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class Rol(Base):
    __tablename__ = "rolak"
    
    id_rol: Mapped[int] = mapped_column(primary_key=True, index=True)
    izena: Mapped[str] = mapped_column(String(100))

class Erabiltzaileak(Base):
    __tablename__ = "erabiltzaileak"
    
    id_erab: Mapped[int] = mapped_column(primary_key=True, index=True)
    nan: Mapped[str] = mapped_column(String(9), nullable=False, unique=True)
    izena: Mapped[str] = mapped_column(String(100), nullable=False)
    abizenak: Mapped[str] = mapped_column(String(250), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    pasahitza: Mapped[str] = mapped_column(String(200), nullable=False)
    helbidea: Mapped[str] = mapped_column(String(250), nullable=False)
    id_rol: Mapped[int] = mapped_column(ForeignKey("rolak.id_rol"), nullable=False)
    
class Takillak(Base):
    __tablename__ = "takillak"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    izena: Mapped[str] = mapped_column(String(200), nullable=False)
    helbidea: Mapped[str] = mapped_column(String(250), nullable=False)
    irudia: Mapped[str] = mapped_column(String(500), nullable=False)
    egoera: Mapped[str] = mapped_column(String (50), nullable=False)
    
class Postuak(Base):
    __tablename__ = "postuak"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    id_takilla: Mapped[int] = mapped_column(ForeignKey("takillak.id_takilla"), nullable=False)
    egoera: Mapped[str] = mapped_column(String(50), nullable=False)
    
class Powerbank(Base):
    __tablename__ = "powerbank"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    id_postu: Mapped[int] = mapped_column(ForeignKey("postuak.id_postu"), nullable=False, unique=True)
    id_takilla: Mapped[int] = mapped_column(ForeignKey("takillak.id_takilla"), nullable=False)
    karga: Mapped[int] = mapped_column(Integer, CheckConstraint("karga >= 0 AND karga <= 100")) 
    
class Erreserbak(Base):
    __tablename__ = "erreserbak"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    id_erab: Mapped[int] = mapped_column(ForeignKey("erabiltzaileak.id_erab"), nullable=False)
    id_power: Mapped[int] = mapped_column(ForeignKey("powerbank.id_power"), nullable=False)
    erreserba_hasiera: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    erreserba_bukaera: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    erabilera_hasiera: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    erabilera_bukaera: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    id_hasiera_takilla: Mapped[int] = mapped_column(ForeignKey("takillak.id_takilla"), nullable=False)
    id_bukaera_takilla: Mapped[int] = mapped_column(ForeignKey("takillak.id_takilla"), nullable=True)
    id_hasiera_postua: Mapped[int] = mapped_column(ForeignKey("postuak.id_postu"), nullable=False)
    id_bukaera_postua: Mapped[int] = mapped_column(ForeignKey("postuak.id_postu"), nullable=True)
    egoera: Mapped[str] = mapped_column(String(50), nullable=False)
    