import asyncio
import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_system_status():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/system/status")
        assert res.status_code == 200
        data = res.json()
        assert "gemini_api" in data
        assert "marine_data" in data

@pytest.mark.asyncio
async def test_ocean_and_pfz():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        ocean = await ac.get("/api/ocean/conditions")
        assert ocean.status_code == 200
        assert ocean.json()["wave_height_m"] > 0
        
        pfz = await ac.get("/api/pfz")
        assert pfz.status_code == 200
        assert len(pfz.json()) > 0

@pytest.mark.asyncio
async def test_chat_workflow_fishing_safety():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/chat", json={
            "message": "Is it safe to go fishing tomorrow morning from my current location?",
            "conversation_id": "test-session"
        })
        assert res.status_code == 200
        data = res.json()
        assert "answer" in data
        assert "risk" in data
        assert data["risk"]["level"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")
        assert len(data["evidence"]) >= 2
        assert len(data["agent_timeline"]) >= 4

@pytest.mark.asyncio
async def test_chat_workflow_tamil():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/chat", json={
            "message": "நாளை காலை இங்கிருந்து மீன்பிடிக்க கடலுக்கு செல்லலாமா?",
            "conversation_id": "test-tamil-session"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["language"] == "ta"
        assert len(data["evidence"]) >= 2

@pytest.mark.asyncio
async def test_route_optimization():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/route", params={
            "origin_lat": 9.2876,
            "origin_lon": 79.3129,
            "dest_lat": 9.3250,
            "dest_lon": 79.4680,
            "origin_name": "Rameswaram Harbor",
            "dest_name": "Rameswaram East Outer Bank"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["distance_nm"] > 0
        assert len(data["waypoints"]) >= 2
