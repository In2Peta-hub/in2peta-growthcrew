import logging
import os
import threading
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import CONFIG
from growthcrew import finder
from growthcrew.errors import GrowthcrewError
from routers.studio_router import router as studio_router
from routers.growthcrew_router import router as growthcrew_router
from routers.finder_router import router as finder_router

logger = logging.getLogger("growthcrew.main")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    startup_tasks()
    yield


app = FastAPI(
    title="GrowthCrew API",
    description=(
        "Unified backend for GrowthCrew Social Studio (AI captions, S3 media, "
        "multi-channel publishing) and GrowthCrew Outreach (lead search, cold "
        "email, replies)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Both product surfaces are served by this single app: the social studio under
# /api, the outreach / lead-generation API under /api/growthcrew, and the lead
# finder under /api/finder.
app.include_router(studio_router)
app.include_router(growthcrew_router)
app.include_router(finder_router)

# Mount static formatted_media folder for high-res padded Instagram photos
MEDIA_DIR = os.path.join(os.path.dirname(__file__), "formatted_media")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


# --- Unified error envelope -------------------------------------------------
# Every surface returns {"error", "code", "detail"} so the React client can
# read a single shape regardless of whether the studio or outreach router raised.

@app.exception_handler(GrowthcrewError)
async def growthcrew_error_handler(_request: Request, exc: GrowthcrewError):
    return JSONResponse(
        status_code=exc.status,
        content={"error": str(exc), "code": exc.code, "detail": str(exc)},
    )


@app.exception_handler(HTTPException)
async def http_error_handler(_request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, str):
        message = detail
    elif isinstance(detail, dict):
        message = detail.get("error") or detail.get("detail") or "Request failed"
    else:
        message = "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": message, "code": "HTTP_ERROR", "detail": detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation error",
            "code": "VALIDATION_ERROR",
            "detail": jsonable_encoder(exc.errors()),
        },
    )


@app.get("/")
async def root():
    return {
        "service": "GrowthCrew API",
        "status": "online",
        "framework": "FastAPI (Python)",
        "surfaces": {"social_studio": "/api", "outreach": "/api/growthcrew", "lead_finder": "/api/finder"},
        "documentation": "/docs",
    }


def _warm_lead_database() -> None:
    """Open the MotherDuck connection off the request path.

    The first query pays a ~16s connection warm-up; doing it in a daemon thread
    at startup keeps the first preview responsive.
    """

    def warm() -> None:
        try:
            from growthcrew import leadsdb

            if not leadsdb.is_configured():
                return
            leadsdb._connection()
            logger.info("Lead database connection warmed")
        except Exception as error:  # noqa: BLE001 - warm-up is best effort
            logger.warning("Could not warm the lead database connection: %s", error)

    threading.Thread(target=warm, name="motherduck-warmup", daemon=True).start()


def startup_tasks() -> None:
    _warm_lead_database()
    if (CONFIG.FINDER_SCHEDULER or "").strip().lower() in {"1", "true", "yes", "on"}:
        finder.start_scheduler()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=CONFIG.PORT, reload=True)
