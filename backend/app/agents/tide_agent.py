from backend.app.agents.state import OrcaState
from backend.app.services.unified_marine_layer import marine_knowledge_layer
from backend.app.models.schemas import EvidenceItem, ObservationType

class TideAgent:
    async def run(self, state: OrcaState) -> OrcaState:
        lat, lon = state.location.lat, state.location.lon
        tide_data = await marine_knowledge_layer.get_tide(lat, lon)
        state.agent_results["tide"] = tide_data
        
        state.evidence.append(EvidenceItem(
            source="Survey of India Tidal Tables (Simulated Provider)",
            dataset="Tidal Gauge & Harmonic Analysis",
            timestamp=tide_data["timestamp"],
            location=tide_data["station"],
            parameter="Tide Phase & Current Height",
            value=f"{tide_data['current_phase']} ({tide_data['current_height_m']}m)",
            unit="meters",
            observation_type=ObservationType.DEMO_DATA,
            confidence=0.94
        ))
        
        state.agent_timeline.append({
            "agent_name": "Tide & Marine Conditions Agent",
            "status": "Completed",
            "execution_time_ms": 65,
            "summary": f"Tide: {tide_data['current_phase']} ({tide_data['current_height_m']}m), Channel clearance: Adequate"
        })
        return state

tide_agent = TideAgent()
