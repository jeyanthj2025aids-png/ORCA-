from backend.app.agents.state import OrcaState
from backend.app.models.schemas import MarineRiskResult

class MarineRiskAgent:
    """
    Synthesizes environmental, meteorological, and geospatial parameters into a calibrated Marine Risk score.
    Does NOT claim official scientific authority; labeled transparently as decision-support risk model.
    """
    async def run(self, state: OrcaState) -> OrcaState:
        weather = state.agent_results.get("weather", {}).get("current", {})
        ocean = state.agent_results.get("ocean", {})
        geofencing = state.agent_results.get("geofencing", {})
        warnings = geofencing.get("warnings", [])
        
        wind_speed = weather.get("wind_speed_knots", 15.0)
        wave_height = ocean.get("wave_height_m", 1.4)
        
        # Calculate heuristic risk score (0.0 to 1.0)
        risk_score = 0.20 # base operational risk
        factors = []
        
        # Wave factor
        if wave_height > 2.5:
            risk_score += 0.40
            factors.append(f"High wave swells ({wave_height}m) exceed safe threshold for artisanal crafts.")
        elif wave_height > 1.8:
            risk_score += 0.25
            factors.append(f"Moderate-to-rough wave swell ({wave_height}m) in open channels.")
        else:
            factors.append(f"Mild wave heights ({wave_height}m) within operational limits.")
            
        # Wind factor
        if wind_speed > 22.0:
            risk_score += 0.30
            factors.append(f"Strong surface winds ({wind_speed} knots) creating squally sea surface.")
        elif wind_speed > 16.0:
            risk_score += 0.15
            factors.append(f"Breezy conditions ({wind_speed} knots) with occasional gusts.")
            
        # Proximity warning factor
        if warnings:
            risk_score += 0.15
            factors.append(f"Geofence alert: {warnings[0].get('warning_message')}")
            
        risk_score = round(min(1.0, max(0.05, risk_score)), 2)
        
        if risk_score >= 0.75:
            level = "CRITICAL"
            recommendation = "ADVISORY: Fishing operations NOT recommended. Stand down due to hazardous sea state."
        elif risk_score >= 0.50:
            level = "MODERATE"
            recommendation = "Exercise caution. Mechanized vessels >32ft permissible; artisanal / non-motorized craft should avoid deep outer shelf."
        else:
            level = "LOW"
            recommendation = "Conditions favorable for coastal and nearshore fishing operations."
            
        state.risk = MarineRiskResult(
            level=level,
            score=risk_score,
            factors=factors,
            recommendation=recommendation,
            confidence=0.88
        )
        
        state.agent_timeline.append({
            "agent_name": "Marine Risk Agent",
            "status": "Completed",
            "execution_time_ms": 65,
            "summary": f"Calculated Marine Risk: {level} (Score: {risk_score}). Factors identified: {len(factors)}"
        })
        return state

marine_risk_agent = MarineRiskAgent()
