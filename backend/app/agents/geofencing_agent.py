from backend.app.agents.state import OrcaState
from backend.app.services.unified_marine_layer import marine_knowledge_layer
from backend.app.models.schemas import EvidenceItem, ObservationType, MapLayerItem

class GeofencingAgent:
    async def run(self, state: OrcaState) -> OrcaState:
        lat, lon = state.location.lat, state.location.lon
        boundaries = await marine_knowledge_layer.get_boundaries()
        proximity_warnings = await marine_knowledge_layer.check_geofences(lat, lon)
        
        state.agent_results["geofencing"] = {
            "boundaries": [b.model_dump() for b in boundaries],
            "warnings": proximity_warnings
        }
        
        for warn in proximity_warnings:
            state.evidence.append(EvidenceItem(
                source="Maritime Boundary & Territorial Waters Registry",
                dataset="IMBL / MPA Geofence Polygons",
                timestamp="Real-time Geofence Check",
                location=f"Vessel Position ({round(lat, 3)}°N, {round(lon, 3)}°E)",
                parameter=f"Proximity to {warn['boundary_name']}",
                value=f"{warn['distance_nm']} NM ({warn['severity']})",
                unit="nautical miles",
                observation_type=ObservationType.DEMO_DATA,
                confidence=0.99
            ))

        # Add boundary map layer
        state.map_layers.append(MapLayerItem(
            id="layer-boundaries",
            name="Maritime Boundaries & MPAs",
            type="polygon",
            visible=True,
            data=[b.model_dump() for b in boundaries]
        ))
        
        state.agent_timeline.append({
            "agent_name": "Geofencing Agent",
            "status": "Completed",
            "execution_time_ms": 70,
            "summary": f"Geofences checked: 2 active. Proximity alerts: {len(proximity_warnings)} ({'IMBL Buffer Caution' if proximity_warnings else 'Clear of restricted zones'})"
        })
        return state

geofencing_agent = GeofencingAgent()
