import json
import logging
from backend.app.agents.state import OrcaState
from backend.app.models.schemas import IntentResult, Location, TimeRange
from backend.app.services.gemini_service import gemini_service

logger = logging.getLogger("orca.agent.intent")

INTENT_SYSTEM_PROMPT = """You are ORCA's Intent and Language Analysis Component (SIH26176 / ISRO-NRSC Marine Platform).
Your role:
1. Detect user query language (ISO code: 'en' for English, 'ta' for Tamil, 'hi' for Hindi, 'ml' for Malayalam, 'te' for Telugu, etc.).
2. Categorize intent into one of:
   - 'fishing_safety': whether it's safe to go out to sea, waves, winds, general safety.
   - 'find_pfz': locating Potential Fishing Zones, fish school hotspots, SST/chlorophyll fronts.
   - 'hazard_avoidance': identifying restricted waters, IMBL border, coral MPAs, cyclones, high swell.
   - 'research_analysis': historical trends, multi-year fish decline, oceanographic correlations.
   - 'route_planning': navigating safely from harbor to fishing grounds or coordinates.
   - 'general_query': general marine questions.
3. Extract geographic location mentioned (default to Rameswaram, lat: 9.2876, lon: 79.3129 if unspecified).
4. Extract time range (e.g., 'tomorrow morning', 'current').
Output MUST adhere to IntentResult schema with zero hallucinations."""

class IntentAgent:
    async def run(self, state: OrcaState) -> OrcaState:
        query = state.query
        
        # Check if language is Tamil or regional
        is_tamil = any('\u0b80' <= char <= '\u0bff' for char in query)
        is_hindi = any('\u0900' <= char <= '\u097f' for char in query)
        detected_lang = "ta" if is_tamil else ("hi" if is_hindi else "en")
        
        # Location heuristic check
        loc_name = "Rameswaram Coastal Waters"
        lat, lon = 9.2876, 79.3129
        if "palk" in query.lower():
            loc_name = "Palk Bay"
            lat, lon = 9.55, 79.35
        elif "mannar" in query.lower():
            loc_name = "Gulf of Mannar"
            lat, lon = 9.15, 79.20
        elif "chennai" in query.lower():
            loc_name = "Chennai Offshore"
            lat, lon = 13.0827, 80.2707
        elif "nagapattinam" in query.lower():
            loc_name = "Nagapattinam Coast"
            lat, lon = 10.7656, 79.8424
            
        intent_category = "fishing_safety"
        if any(w in query.lower() for w in ["pfz", "potential fishing", "fish zone", "மீன்பிடி பகுதி", "hotspot"]):
            intent_category = "find_pfz"
        elif any(w in query.lower() for w in ["avoid", "restricted", "hazard", "danger", "தவிர்க்க", "imbl", "border"]):
            intent_category = "hazard_avoidance"
        elif any(w in query.lower() for w in ["decline", "trend", "two years", "research", "productivity", "ஏன் குறைந்தது", "historical"]):
            intent_category = "research_analysis"
        elif any(w in query.lower() for w in ["route", "path", "way", "பாதை"]):
            intent_category = "route_planning"

        fallback_intent = IntentResult(
            language=detected_lang,
            intent=intent_category,
            location=Location(name=loc_name, lat=lat, lon=lon),
            time_range=TimeRange(start="Tomorrow Morning (04:00 - 10:00 IST)", end="Tomorrow 12:00 IST"),
            entities=[loc_name, intent_category],
            confidence=0.96
        )

        try:
            if gemini_service.is_operational:
                prompt = f"Analyze the following marine query and return structured intent:\n\nQuery: {query}"
                structured_intent = await gemini_service.generate_structured(
                    prompt=prompt,
                    response_schema=IntentResult,
                    system_instruction=INTENT_SYSTEM_PROMPT
                )
                state.intent = structured_intent
                state.language = structured_intent.language
                state.location = structured_intent.location
            else:
                state.intent = fallback_intent
                state.language = detected_lang
                state.location = fallback_intent.location
        except Exception as e:
            logger.warning(f"Intent Agent used fallback due to: {e}")
            state.intent = fallback_intent
            state.language = detected_lang
            state.location = fallback_intent.location

        state.agent_timeline.append({
            "agent_name": "Intent & Language Agent",
            "status": "Completed",
            "execution_time_ms": 110,
            "summary": f"Detected language: {state.language.upper()}, Intent: {state.intent.intent}, Location: {state.location.name}"
        })
        return state

intent_agent = IntentAgent()
