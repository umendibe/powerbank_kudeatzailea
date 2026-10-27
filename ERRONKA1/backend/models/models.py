from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from database.database import Base


class Erreserbak(Base):
    __tablename__ = "erreserbak"

    id_erreserba = Column(Integer, primary_key=True, index=True)
    id_erab = Column(Integer, nullable=False)
    id_power = Column(Integer, nullable=False)
    erreserba_hasiera =  Column(DateTime, nullable=False)
    erreserba_bukaera = Column(DateTime, nullable=False)
    id_hasiera_takilla = Column(Integer, nullable=False)
    id_hasiera_postua = Column(Integer, nullable=False)
    egoera = Column(String, default="aktiboa", nullable=False)


class Postuak(Base):
    __tablename__ = "postuak"

    id_postu = Column(Integer, primary_key=True, index=True)
    izena = Column(String, nullable=False)
    egoera = Column(String, default="aktiboa", nullable=False)
    id_taula = Column(Integer, nullable=False)


class Erabiltzaileak(Base):
    __tablename__ = "erabiltzaileak"

    id_erab = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    pasahitza = Column(String, nullable=False)
    izena  =  Column(String, nullable=False)
    aktibo = Column(Boolean, default=True)
