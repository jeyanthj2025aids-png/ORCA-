from typing import Any, Optional
from pydantic import BaseModel, Field
from backend.app.models.schemas import (
    Location, TimeRange, IntentResult, TaskPlan, EvidenceItem,
    MarineRiskResult, PFZResult, RouteResult, AgentExecutionMeta, MapLayerItem
)

class OrcaState(BaseModel):
    """
    Central orchestration state passed across collaborative marine agents.
    """
    query: str
    language: str = "en"
    intent: Optional[IntentResult] = None
    location: Location = Field(default_factory=Location)
    time_range: Optional[TimeRange] = None
    user_context: dict[str, Any] = Field(default_factory=dict)
    
    # Task planning
    tasks: Optional[TaskPlan] = None
    
    # Inter-agent result store
    agent_results: dict[str, Any] = Field(default_factory=dict)
    
    # Normalized evidence and risk evaluation
    evidence: list[EvidenceItem] = Field(default_factory=list)
    risk: Optional[MarineRiskResult] = None
    confidence: float = 0.88
    
    # Geospatial output layers
    map_layers: list[MapLayerItem] = Field(default_factory=list)
    
    # Traceability & Agent Activity Timeline
    agent_timeline: list[AgentExecutionMeta] = Field(default_factory=list)
    
    # Synthesized final marine output
    final_response: Optional[str] = None
    recommendations: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    data_timestamp: Optional[str] = None
