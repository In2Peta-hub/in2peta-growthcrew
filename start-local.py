"""Run the local API and client on Linux, macOS, or Windows."""

import argparse
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parent


def backend_python():
    """Prefer the backend or root virtual environment, then the active Python."""
    executable = Path("Scripts/python.exe" if os.name == "nt" else "bin/python")
    for directory in (ROOT / "fastapi-backend/.venv", ROOT / ".venv"):
        candidate = directory / executable
        if candidate.is_file():
            return str(candidate)
    return sys.executable


def start(command, cwd):
    options = (
        {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP}
        if os.name == "nt"
        else {"start_new_session": True}
    )
    return subprocess.Popen(command, cwd=cwd, **options)


def stop(process):
    """Stop the service and its reload/compiler subprocesses."""
    if os.name == "nt":
        if process.poll() is None:
            subprocess.run(
                ["taskkill", "/PID", str(process.pid), "/T", "/F"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
    else:
        # The leader may have exited while its reload worker is still alive.
        try:
            os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            return
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            pass
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    process.wait()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-install", action="store_true", help="Skip bun install")
    args = parser.parse_args()
    bun = shutil.which("bun")
    if not bun:
        print("Bun was not found on PATH. Install Bun before starting.", file=sys.stderr)
        return 1

    python = backend_python()
    backend = ROOT / "fastapi-backend"
    services = []

    def interrupted(_signum, _frame):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, interrupted)
    if os.name == "nt":
        signal.signal(signal.SIGBREAK, interrupted)
    try:
        check = subprocess.run([python, "-c", "import uvicorn"], cwd=backend, check=False)
        if check.returncode:
            print(
                f'Install backend dependencies first: "{python}" -m pip install '
                f'-r "{backend / "requirements.txt"}"',
                file=sys.stderr,
            )
            return 1
        if not args.skip_install:
            subprocess.run([bun, "install", "--frozen-lockfile"], cwd=ROOT, check=True)

        print("Starting GrowthCrew. Press Ctrl+C to stop both services.", flush=True)
        services.append(start([python, "-m", "uvicorn", "main:app", "--port", "3005", "--reload"], backend))
        services.append(start([
            bun, "run", "dev", "--host", "127.0.0.1", "--port", "5173", "--strictPort",
        ], ROOT / "client"))
        print(
            "Frontend: http://localhost:5173\n"
            "Backend:  http://localhost:3005\n"
            "API docs: http://localhost:3005/docs",
            flush=True,
        )
        while True:
            for name, process in zip(("FastAPI", "Vite"), services):
                code = process.poll()
                if code is not None:
                    print(f"{name} exited with code {code}; stopping both services.", file=sys.stderr)
                    return code or 1
            time.sleep(0.2)
    except KeyboardInterrupt:
        print("\nStopping GrowthCrew.", flush=True)
        return 0
    except (OSError, subprocess.CalledProcessError) as error:
        print(f"Could not start GrowthCrew: {error}", file=sys.stderr)
        return 1
    finally:
        # Do not interrupt cleanup on a second Ctrl+C.
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        if os.name == "nt":
            signal.signal(signal.SIGBREAK, signal.SIG_IGN)
        for process in reversed(services):
            stop(process)


if __name__ == "__main__":
    sys.exit(main())
