from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Erabiltzailea(Base):
    __tablename__ = "erabiltzaileak"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    nan: Mapped[str] = mapped_column(String(9))