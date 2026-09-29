from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum

class ObservationType(str, Enum):
    OBSERVED = "OBSERVED"
    FORECAST = "FORECAST"
    MODEL_PREDICTION = "MODEL_PREDICTION"
    CORRELATION = "CORRELATION"
    INFERENCE = "INFERENCE"
    DEMO_DATA = "DEMO_DATA"

class Location(BaseModel):
    name: str = "Rameswaram Coastal Waters"
    lat: float = 9.2876
    lon: float = 79.3129

class TimeRange(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None

class IntentResult(BaseModel):
    language: str = "en"
    intent: str = "fishing_safety" # e.g., fishing_safety, find_pfz, hazard_avoidance, research_analysis, general_query
    location: Location = Field(default_factory=Location)
    time_range: Optional[TimeRange] = None
    entities: list[str] = Field(default_factory=list)
    confidence: float = 0.95

class TaskItem(BaseModel):
    agent: str
    priority: int = 1

class TaskPlan(BaseModel):
    tasks: list[TaskItem] = Field(default_factory=list)

class EvidenceItem(BaseModel):
    source: str
    dataset: str
    timestamp: str
    location: str
    parameter: str
    value: Any
    unit: str
    observation_type: ObservationType = ObservationType.DEMO_DATA
    url: Optional[str] = None
    confidence: float = 0.85

class MarineRiskResult(BaseModel):
    level: str = "MODERATE" # LOW, MODERATE, HIGH, CRITICAL
    score: float = 0.45
    factors: list[str] = Field(default_factory=list)
    recommendation: str = "Exercise caution in open waters."
    confidence: float = 0.85

class PFZResult(BaseModel):
    zone_id: str
    name: str
    lat: float
    lon: float
    distance_km: float
    sst_celsius: float
    chlorophyll_mg_m3: float
    validity: str
    confidence: float
    depth_m: float
    target_species: list[str] = Field(default_factory=list)
    recommendation: str

class Waypoint(BaseModel):
    lat: float
    lon: float
    name: Optional[str] = None
    leg_distance_nm: float = 0.0

class RouteResult(BaseModel):
    route_id: str
    origin: Location
    destination: Location
    distance_nm: float
    estimated_hours: float
    waypoints: list[Waypoint] = Field(default_factory=list)
    hazards_avoided: list[str] = Field(default_factory=list)
    safe_status: bool = True
    fuel_efficiency_index: float = 0.92

class AgentExecutionMeta(BaseModel):
    agent_name: str
    status: str = "Completed" # Running, Completed, Skipped, Error
    execution_time_ms: int = 120
    summary: str

class MapLayerItem(BaseModel):
    id: str
    name: str
    type: str # heatmap, point, polygon, line
    visible: bool = True
    data: Any

class FinalMarineResponse(BaseModel):
    answer: str
    language: str = "en"
    summary: str
    risk: Optional[MarineRiskResult] = None
    evidence: list[EvidenceItem] = Field(default_factory=list)
    map_layers: list[MapLayerItem] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    agent_timeline: list[AgentExecutionMeta] = Field(default_factory=list)
    demo_mode: bool = True
    data_timestamp: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "default-session"
    location: Optional[Location] = None
    language: Optional[str] = None
    context: Optional[dict[str, Any]] = None

class MarineCondition(BaseModel):
    location: Location
    timestamp: str
    sst_celsius: float
    wave_height_m: float
    wind_speed_knots: float
    wind_direction_deg: float
    chlorophyll_mg_m3: float
    sea_state: str
    tide_status: str
    active_alerts: list[str] = Field(default_factory=list)
    source: str = "SIMULATED DATA (INCOIS / ISRO / ECMWF Schema)"
    demo_mode: bool = True

class HazardItem(BaseModel):
    id: str
    type: str # cyclone, high_wave, lightning, restricted_border, reef
    severity: str # LOW, MODERATE, HIGH, CRITICAL
    title: str
    description: str
    coordinates: list[list[float]] # polygon or point coordinates
    effective_until: str
    affected_radius_km: float

class BoundaryItem(BaseModel):
    id: str
    name: str
    type: str # EEZ, IMBL, MPA, EXCLUSION_ZONE
    coordinates: list[list[float]]
    description: str
    restricted: bool = True
