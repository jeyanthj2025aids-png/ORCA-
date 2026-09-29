from typing import Any, Optional

class KnowledgeGraphService:
    """
    Knowledge graph abstraction layer compatible with Neo4j.
    Models Marine Entities (Location, Species, Observation, SST, Chlorophyll, Weather, PFZ, Hazard, Boundary, Time)
    and Relationships (OBSERVED_AT, OCCURRED_DURING, CORRELATED_WITH, LOCATED_NEAR, WITHIN, AFFECTS).
    """
    def __init__(self):
        self.nodes = [
            {"id": "loc:rameswaram", "type": "Location", "name": "Rameswaram", "lat": 9.2876, "lon": 79.3129},
            {"id": "loc:palk_bay", "type": "Location", "name": "Palk Bay", "lat": 9.55, "lon": 79.35},
            {"id": "loc:gulf_of_mannar", "type": "Location", "name": "Gulf of Mannar", "lat": 9.15, "lon": 79.20},
            {"id": "species:tuna", "type": "Species", "name": "Yellowfin Tuna", "scientific": "Thunnus albacares"},
            {"id": "species:mackerel", "type": "Species", "name": "Indian Mackerel", "scientific": "Rastrelliger kanagurta"},
            {"id": "pfz:tn_01", "type": "PFZ", "name": "Rameswaram East Outer Bank", "lat": 9.3250, "lon": 79.4680},
            {"id": "hazard:high_swell_01", "type": "Hazard", "name": "Mandapam Swell Surge", "severity": "MODERATE"},
            {"id": "boundary:imbl", "type": "Boundary", "name": "India - Sri Lanka IMBL", "restricted": True}
        ]
        
        self.edges = [
            {"source": "pfz:tn_01", "target": "loc:rameswaram", "relation": "LOCATED_NEAR", "distance_km": 18.4},
            {"source": "species:mackerel", "target": "pfz:tn_01", "relation": "OBSERVED_AT", "season": "Post-Monsoon"},
            {"source": "hazard:high_swell_01", "target": "loc:rameswaram", "relation": "AFFECTS", "impact": "Channel swell > 1.9m"},
            {"source": "pfz:tn_01", "target": "boundary:imbl", "relation": "LOCATED_NEAR", "distance_nm": 6.8}
        ]

    async def query_neighbors(self, node_id: str) -> list[dict[str, Any]]:
        results = []
        for edge in self.edges:
            if edge["source"] == node_id or edge["target"] == node_id:
                other_id = edge["target"] if edge["source"] == node_id else edge["source"]
                other_node = next((n for n in self.nodes if n["id"] == other_id), None)
                if other_node:
                    results.append({
                        "relationship": edge["relation"],
                        "details": edge,
                        "connected_entity": other_node
                    })
        return results

    async def get_subgraph(self, location_name: str) -> dict[str, Any]:
        matched_loc = next((n for n in self.nodes if location_name.lower() in n.get("name", "").lower()), None)
        if not matched_loc:
            return {"nodes": self.nodes[:5], "edges": self.edges[:3]}
        neighbors = await self.query_neighbors(matched_loc["id"])
        sub_nodes = [matched_loc] + [n["connected_entity"] for n in neighbors]
        return {"nodes": sub_nodes, "relationships": neighbors}

knowledge_graph = KnowledgeGraphService()
