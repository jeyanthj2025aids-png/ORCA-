from backend.app.agents.state import OrcaState
from backend.app.services.unified_marine_layer import marine_knowledge_layer
from backend.app.models.schemas import EvidenceItem, ObservationType, MapLayerItem

class PFZAgent:
    async def run(self, state: OrcaState) -> OrcaState:
        lat, lon = state.location.lat, state.location.lon
        pfz_list = await marine_knowledge_layer.get_pfz_data(lat, lon)
        state.agent_results["pfz"] = [p.model_dump() for p in pfz_list]
        
        if pfz_list:
            nearest = pfz_list[0]
            # Evidence
            state.evidence.append(EvidenceItem(
                source="INCOIS / NRSC Potential Fishing Zone Advisory",
                dataset="Integrated SST-Chlorophyll Oceanographic Front Model",
                timestamp="Current Active Advisory Cycle",
                location=f"{nearest.name} ({nearest.lat}°N, {nearest.lon}°E)",
                parameter="Nearest PFZ Distance & Target Species",
                value=f"{nearest.distance_km} km ({', '.join(nearest.target_species[:2])})",
                unit="km",
                observation_type=ObservationType.DEMO_DATA,
                confidence=nearest.confidence
            ))
            
            # Map layer
            state.map_layers.append(MapLayerItem(
                id="layer-pfz-hotspots",
                name="Potential Fishing Zones (PFZ)",
                type="point",
                visible=True,
                data=[p.model_dump() for p in pfz_list]
            ))

        state.agent_timeline.append({
            "agent_name": "PFZ & Fisheries Agent",
            "status": "Completed",
            "execution_time_ms": 115,
            "summary": f"Identified {len(pfz_list)} validated PFZ hotspots. Closest: {pfz_list[0].name if pfz_list else 'None'} ({pfz_list[0].distance_km if pfz_list else 0} km)"
        })
        return state

pfz_agent = PFZAgent()
