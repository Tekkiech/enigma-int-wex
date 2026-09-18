# Runs the whole thing in order: sets up the database, makes up some
# fake shoppers for the /metrics dashboard, then starts the server.
#
#   python run.py

import subprocess
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).parent
ANALYTICS_DIR = SERVER_DIR.parent / "analytics"


def run(script, cwd):
    result = subprocess.run([sys.executable, str(script)], cwd=cwd)
    if result.returncode != 0:
        sys.exit(result.returncode)


if __name__ == "__main__":
    run(SERVER_DIR / "seed.py", cwd=SERVER_DIR)
    run(ANALYTICS_DIR / "generate.py", cwd=ANALYTICS_DIR)
    run(SERVER_DIR / "app.py", cwd=SERVER_DIR)
