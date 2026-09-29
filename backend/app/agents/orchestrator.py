import asyncio
import logging
import time
from datetime import datetime, timezone
from backend.app.agents.state import OrcaState
from backend.app.agents.intent_agent import intent_agent
from backend.app.agents.task_planner import task_planner_agent
from backend.app.agents.weather_agent import weather_agent
from backend.app.agents.ocean_agent import ocean_agent
from backend.app.agents.tide_agent import tide_agent
from backend.app.agents.satellite_eo_agent import satellite_eo_agent
from backend.app.agents.pfz_agent import pfz_agent
from backend.app.agents.geofencing_agent import geofencing_agent
from backend.app.agents.hazard_agent import hazard_agent
from backend.app.agents.marine_risk_agent import marine_risk_agent
from backend.app.agents.route_agent import route_agent
from backend.app.agents.geospatial_agent import geospatial_agent
from backend.app.services.unified_marine_layer import marine_knowledge_layer
from backend.app.services.gemini_service import gemini_service
from backend.app.models.schemas import FinalMarineResponse, ObservationType, EvidenceItem

logger = logging.getLogger("orca.orchestrator")

SYNTHESIS_SYSTEM_PROMPT = """You are ORCA's Final Marine Intelligence Response Synthesizer (SIH26176 / ISRO-NRSC Marine Platform).
Your responsibility is to produce high-integrity, evidence-backed marine advisory decisions.

CRITICAL OPERATIONAL RULES:
1. Respond in the EXACT language requested or detected (e.g. Tamil if detected 'ta', Hindi if 'hi', English if 'en').
2. Technical numbers, coordinates, knot speeds, wave heights in meters, and Celsius temperatures must remain numerically exact.
3. If query asks about fish decline or research trends:
   - EXPLICITLY DISTINGUISH CORRELATION FROM CAUSATION.
   - Mention that while rising SST correlates with pelagic catch variations, causation is multi-factorial (monsoon timing, trawling pressure, deeper migration).
4. For marine safety: State clearly that this is decision-support guidance. Use phrases like "Based on current observations...", "Exercise caution...".
5. Never invent or hallucinate unprovided sensor readings.
6. Clearly state data source and timestamp."""

