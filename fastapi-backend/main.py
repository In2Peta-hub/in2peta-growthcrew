import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import CONFIG
from growthcrew.errors import GrowthcrewError
from routers.studio_router import router as studio_router
from routers.growthcrew_router import router as growthcrew_router

app = FastAPI(
    title="Growthcrew Social Studio API",
    description="FastAPI Backend for Growthcrew AI Content Studio, AWS S3 Media & Multi-Channel Publishing Pipeline",
    version="1.0.0"
)

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# Include Growthcrew Studio Router and the outreach API ported from gpu_platform.
app.include_router(studio_router)
app.include_router(growthcrew_router)

# Mount static formatted_media folder for high-res padded Instagram photos
MEDIA_DIR = os.path.join(os.path.dirname(__file__), "formatted_media")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


@app.exception_handler(GrowthcrewError)
async def growthcrew_error_handler(_request: Request, exc: GrowthcrewError):
    return JSONResponse(status_code=exc.status, content={"error": str(exc), "code": exc.code})

@app.get("/")
async def root():
    return {
        "service": "Growthcrew Social Studio API",
        "status": "online",
        "framework": "FastAPI (Python)",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=CONFIG.PORT, reload=True)
