import psycopg

URL ="postgresql://postgres:postgres@localhost:5432/powerbank_erreserba"

def get_connection():
    return psycopg.connect(URL)

def get_all_participants():
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM erabiltzaileak")
        return cur.fetchall()