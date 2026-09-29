import math
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from backend.app.core.config import settings

# Engine configuration
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Spatial calculation helpers (Haversine & Ray Casting for Point-in-Polygon)
def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> dict[str, float]:
    """
    Computes precise great-circle distance between two marine coordinates.
    Returns distance in nautical miles (NM) and kilometers (km).
    """
    R_KM = 6371.0
    R_NM = 3440.065
    
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    km = R_KM * c
    nm = R_NM * c
    return {"km": round(km, 2), "nm": round(nm, 2)}

def is_point_in_polygon(lat: float, lon: float, polygon_coords: list[list[float]]) -> bool:
    """
    Deterministic ray casting algorithm to check if point (lat, lon) is within polygon vertices [[lon, lat], ...].
    """
    n = len(polygon_coords)
    inside = False
    p1x, p1y = polygon_coords[0][0], polygon_coords[0][1]
    for i in range(n + 1):
        p2x, p2y = polygon_coords[i % n][0], polygon_coords[i % n][1]
        if min(p1y, p2y) < lat <= max(p1y, p2y):
            if lon <= max(p1x, p2x):
                if p1y != p2y:
                    xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                if p1x == p2x or lon <= xinters:
                    inside = not inside
        p1x, p1y = p2x, p2y
    return inside
