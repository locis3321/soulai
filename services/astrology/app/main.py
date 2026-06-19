from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.api import astrology, bazi, numerology, ziwei

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="SoulAI Astrology Service",
    description="Astrology and divination calculation service",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(astrology.router, prefix="/api/astrology", tags=["astrology"])
app.include_router(bazi.router, prefix="/api/bazi", tags=["bazi"])
app.include_router(numerology.router, prefix="/api/numerology", tags=["numerology"])
app.include_router(ziwei.router, prefix="/api/ziwei", tags=["ziwei"])


@app.get("/")
async def root():
    return {
        "service": "SoulAI Astrology Service",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
