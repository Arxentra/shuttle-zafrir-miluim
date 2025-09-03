from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Time, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    shuttles = relationship("Shuttle", back_populates="company")

class Shuttle(Base):
    __tablename__ = "shuttles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    capacity = Column(Integer, default=50)
    status = Column(String(50), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="shuttles")
    schedules = relationship("ShuttleSchedule", back_populates="shuttle")

class ShuttleSchedule(Base):
    __tablename__ = "shuttle_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shuttle_id = Column(UUID(as_uuid=True), ForeignKey("shuttles.id", ondelete="CASCADE"))
    route_type = Column(String(50), nullable=False)  # 'savidor_to_tzafrir' or 'kiryat_aryeh_to_tzafrir'
    direction = Column(String(50), nullable=False)   # 'outbound' or 'return'
    departure_time = Column(Time, nullable=False)
    arrival_time = Column(Time)
    days_of_week = Column(ARRAY(Integer), default=[1, 2, 3, 4, 5])  # 1=Monday, 7=Sunday
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    shuttle = relationship("Shuttle", back_populates="schedules")
    registrations = relationship("ShuttleRegistration", back_populates="schedule")

class ShuttleRegistration(Base):
    __tablename__ = "shuttle_registrations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("shuttle_schedules.id", ondelete="CASCADE"))
    passenger_name = Column(String(255), nullable=False)
    passenger_phone = Column(String(50), nullable=False)
    passenger_email = Column(String(255))
    registration_date = Column(DateTime(timezone=True), nullable=False)
    registration_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="confirmed")  # 'confirmed', 'cancelled', 'completed'
    time_slot = Column(Text)
    route_type = Column(Text)
    direction = Column(Text)
    user_name = Column(Text)
    phone_number = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    schedule = relationship("ShuttleSchedule", back_populates="registrations")

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="admin")  # 'super_admin', 'admin', 'viewer'
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())