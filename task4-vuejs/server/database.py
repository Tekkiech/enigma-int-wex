# Sets up the database connection. Uses tekkiech.db by default, or
# wherever DB_PATH points to.

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DB_PATH = os.environ.get("DB_PATH", str(Path(__file__).parent / "tekkiech.db"))

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
