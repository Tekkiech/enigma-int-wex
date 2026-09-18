# Runs the whole thing in order: sets up the database, makes up some
# fake shoppers for the /metrics dashboard, then starts the server.
#
#   python run.py

import subprocess
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).parent


def run(script):
    result = subprocess.run([sys.executable, str(script)], cwd=SERVER_DIR)
    if result.returncode != 0:
        sys.exit(result.returncode)


if __name__ == "__main__":
    run(SERVER_DIR / "seed.py")
    run(SERVER_DIR / "generate_fake_shoppers.py")
    run(SERVER_DIR / "app.py")
