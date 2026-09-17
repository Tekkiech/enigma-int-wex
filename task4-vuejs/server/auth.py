"""Password hashing, signup strength rules, login lockout, and the
session-based login guard - signup and login deliberately enforce
different things. Signup owns password quality (nothing to check that
against yet); login owns brute-force resistance (a password to check
attempts against).

No pepper here on purpose - see the README for why. bcrypt's own salt is
enough for this project, and a pepper only earns its complexity when the
database and the app server are separate trust boundaries.
"""

import re
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
from flask import jsonify, session

MIN_PASSWORD_LENGTH = 8
LOCKOUT_THRESHOLD = 5  # failed attempts before a lockout kicks in
LOCKOUT_MINUTES = 15


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), password_hash.encode("utf-8"))


# A fixed hash to check a login attempt against when the email doesn't
# match any user, so that path still does real bcrypt work instead of
# returning early - the timing difference between "no such email" and
# "wrong password" is a real user-enumeration side channel otherwise.
# Computed once, not per request; there's nothing to decrypt back out of
# it, it exists purely to give bcrypt.checkpw something to chew on.
_DUMMY_PASSWORD_HASH = hash_password("not-a-real-password")


def verify_login(plain: str, user) -> bool:
    """verify_password against the real user, or against the dummy hash
    if user is None - same bcrypt cost either way."""
    return verify_password(plain, user.password_hash if user else _DUMMY_PASSWORD_HASH)


def password_requirement_errors(password: str) -> list[str]:
    """What's wrong with a candidate signup password, if anything - a
    login attempt never calls this, a wrong-but-otherwise-valid-shaped
    password there is a lockout-counter problem, not a quality one."""
    errors = []
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(f"at least {MIN_PASSWORD_LENGTH} characters")
    if not re.search(r"[a-zA-Z]", password):
        errors.append("at least one letter")
    if not re.search(r"\d", password):
        errors.append("at least one number")
    return errors


def register_failed_login(user) -> None:
    user.failed_login_attempts += 1
    if user.failed_login_attempts >= LOCKOUT_THRESHOLD:
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)


def register_successful_login(user) -> None:
    user.failed_login_attempts = 0
    user.locked_until = None


def lockout_seconds_remaining(user) -> int:
    """0 if not locked; otherwise how much longer the lockout has to run."""
    if not user.locked_until:
        return 0
    locked_until = user.locked_until
    if locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=timezone.utc)
    remaining = (locked_until - datetime.now(timezone.utc)).total_seconds()
    return max(0, int(remaining))


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            return jsonify(error="Not signed in."), 401
        return view(*args, **kwargs)

    return wrapped
