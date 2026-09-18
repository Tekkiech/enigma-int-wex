# Password hashing, password rules for signup, login lockout, and the
# @login_required decorator.

import re
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
from flask import jsonify, session

MIN_PASSWORD_LENGTH = 8
LOCKOUT_THRESHOLD = 5  # failed attempts before a lockout kicks in
LOCKOUT_MINUTES = 15


def hash_password(plain):
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain, password_hash):
    return bcrypt.checkpw(plain.encode("utf-8"), password_hash.encode("utf-8"))


# A fake hash to check against when someone logs in with an email that
# doesn't exist. Without this, a login for a real email would take
# slightly longer than one for a fake email (because checking a real
# password hash takes time), and that tiny difference could let someone
# guess which emails have accounts. This keeps the timing the same either
# way.
_DUMMY_PASSWORD_HASH = hash_password("not-a-real-password")


def verify_login(plain, user):
    if user:
        return verify_password(plain, user.password_hash)
    return verify_password(plain, _DUMMY_PASSWORD_HASH)


def password_requirement_errors(password):
    # Returns a list of what's wrong with the password, or an empty list
    # if it's fine. Only used for signup - login just checks it's correct.
    errors = []
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(f"at least {MIN_PASSWORD_LENGTH} characters")
    if not re.search(r"[a-zA-Z]", password):
        errors.append("at least one letter")
    if not re.search(r"\d", password):
        errors.append("at least one number")
    return errors


def register_failed_login(user):
    user.failed_login_attempts += 1
    if user.failed_login_attempts >= LOCKOUT_THRESHOLD:
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)


def register_successful_login(user):
    user.failed_login_attempts = 0
    user.locked_until = None


def lockout_seconds_remaining(user):
    # 0 means not locked. Otherwise, how many seconds until they can try again.
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
