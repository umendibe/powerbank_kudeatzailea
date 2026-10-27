import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

URL ="postgresql://postgres:postgres@localhost:5432/powerbank_erreserba"

engine = create_engine(
    URL,
    echo=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_connection():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# def get_all_participants():
#     with get_connection() as conn, conn.cursor() as cur:
#         cur.execute("SELECT * FROM erabiltzaileak")
#         return cur.fetchall()