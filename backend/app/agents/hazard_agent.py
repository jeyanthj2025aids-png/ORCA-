from backend.app.agents.state import OrcaState
from backend.app.services.unified_marine_layer import marine_knowledge_layer
from backend.app.models.schemas import EvidenceItem, ObservationType, MapLayerItem

class HazardAlertAgent:
    async def run(self, state: OrcaState) -> OrcaState:
        hazards = await marine_knowledge_layer.get_hazards()
        state.agent_results["hazards"] = [h.model_dump() for h in hazards]
        
        for h in hazards:
            state.evidence.append(EvidenceItem(
                source="Joint Marine Disaster Management / IMD Alert Feed",
                dataset="Active Marine Hazard Warnings",
                timestamp="Active Advisory Window",
                location=h.title,
                parameter=f"Hazard Type: {h.type.upper()}",
                value=f"{h.severity} Severity (Radius: {h.affected_radius_km} km)",
                unit="severity",
                observation_type=ObservationType.DEMO_DATA,
                confidence=0.95
            ))
            
        state.map_layers.append(MapLayerItem(
            id="layer-hazards",
            name="Active Marine Hazards",
            type="polygon",
            visible=True,
            data=[h.model_dump() for h in hazards]
        ))
        
        state.agent_timeline.append({
            "agent_name": "Hazard & Proactive Alert Agent",
            "status": "Completed",
            "execution_time_ms": 60,
            "summary": f"Active hazards detected: {len(hazards)} (Pamban Channel high swell & IMBL caution)"
        })
        return state

hazard_agent = HazardAlertAgent()
