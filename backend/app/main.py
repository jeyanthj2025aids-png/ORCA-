from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "ORCA: Marine EcOsystem Reasoning with Collaborative Agents.\n\n"
        "Department of Space / ISRO & NRSC (Problem Statement: SIH26176).\n"
        "Agentic AI-powered Conversational Marine Intelligence Platform."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(router)

@app.get("/", summary="Root Status")
async def root():
    return {
        "project": "ORCA Marine Intelligence Platform",
        "expansion": "Marine EcOsystem Reasoning with Collaborative Agents",
        "organisation": "ISRO / NRSC, Department of Space",
        "problem_statement": "SIH26176",
        "api_docs": "/docs",
        "demo_mode": settings.DEMO_MODE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
