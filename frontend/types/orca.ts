export interface Location {
  name: string;
  lat: float;
  lon: float;
}

export type float = number;

export interface EvidenceItem {
  source: string;
  dataset: string;
  timestamp: string;
  location: string;
  parameter: string;
  value: any;
  unit: string;
  observation_type: 'OBSERVED' | 'FORECAST' | 'MODEL_PREDICTION' | 'CORRELATION' | 'INFERENCE' | 'DEMO_DATA';
  url?: string;
  confidence: number;
}

export interface MarineRiskResult {
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  score: number;
  factors: string[];
  recommendation: string;
  confidence: number;
}

export interface PFZResult {
  zone_id: string;
  name: string;
  lat: number;
  lon: number;
  distance_km: number;
  sst_celsius: number;
  chlorophyll_mg_m3: number;
  validity: string;
  confidence: number;
  depth_m: number;
  target_species: string[];
  recommendation: string;
}

export interface Waypoint {
  lat: number;
  lon: number;
  name?: string;
  leg_distance_nm: number;
}

export interface RouteResult {
  route_id: string;
  origin: Location;
  destination: Location;
  distance_nm: number;
  estimated_hours: number;
  waypoints: Waypoint[];
  hazards_avoided: string[];
  safe_status: boolean;
  fuel_efficiency_index: number;
}

export interface AgentExecutionMeta {
  agent_name: string;
  status: string;
  execution_time_ms: number;
  summary: string;
}

export interface MapLayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  data: any;
}

export interface FinalMarineResponse {
  answer: string;
  language: string;
  summary: string;
  risk?: MarineRiskResult;
  evidence: EvidenceItem[];
  map_layers: MapLayerItem[];
  recommendations: string[];
  limitations: string[];
  agent_timeline: AgentExecutionMeta[];
  demo_mode: boolean;
  data_timestamp: string;
}

export interface MarineCondition {
  location: Location;
  timestamp: string;
  sst_celsius: number;
  wave_height_m: number;
  wind_speed_knots: number;
  wind_direction_deg: number;
  chlorophyll_mg_m3: number;
  sea_state: string;
  tide_status: string;
  active_alerts: string[];
  source: string;
  demo_mode: boolean;
}

export interface HazardItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  coordinates: number[][];
  effective_until: string;
  affected_radius_km: number;
}

export interface BoundaryItem {
  id: string;
  name: string;
  type: string;
  coordinates: number[][];
  description: string;
  restricted: boolean;
}

export interface SystemStatusData {
  gemini_api: {
    status: string;
    model: string;
    reasoning_model: string;
  };
  database: {
    status: string;
    backend: string;
  };
  marine_data: {
    status: string;
    active_satellites: string[];
    disclaimer: string;
  };
  map_engine: {
    status: string;
    provider: string;
  };
  agents: {
    total_agents: number;
    status: string;
    orchestrator: string;
  };
}
