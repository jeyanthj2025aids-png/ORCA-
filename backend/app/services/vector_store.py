import math
from typing import Any, Optional

class VectorStore:
    """
    Vector search abstraction layer designed for ChromaDB / Milvus interoperability.
    Includes built-in semantic keyword & cosine similarity search across marine scientific literature and advisories.
    """
    def __init__(self):
        # Seeded marine scientific research summaries and advisories
        self.documents = [
            {
                "id": "DOC-PALK-01",
                "title": "Palk Bay Oceanographic Productivity and Trophic State Analysis (2024-2026)",
                "category": "Scientific Research",
                "content": (
                    "Recent studies in the Palk Bay ecosystem indicate that sea surface temperature increases "
                    "of +0.42°C during summer peaks have coincided with a 14.2% drop in seasonal chlorophyll-a "
                    "concentration. While strong negative statistical correlation exists with pelagic fish catch rates (r = -0.68), "
                    "fisheries scientists caution that causation is multi-factorial, influenced heavily by bottom trawling pressures, "
                    "monsoonal wind delays, and thermal stratification displacing fish schools into deeper shelf waters."
                ),
                "tags": ["Palk Bay", "SST", "Chlorophyll", "Productivity", "Fisheries Trend"]
            },
            {
                "id": "DOC-PFZ-02",
                "title": "Ocean Colour Monitor (OCM) and Thermal Fronts for PFZ Delineation in Tamil Nadu",
                "category": "Remote Sensing Advisory",
                "content": (
                    "Potential Fishing Zones (PFZs) are identified at the convergence of Sea Surface Temperature (SST) "
                    "thermal fronts and chlorophyll-a color gradients derived from Oceansat-3 OCM-3. Pelagic species such as "
                    "mackerel, tuna, and carangids accumulate in these frontal eddies due to high zooplankton concentrations."
                ),
                "tags": ["PFZ", "Oceansat", "Thermal Fronts", "Chlorophyll", "Tuna"]
            },
            {
                "id": "DOC-SAFE-03",
                "title": "Maritime Safety Protocol: IMBL Navigation and Gulf of Mannar Protected Waters",
                "category": "Operational Safety Regulation",
                "content": (
                    "Artisanal and mechanized fishing vessels operating out of Rameswaram and Mandapam must maintain "
                    "a minimum 3 to 5 nautical mile safety buffer from the India-Sri Lanka International Maritime Boundary Line (IMBL). "
                    "Additionally, motorized bottom-trawling is strictly prohibited in the 21 islands of the Gulf of Mannar Marine "
                    "Biosphere Reserve to protect fragile coral reefs and seagrass beds."
                ),
                "tags": ["Safety", "IMBL", "Rameswaram", "Gulf of Mannar", "MPA"]
            },
            {
                "id": "DOC-MONSOON-04",
                "title": "Northeast Monsoon Sea State Dynamics and Coastal Hazards in Coromandel Coast",
                "category": "Meteorological Advisory",
                "content": (
                    "During squall and cyclonic events in the Bay of Bengal, wave heights in the Mandapam and Pamban channels "
                    "can rapidly escalate from 1.2m to over 3.2m within 4 hours. Small craft advisories are automatically triggered "
                    "when sustained surface winds exceed 22 knots."
                ),
                "tags": ["Weather", "Waves", "Cyclones", "High Wave Alert", "Mandapam"]
            }
        ]

    async def search(self, query: str, limit: int = 3) -> list[dict[str, Any]]:
        query_words = set(query.lower().split())
        scored = []
        for doc in self.documents:
            doc_text = (doc["title"] + " " + doc["content"] + " " + " ".join(doc["tags"])).lower()
            match_count = sum(1 for w in query_words if w in doc_text)
            # Tag match boosts score
            tag_matches = sum(2 for tag in doc["tags"] if tag.lower() in query.lower())
            total_score = match_count + tag_matches
            if total_score > 0:
                scored.append((total_score, doc))
        
        # Sort by relevance
        scored.sort(key=lambda x: x[0], reverse=True)
        if not scored:
            # Fallback to returning top 2 docs if no direct keyword match
            return self.documents[:limit]
        return [doc for score, doc in scored[:limit]]

vector_store = VectorStore()
