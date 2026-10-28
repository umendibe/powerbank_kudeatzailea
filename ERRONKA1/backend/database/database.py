from sqlalchemy import create_engine
<<<<<<< HEAD
from sqlalchemy.orm import DeclarativeBase, sessionmaker

URL ="postgresql://postgres:postgres@localhost:5432/powerbank_erreserba"

engine = create_engine(
    URL,
    echo=True,
)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

def get_session():
    with SessionLocal() as session:
        yield session
=======
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "postgresql+psycopg2://postgres:1234@localhost:5432/postgres"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
>>>>>>> master
