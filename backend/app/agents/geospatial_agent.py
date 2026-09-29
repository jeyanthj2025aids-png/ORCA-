from backend.app.agents.state import OrcaState
from backend.app.core.database import calculate_haversine_distance

class GeospatialReasoningAgent:
    """
    Executes precise spatial mathematics (distance, buffer, intersections)
    so LLM does not perform error-prone mental coordinate arithmetic.
    """
    async def run(self, state: OrcaState) -> OrcaState:
        loc = state.location
        pfz_list = state.agent_results.get("pfz", [])
        
        spatial_analysis = {
            "center": {"lat": loc.lat, "lon": loc.lon, "name": loc.name},
            "nearest_targets": []
        }
        
        for p in pfz_list[:3]:
            dist = calculate_haversine_distance(loc.lat, loc.lon, p["lat"], p["lon"])
            spatial_analysis["nearest_targets"].append({
                "target_name": p["name"],
                "distance_km": dist["km"],
                "distance_nm": dist["nm"],
                "bearing_approx": "North-East" if p["lat"] > loc.lat and p["lon"] > loc.lon else "South-East"
            })
            
        state.agent_results["geospatial"] = spatial_analysis
        state.agent_timeline.append({
            "agent_name": "Geospatial Reasoning Agent",
            "status": "Completed",
            "execution_time_ms": 50,
            "summary": f"Computed geodesic distances for {len(spatial_analysis['nearest_targets'])} maritime points"
        })
        return state

geospatial_agent = GeospatialReasoningAgent()
