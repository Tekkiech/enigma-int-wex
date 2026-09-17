"""Engine and session setup. A single SQLite file on disk - see the DB_PATH
env var if you want it somewhere other than this directory (e.g. once this
moves to the homelab, pointed at /mnt/storage)."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DB_PATH = os.environ.get("DB_PATH", str(Path(__file__).parent / "tekkiech.db"))

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
