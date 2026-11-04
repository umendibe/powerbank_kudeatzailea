import base64
import hashlib
import hmac
import os

# Password hash format:
#   scrypt$<n>$<r>$<p>$<salt_base64>$<hash_base64>
#
# hashlib.scrypt comes from Python's standard library, so no external
# hashing dependency is required.
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 32
SCRYPT_SALT_BYTES = 16

HASH_PREFIXES = (
    "scrypt$",
    "$argon2id$",
    "$argon2i$",
    "$argon2d$",
    "$2a$",
    "$2b$",
    "$2y$",
    "$pbkdf2$",
)


def get_password_hash(password: str) -> str:
    """Return a salted scrypt hash for the given plain-text password."""
    salt = os.urandom(SCRYPT_SALT_BYTES)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_DKLEN,
    )
    salt_b64 = base64.b64encode(salt).decode("ascii")
    digest_b64 = base64.b64encode(digest).decode("ascii")
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${salt_b64}${digest_b64}"


def verify_password(plain_password: str, stored_password: str) -> bool:
    """Verify a password against a stored scrypt or bcrypt hash."""
    if not stored_password:
        return False

    if stored_password.startswith("scrypt$"):
        try:
            _, n, r, p, salt_b64, digest_b64 = stored_password.split("$")
            salt = base64.b64decode(salt_b64)
            expected = base64.b64decode(digest_b64)
            candidate = hashlib.scrypt(
                plain_password.encode("utf-8"),
                salt=salt,
                n=int(n),
                r=int(r),
                p=int(p),
                dklen=len(expected),
            )
            return hmac.compare_digest(candidate, expected)
        except (ValueError, TypeError):
            return False

    if stored_password.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            import bcrypt

            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                stored_password.encode("utf-8"),
            )
        except (ImportError, ValueError, TypeError):
            return False

    return False


def is_password_hash(value: str | None) -> bool:
    """Return True when the stored value already looks like a password hash."""
    if not value:
        return False
    return value.startswith(HASH_PREFIXES)
