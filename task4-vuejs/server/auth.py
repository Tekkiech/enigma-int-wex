"""Password hashing and the session-based login guard.

No pepper here on purpose - see the README for why. bcrypt's own salt is
enough for this project, and a pepper only earns its complexity when the
database and the app server are separate trust boundaries.
"""

from functools import wraps

import bcrypt
from flask import jsonify, session


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), password_hash.encode("utf-8"))


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            return jsonify(error="Not signed in."), 401
        return view(*args, **kwargs)

    return wrapped
