import asyncio
import json
import logging
from typing import Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from sse_starlette.sse import EventSourceResponse

from backend.app.models.schemas import (
    ChatRequest, FinalMarineResponse, MarineCondition, PFZResult,
    HazardItem, BoundaryItem, RouteResult, Location, EvidenceItem
)
from backend.app.agents.orchestrator import orca_orchestrator
from backend.app.services.unified_marine_layer import marine_knowledge_layer
from backend.app.services.gemini_service import gemini_service
from backend.app.core.config import settings

logger = logging.getLogger("orca.api")
router = APIRouter(prefix="/api")

# In-memory storage for conversations & reports
conversations_db: dict[str, list[dict[str, Any]]] = {
    "default-session": []
}
reports_db: dict[str, dict[str, Any]] = {}

@router.get("/health", summary="API Health Check")
async def health_check():
    return {
        "status": "healthy",
        "service": "ORCA Marine Intelligence API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

@router.get("/system/status", summary="Detailed Subsystem Status")
async def system_status():
    return {
        "gemini_api": {
            "status": "Operational" if gemini_service.is_operational else "Offline / Simulation",
            "model": settings.GEMINI_MODEL,
            "reasoning_model": settings.GEMINI_REASONING_MODEL
        },
        "database": {
            "status": "Operational",
            "backend": "SQLite / Spatial Math (PostGIS compatible)" if "sqlite" in settings.DATABASE_URL else "PostgreSQL / PostGIS",
        },
        "marine_data": {
            "status": "Demo Mode (Simulated Provider Schema)" if settings.DEMO_MODE else "Live Data Connected",
            "active_satellites": ["Oceansat-3 / EOS-06", "INSAT-3DR"],
            "disclaimer": "SIMULATED DATA FOR DEMONSTRATION"
        },
        "map_engine": {
            "status": "Operational",
            "provider": settings.MAP_PROVIDER
        },
        "agents": {
            "total_agents": 12,
            "status": "Ready",
            "orchestrator": "OrcaOrchestrator (Dynamic Task Decomposition)"
        }
    }

@router.post("/chat", response_model=FinalMarineResponse, summary="Conversational Ocean Copilot")
async def chat_interaction(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    try:
        response = await orca_orchestrator.process_query(
            query=req.message,
            user_context=req.context,
            language=req.language
        )
        
        # Save to conversation memory
        conv_id = req.conversation_id or "default-session"
        if conv_id not in conversations_db:
            conversations_db[conv_id] = []
        conversations_db[conv_id].append({"sender": "user", "text": req.message, "time": datetime.now(timezone.utc).isoformat()})
        conversations_db[conv_id].append({"sender": "orca", "response": response.model_dump(), "time": datetime.now(timezone.utc).isoformat()})
        
        return response
    except Exception as e:
        logger.error(f"Chat execution error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Marine Copilot encountered an error: {str(e)}")

@router.post("/chat/stream", summary="Streaming Ocean Copilot Events via SSE")
async def chat_stream(req: ChatRequest):
    async def event_generator():
        yield {"event": "step", "data": json.dumps({"step": "Understanding query & detecting language...", "progress": 15})}
        await asyncio.sleep(0.3)
        
        yield {"event": "step", "data": json.dumps({"step": "Decomposing into specialized marine agent tasks...", "progress": 35})}
        await asyncio.sleep(0.3)
        
        yield {"event": "step", "data": json.dumps({"step": "Retrieving oceanographic & weather observations in parallel...", "progress": 60})}
        
        # Execute orchestrator
        response = await orca_orchestrator.process_query(
            query=req.message,
            user_context=req.context,
            language=req.language
        )
        
        yield {"event": "step", "data": json.dumps({"step": "Evaluating marine risk & spatial geofences...", "progress": 85})}
        await asyncio.sleep(0.2)
        
        yield {"event": "step", "data": json.dumps({"step": "Synthesizing evidence-backed marine advisory...", "progress": 98})}
        await asyncio.sleep(0.2)
        
        yield {"event": "final_response", "data": json.dumps(response.model_dump())}

    return EventSourceResponse(event_generator())

@router.post("/analyze/marine", summary="Direct Marine Analysis API")
async def analyze_marine(lat: float = 9.2876, lon: float = 79.3129, query: str = "Analyze marine safety"):
    response = await orca_orchestrator.process_query(
        query=f"{query} at coordinates {lat}, {lon}"
    )
    return response

@router.get("/ocean/conditions", response_model=MarineCondition, summary="Current Ocean State")
async def get_ocean_conditions(lat: float = 9.2876, lon: float = 79.3129):
    return await marine_knowledge_layer.get_ocean_conditions(lat, lon)

@router.get("/weather", summary="Marine Weather Forecast")
async def get_weather(lat: float = 9.2876, lon: float = 79.3129):
    current = await marine_knowledge_layer.get_weather(lat, lon)
    forecast = await marine_knowledge_layer.weather_provider.get_marine_forecast(lat, lon, hours=24)
    return {"current": current, "forecast_24h": forecast}

@router.get("/tides", summary="Tide Tables & Status")
async def get_tides(lat: float = 9.2876, lon: float = 79.3129):
    return await marine_knowledge_layer.get_tide(lat, lon)

@router.get("/pfz", response_model=list[PFZResult], summary="Potential Fishing Zones")
async def get_pfz(lat: float = 9.2876, lon: float = 79.3129):
    return await marine_knowledge_layer.get_pfz_data(lat, lon)

@router.get("/hazards", response_model=list[HazardItem], summary="Active Ocean Hazards")
async def get_hazards():
    return await marine_knowledge_layer.get_hazards()

@router.get("/boundaries", response_model=list[BoundaryItem], summary="Maritime Boundaries & MPAs")
async def get_boundaries():
    return await marine_knowledge_layer.get_boundaries()

@router.get("/map/layers", summary="Aggregated GIS Map Layers")
async def get_map_layers(lat: float = 9.2876, lon: float = 79.3129):
    ocean = await marine_knowledge_layer.get_ocean_conditions(lat, lon)
    pfz = await marine_knowledge_layer.get_pfz_data(lat, lon)
    hazards = await marine_knowledge_layer.get_hazards()
    boundaries = await marine_knowledge_layer.get_boundaries()
    
    return {
        "timestamp": ocean.timestamp,
        "layers": {
            "sst": {"value": ocean.sst_celsius, "unit": "°C"},
            "wave_height": {"value": ocean.wave_height_m, "unit": "m"},
            "pfz": [p.model_dump() for p in pfz],
            "hazards": [h.model_dump() for h in hazards],
            "boundaries": [b.model_dump() for b in boundaries],
            "vessels": [
                {"id": "VES-01", "name": "Tamil Meen-4", "lat": 9.301, "lon": 79.335, "speed_knots": 8.2, "status": "Fishing"},
                {"id": "VES-02", "name": "Kadal Kural", "lat": 9.275, "lon": 79.290, "speed_knots": 0.5, "status": "Trawling"}
            ]
        }
    }

@router.post("/route", response_model=RouteResult, summary="Calculate Safe Navigation Route")
async def compute_safe_route(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float, origin_name: str = "Harbor", dest_name: str = "Target Zone"):
    origin = Location(name=origin_name, lat=origin_lat, lon=origin_lon)
    dest = Location(name=dest_name, lat=dest_lat, lon=dest_lon)
    return await marine_knowledge_layer.calculate_safe_route(origin, dest)

@router.get("/search", summary="Semantic Vector Search for Marine Research")
async def semantic_search(query: str = Query(..., min_length=2)):
    return await marine_knowledge_layer.semantic_search(query)

@router.get("/conversations", summary="List Chat Conversations")
async def list_conversations():
    return [{"id": k, "message_count": len(v)} for k, v in conversations_db.items()]

@router.post("/reports", summary="Generate Comprehensive Marine Intelligence Report")
async def generate_report(payload: dict[str, Any]):
    report_id = f"ORCA-REP-{int(datetime.now(timezone.utc).timestamp())}"
    report_data = {
        "report_id": report_id,
        "title": payload.get("title", "ORCA Marine Intelligence Assessment Report"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "location": payload.get("location", "Rameswaram Coastal Waters"),
        "parameters": payload.get("parameters", {}),
        "risk_level": payload.get("risk_level", "MODERATE"),
        "recommendations": payload.get("recommendations", []),
        "evidence": payload.get("evidence", []),
        "disclaimer": "SIMULATED DATA FOR DEMONSTRATION: Created under SIH26176 / ISRO-NRSC guidelines."
    }
    reports_db[report_id] = report_data
    return report_data

@router.get("/reports/{report_id}", summary="Retrieve Marine Report")
async def get_report(report_id: str):
    if report_id not in reports_db:
        raise HTTPException(status_code=404, detail="Report not found")
    return reports_db[report_id]