class OrcaOrchestrator:
    """
    Multi-Agent Collaborative Orchestrator for ORCA Marine Intelligence.
    Coordinates intent detection, dynamic task planning, concurrent agent retrieval,
    risk evaluation, and Gemini evidence synthesis.
    """
    async def process_query(self, query: str, user_context: dict = None, language: str = None) -> FinalMarineResponse:
        start_wall_time = time.time()
        
        # 1. Initialize State
        state = OrcaState(
            query=query,
            user_context=user_context or {},
            data_timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        )
        if language:
            state.language = language

        # 2. Run Intent & Language Agent
        state = await intent_agent.run(state)

        # 3. Run Task Planner
        state = await task_planner_agent.run(state)
        tasks = state.tasks.tasks if state.tasks else []
        agent_names = {t.agent for t in tasks}

        # 4. Execute Independent Domain Agents in Parallel (Priority 1)
        parallel_coros = []
        if "weather" in agent_names:
            parallel_coros.append(weather_agent.run(state))
        if "ocean" in agent_names:
            parallel_coros.append(ocean_agent.run(state))
        if "tide" in agent_names:
            parallel_coros.append(tide_agent.run(state))
        if "satellite_eo" in agent_names:
            parallel_coros.append(satellite_eo_agent.run(state))
        if "hazard" in agent_names:
            parallel_coros.append(hazard_agent.run(state))
        if "fisheries" in agent_names:
            parallel_coros.append(pfz_agent.run(state))
        if "geofence" in agent_names:
            parallel_coros.append(geofencing_agent.run(state))
        if "historical" in agent_names:
            async def run_historical():
                trends = await marine_knowledge_layer.get_historical_trends(state.location.name, years=2)
                state.agent_results["historical"] = trends
                state.evidence.append(EvidenceItem(
                    source=trends["source"],
                    dataset="Historical Marine Ecosystem Reanalysis",
                    timestamp="2024-2026 Analysis Cycle",
                    location=state.location.name,
                    parameter="SST & Pelagic Catch Correlation",
                    value=f"r = -0.68 (SST {trends['sst_trend']['change_celsius']}, Pelagic Catch {trends['fisheries_productivity_trend']['pelagic_catch_change_percent']})",
                    unit="correlation index",
                    observation_type=ObservationType.CORRELATION,
                    confidence=0.89
                ))
                state.agent_timeline.append({
                    "agent_name": "Historical Trend Agent",
                    "status": "Completed",
                    "execution_time_ms": 70,
                    "summary": f"Retrieved multi-year oceanographic reanalysis for {state.location.name}"
                })
            parallel_coros.append(run_historical())

        if parallel_coros:
            await asyncio.gather(*parallel_coros)

        # 5. Execute Dependent Agents (Priority 2: Geospatial & Route)
        if "geospatial" in agent_names:
            state = await geospatial_agent.run(state)
        if "route" in agent_names:
            state = await route_agent.run(state)

        # 6. Execute Marine Risk Agent (Priority 3: Synthesizes Weather, Waves, Geofences)
        if "risk" in agent_names or state.intent.intent in ("fishing_safety", "hazard_avoidance"):
            state = await marine_risk_agent.run(state)

        # 7. Gemini Response Synthesis
        synthesis_prompt = f"""
User Query: "{state.query}"
Detected Language: {state.language}
Detected Intent: {state.intent.intent}
Target Location: {state.location.name} (Lat: {state.location.lat}, Lon: {state.location.lon})

Aggregated Marine Observations:
- Weather: {state.agent_results.get('weather', {})}
- Ocean / Waves: {state.agent_results.get('ocean', {})}
- Tides: {state.agent_results.get('tide', {})}
- PFZ Zones: {state.agent_results.get('pfz', [])[:2]}
- Proximity & Hazards: {state.agent_results.get('geofencing', {})}
- Marine Risk Evaluation: {state.risk.model_dump() if state.risk else 'N/A'}
- Historical Ecosystem Trends: {state.agent_results.get('historical', {})}

Please synthesize a comprehensive, professional Marine Intelligence Advisory in '{state.language}'.
Organize with clear headers:
1. DIRECT ANSWER & SUMMARY
2. KEY ENVIRONMENTAL CONDITIONS (Wave height, Wind, SST, Tide)
3. RISK APPRAISAL & OPERATIONAL FACTORS
4. ACTIONABLE RECOMMENDATION (Vessel safety, navigational precautions)
5. OBSERVATIONAL EVIDENCE SOURCES
6. LIMITATIONS (Explicitly note SIMULATED DEMO DATA for development).
"""
        
        try:
            if gemini_service.is_operational:
                answer = await gemini_service.generate_text(
                    prompt=synthesis_prompt,
                    system_instruction=SYNTHESIS_SYSTEM_PROMPT
                )
            else:
                answer = self._generate_local_synthesis(state)
        except Exception as e:
            logger.warning(f"Gemini synthesis failed ({e}), using reliable fallback synthesis.")
            answer = self._generate_local_synthesis(state)

        state.final_response = answer
        
        # Populate recommendations & limitations
        recommendations = [
            state.risk.recommendation if state.risk else "Monitor local harbor radio on VHF Channel 16.",
            "Verify life jacket availability and marine distress beacon before departing Pamban/Rameswaram waters.",
            "Maintain strict 3.0 NM standoff from India-Sri Lanka IMBL."
        ]
        limitations = [
            "SIMULATED DATA FOR DEMONSTRATION: Measurements represent simulated provider schema.",
            "Decisions should be cross-checked with official local port authority bulletins prior to departure."
        ]
        
        state.agent_timeline.append({
            "agent_name": "Response Synthesis Agent",
            "status": "Completed",
            "execution_time_ms": int((time.time() - start_wall_time) * 1000),
            "summary": f"Synthesized final advisory in {state.language.upper()} backed by {len(state.evidence)} evidence sources"
        })

        summary_text = (
            f"Marine conditions indicate {state.risk.level if state.risk else 'MODERATE'} risk. "
            f"{state.risk.recommendation if state.risk else ''}"
        )

        return FinalMarineResponse(
            answer=state.final_response,
            language=state.language,
            summary=summary_text,
            risk=state.risk,
            evidence=state.evidence,
            map_layers=state.map_layers,
            recommendations=recommendations,
            limitations=limitations,
            agent_timeline=state.agent_timeline,
            demo_mode=True,
            data_timestamp=state.data_timestamp or datetime.now(timezone.utc).isoformat()
        )

    def _generate_local_synthesis(self, state: OrcaState) -> str:
        lang = state.language
        wave = state.agent_results.get("ocean", {}).get("wave_height_m", 1.95)
        wind = state.agent_results.get("weather", {}).get("current", {}).get("wind_speed_knots", 19.5)
        sst = state.agent_results.get("ocean", {}).get("sst_celsius", 29.2)
        risk_lvl = state.risk.level if state.risk else "MODERATE"
        
        if lang == "ta":
            return (
                f"### கடல்சார் ஆலோசனை (ORCA Marine Advisory)\n\n"
                f"**நேரடி பதில்:** நாளை காலை {state.location.name} பகுதியிலிருந்து கடலுக்குச் செல்வது **மிதமான ஆபத்து (MODERATE RISK)** உடையது. எச்சரிக்கையுடன் செயல்பட அறிவுறுத்தப்படுகிறது.\n\n"
                f"**முக்கிய கடல் மற்றும் வானிலை நிலைமைகள்:**\n"
                f"- **அலை உயரம் (Wave Height):** {wave} மீட்டர் (மிதமான முதல் கொந்தளிப்பான நிலை)\n"
                f"- **காற்று வேகம் (Wind Speed):** {wind} முடிச்சுகள் (தென்கிழக்கு காற்று, பலத்த காற்று வீசக்கூடும்)\n"
                f"- **கடல் மேற்பரப்பு வெப்பநிலை (SST):** {sst}°C\n"
                f"- **அலை நிலை (Tide):** உயரும் அலை (Flood Tide)\n\n"
                f"**ஆபத்து பகுப்பாய்வு & காரணிகள்:**\n"
                f"- பாம்பன் மற்றும் மண்டபம் கடல் கால்வாய்களில் அலைகள் 1.9 மீட்டரை விட அதிகமாக உள்ளன.\n"
                f"- பாரம்பரிய நாட்டுப் படகுகள் (Artisanal crafts) ஆழ்கடலுக்குச் செல்வதைத் தவிர்க்க வேண்டும்; 32 அடிக்கு மேற்பட்ட விசைப்படகுகள் எச்சரிக்கையுடன் செல்லலாம்.\n"
                f"- சர்வதேச கடல் எல்லைக் கோடு (IMBL) அருகில் செல்ல வேண்டாம்.\n\n"
                f"**பரிந்துரை (Recommendation):**\n"
                f"காலை 06:00 மணி முதல் காற்றின் வேகம் தற்காலிகமாக மிதமாக இருக்கும். ஆயினும் ஆழ்கடல் பகுதிக்குச் செல்வதைத் தவிர்த்து, கரையோர மீன்பிடிப் பகுதிகளில் எச்சரிக்கையுடன் செயல்படவும்.\n\n"
                f"---\n*தரவு ஆதாரம்: INCOIS / IMD / NRSC மாதிரி தரவுத்தளம் (SIMULATED DATA FOR DEMONSTRATION)*"
            )
        else:
            return (
                f"### Marine Advisory Summary ({state.location.name})\n\n"
                f"**Direct Answer:** Marine conditions for tomorrow morning indicate **{risk_lvl} RISK**. "
                f"Operations are permissible with caution for mechanized vessels, while small artisanal craft should exercise extreme restraint.\n\n"
                f"**Key Environmental Conditions:**\n"
                f"- **Significant Wave Height:** {wave} m (Moderate to rough swell in open channels)\n"
                f"- **Sustained Wind Speed:** {wind} knots (SE wind with localized funneling gusts)\n"
                f"- **Sea Surface Temperature (SST):** {sst}°C\n"
                f"- **Tidal Status:** Flood Tide (Rising water levels, adequate channel draft)\n\n"
                f"**Risk Appraisal & Factors:**\n"
                f"- Channel swell in Mandapam exceeds 1.8m threshold during early morning hours.\n"
                f"- Moderate gust factor requires secure gear stowage.\n"
                f"- Proximity caution: Maintain at least 3.0 NM westward clearance from India-Sri Lanka IMBL.\n\n"
                f"**Actionable Recommendation:**\n"
                f"Vessels should depart only after 06:30 IST when channel chop subsides. Keep VHF Channel 16 active.\n\n"
                f"---\n*Data Source: INCOIS / IMD / ISRO Satellite Model Schemas (SIMULATED DATA FOR DEMONSTRATION)*"
            )

orca_orchestrator = OrcaOrchestrator()
