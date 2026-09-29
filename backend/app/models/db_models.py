import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class UserModel(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), default="Maritime Operator")
    role = Column(String(50), default="Fisheries Officer")
    preferred_language = Column(String(10), default="en")
    created_at = Column(DateTime, default=utc_now)
    
    conversations = relationship("ConversationModel", back_populates="user")

class ConversationModel(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), default="Marine Advisory Session")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    user = relationship("UserModel", back_populates="conversations")
    messages = relationship("MessageModel", back_populates="conversation", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRunModel", back_populates="conversation")

class MessageModel(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender = Column(String(20), default="user") # 'user' or 'orca'
    content = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)
    
    conversation = relationship("ConversationModel", back_populates="messages")

class LocationModel(Base):
    __tablename__ = "locations"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), index=True)
    state = Column(String(50), default="Tamil Nadu")
    lat = Column(Float, index=True)
    lon = Column(Float, index=True)
    region_type = Column(String(50), default="Coastal Fishing Port")
    created_at = Column(DateTime, default=utc_now)

class MarineObservationModel(Base):
    __tablename__ = "marine_observations"
    id = Column(String, primary_key=True, default=generate_uuid)
    location_name = Column(String(100), index=True)
    lat = Column(Float, index=True)
    lon = Column(Float, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    sst_celsius = Column(Float)
    wave_height_m = Column(Float)
    wave_direction_deg = Column(Float, default=120.0)
    current_velocity_m_s = Column(Float, default=0.45)
    salinity_psu = Column(Float, default=34.5)
    chlorophyll_mg_m3 = Column(Float)
    sea_state = Column(String(50), default="Moderate")
    dataset_type = Column(String(50), default="SIMULATED", index=True)
    source_agency = Column(String(50), default="INCOIS/NRSC")

class WeatherObservationModel(Base):
    __tablename__ = "weather_observations"
    id = Column(String, primary_key=True, default=generate_uuid)
    location_name = Column(String(100), index=True)
    lat = Column(Float)
    lon = Column(Float)
    timestamp = Column(DateTime, default=utc_now, index=True)
    wind_speed_knots = Column(Float)
    wind_gust_knots = Column(Float, default=18.0)
    wind_direction_deg = Column(Float)
    air_temp_celsius = Column(Float, default=29.5)
    humidity_pct = Column(Float, default=78.0)
    pressure_hpa = Column(Float, default=1011.0)
    precipitation_mm = Column(Float, default=0.0)
    cyclone_risk = Column(String(20), default="NONE")
    lightning_risk = Column(String(20), default="LOW")
    dataset_type = Column(String(50), default="SIMULATED")

class SatelliteObservationModel(Base):
    __tablename__ = "satellite_observations"
    id = Column(String, primary_key=True, default=generate_uuid)
    satellite_name = Column(String(50), default="Oceansat-3 / EOS-06")
    sensor = Column(String(50), default="OCM-3 / SSTM")
    timestamp = Column(DateTime, default=utc_now)
    lat = Column(Float)
    lon = Column(Float)
    chlorophyll_ocm = Column(Float)
    sst_sstm = Column(Float)
    cloud_cover_pct = Column(Float, default=15.0)
    resolution_m = Column(Float, default=360.0)
    dataset_type = Column(String(50), default="SIMULATED")

class PFZZoneModel(Base):
    __tablename__ = "pfz_zones"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100))
    lat = Column(Float, index=True)
    lon = Column(Float, index=True)
    sst_celsius = Column(Float)
    chlorophyll_mg_m3 = Column(Float)
    depth_m = Column(Float)
    validity_start = Column(DateTime)
    validity_end = Column(DateTime)
    target_species = Column(JSON, default=list) # e.g. ["Tuna", "Mackerel", "Sardines"]
    confidence_score = Column(Float, default=0.88)
    advisory_text = Column(Text)
    status = Column(String(20), default="ACTIVE")

class HazardEventModel(Base):
    __tablename__ = "hazard_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(200))
    hazard_type = Column(String(50), index=True) # cyclone, high_wave, lightning, gale
    severity = Column(String(20), default="MODERATE") # LOW, MODERATE, HIGH, CRITICAL
    description = Column(Text)
    center_lat = Column(Float)
    center_lon = Column(Float)
    affected_radius_km = Column(Float, default=25.0)
    polygon_geojson = Column(JSON, default=dict)
    valid_from = Column(DateTime, default=utc_now)
    valid_until = Column(DateTime)
    is_active = Column(Boolean, default=True)

class MarineBoundaryModel(Base):
    __tablename__ = "marine_boundaries"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(150))
    boundary_type = Column(String(50)) # IMBL, EEZ, MPA, EXCLUSION
    country_primary = Column(String(50), default="India")
    country_secondary = Column(String(50), nullable=True)
    is_restricted = Column(Boolean, default=True)
    coordinates_geojson = Column(JSON)
    warning_buffer_nm = Column(Float, default=5.0)
    description = Column(Text)

class ProtectedAreaModel(Base):
    __tablename__ = "protected_areas"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(150))
    category = Column(String(50), default="Marine Biosphere Reserve")
    regulations = Column(Text)
    coordinates_geojson = Column(JSON)
    fishing_allowed = Column(Boolean, default=False)

class RouteModel(Base):
    __tablename__ = "routes"
    id = Column(String, primary_key=True, default=generate_uuid)
    origin_name = Column(String(100))
    origin_lat = Column(Float)
    origin_lon = Column(Float)
    dest_name = Column(String(100))
    dest_lat = Column(Float)
    dest_lon = Column(Float)
    distance_nm = Column(Float)
    estimated_hours = Column(Float)
    waypoints_json = Column(JSON)
    hazards_avoided_json = Column(JSON, default=list)
    safe_status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

class ReportModel(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(200))
    location_name = Column(String(100))
    query_text = Column(Text)
    executive_summary = Column(Text)
    risk_assessment = Column(JSON)
    evidence_json = Column(JSON)
    recommendations_json = Column(JSON)
    limitations_json = Column(JSON)
    created_at = Column(DateTime, default=utc_now)

class EvidenceModel(Base):
    __tablename__ = "evidence"
    id = Column(String, primary_key=True, default=generate_uuid)
    agent_run_id = Column(String, nullable=True)
    source = Column(String(100))
    dataset = Column(String(100))
    parameter = Column(String(100))
    value_str = Column(String(100))
    unit = Column(String(50))
    observation_type = Column(String(50), default="DEMO_DATA")
    confidence = Column(Float, default=0.85)
    created_at = Column(DateTime, default=utc_now)

class AgentRunModel(Base):
    __tablename__ = "agent_runs"
    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=True)
    query_text = Column(Text)
    detected_intent = Column(String(50))
    detected_language = Column(String(10))
    agents_invoked = Column(JSON, default=list)
    execution_time_ms = Column(Integer)
    status = Column(String(20), default="SUCCESS")
    created_at = Column(DateTime, default=utc_now)
    
    conversation = relationship("ConversationModel", back_populates="agent_runs")
