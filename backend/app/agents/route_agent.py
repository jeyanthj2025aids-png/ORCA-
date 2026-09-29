from backend.app.agents.state import OrcaState
from backend.app.services.unified_marine_layer import marine_knowledge_layer
from backend.app.models.schemas import Location, MapLayerItem

class RouteOptimizationAgent:
    """
    Computes deterministic navigation routes steering clear of restricted boundaries and hazards.
    """
    async def run(self, state: OrcaState) -> OrcaState:
        origin = state.location
        # Default destination: nearest PFZ or coordinates
        pfz_results = state.agent_results.get("pfz", [])
        if pfz_results:
            dest = Location(name=pfz_results[0]["name"], lat=pfz_results[0]["lat"], lon=pfz_results[0]["lon"])
        else:
            dest = Location(name="Designated Fishing Bank", lat=origin.lat + 0.12, lon=origin.lon + 0.08)
            
        route_result = await marine_knowledge_layer.calculate_safe_route(origin, dest)
        state.agent_results["route"] = route_result.model_dump()
        
        state.map_layers.append(MapLayerItem(
            id="layer-safe-route",
            name=f"Safe Route to {dest.name}",
            type="line",
            visible=True,
            data=route_result.model_dump()
        ))
        
        state.agent_timeline.append({
            "agent_name": "Route Optimization Agent",
            "status": "Completed",
            "execution_time_ms": 90,
            "summary": f"Calculated safe corridor ({route_result.distance_nm} NM, ~{route_result.estimated_hours} hrs). Avoided: {', '.join(route_result.hazards_avoided) or 'Direct course'}"
        })
        return state

route_agent = RouteOptimizationAgent()
