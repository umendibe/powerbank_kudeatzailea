"""Migrazioa: udalerri anitzeko sistema eta kargaguneen geokokapena.

Erabilera (backend karpetatik):
    .\\.venv\\Scripts\\python.exe migrations\\001_multiudalerria.py
"""

import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database.database import engine


DEFAULT_MUNICIPALITY = "Lehenetsia"


def main() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS udalerriak (
                    id_udalerria SERIAL PRIMARY KEY,
                    izena VARCHAR(120) NOT NULL UNIQUE,
                    activo BOOLEAN NOT NULL DEFAULT TRUE
                )
                """
            )
        )

        connection.execute(
            text(
                """
                INSERT INTO udalerriak (izena, activo)
                VALUES (:izena, TRUE)
                ON CONFLICT (izena) DO NOTHING
                """
            ),
            {"izena": DEFAULT_MUNICIPALITY},
        )

        default_id = connection.execute(
            text("SELECT id_udalerria FROM udalerriak WHERE izena = :izena"),
            {"izena": DEFAULT_MUNICIPALITY},
        ).scalar_one()

        connection.execute(
            text("ALTER TABLE takillak ADD COLUMN IF NOT EXISTS id_udalerria INTEGER")
        )
        connection.execute(
            text("ALTER TABLE takillak ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION")
        )
        connection.execute(
            text("ALTER TABLE takillak ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION")
        )
        connection.execute(
            text("ALTER TABLE takillak ADD COLUMN IF NOT EXISTS deskribapena VARCHAR(300)")
        )
        connection.execute(
            text("UPDATE takillak SET id_udalerria = :id WHERE id_udalerria IS NULL"),
            {"id": default_id},
        )
        connection.execute(
            text("ALTER TABLE takillak ALTER COLUMN id_udalerria SET NOT NULL")
        )

        connection.execute(
            text("ALTER TABLE erabiltzaileak ADD COLUMN IF NOT EXISTS id_udalerria INTEGER")
        )

        connection.execute(
            text(
                """
                INSERT INTO rolak (id_rol, rol_izena)
                VALUES (3, 'Udalerriko administratzailea')
                ON CONFLICT (id_rol) DO NOTHING
                """
            )
        )

        connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'fk_takillak_udalerria'
                    ) THEN
                        ALTER TABLE takillak
                        ADD CONSTRAINT fk_takillak_udalerria
                        FOREIGN KEY (id_udalerria)
                        REFERENCES udalerriak(id_udalerria);
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'fk_erabiltzaileak_udalerria'
                    ) THEN
                        ALTER TABLE erabiltzaileak
                        ADD CONSTRAINT fk_erabiltzaileak_udalerria
                        FOREIGN KEY (id_udalerria)
                        REFERENCES udalerriak(id_udalerria);
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'fk_auth_sessions_erabiltzailea'
                    ) THEN
                        ALTER TABLE auth_sessions
                        ADD CONSTRAINT fk_auth_sessions_erabiltzailea
                        FOREIGN KEY (user_id)
                        REFERENCES erabiltzaileak(id_erab)
                        ON DELETE CASCADE;
                    END IF;
                END
                $$;
                """
            )
        )

        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_takillak_id_udalerria "
                "ON takillak (id_udalerria)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_auth_sessions_user_id "
                "ON auth_sessions (user_id)"
            )
        )

    print("Migrazioa osatu da.")


if __name__ == "__main__":
    main()
