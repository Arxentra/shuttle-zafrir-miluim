from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime, time, date
from uuid import UUID

# Base schemas
class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime

# Company schemas
class CompanyBase(BaseModel):
    name: str
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None

class Company(CompanyBase, TimestampMixin):
    id: UUID
    
    class Config:
        from_attributes = True

# Shuttle schemas
class ShuttleBase(BaseModel):
    name: str
    capacity: Optional[int] = 50
    status: Optional[str] = "active"

class ShuttleCreate(ShuttleBase):
    company_id: UUID

class ShuttleUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None

class Shuttle(ShuttleBase, TimestampMixin):
    id: UUID
    company_id: UUID
    company_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schedule schemas
class ScheduleBase(BaseModel):
    route_type: str  # 'savidor_to_tzafrir' or 'kiryat_aryeh_to_tzafrir'
    direction: str   # 'outbound' or 'return'
    departure_time: time
    arrival_time: Optional[time] = None
    days_of_week: Optional[List[int]] = [1, 2, 3, 4, 5]
    is_active: Optional[bool] = True

class ScheduleCreate(ScheduleBase):
    shuttle_id: UUID

class ScheduleUpdate(BaseModel):
    route_type: Optional[str] = None
    direction: Optional[str] = None
    departure_time: Optional[time] = None
    arrival_time: Optional[time] = None
    days_of_week: Optional[List[int]] = None
    is_active: Optional[bool] = None

class ShuttleSchedule(ScheduleBase, TimestampMixin):
    id: UUID
    shuttle_id: UUID
    
    class Config:
        from_attributes = True

# Registration schemas
class RegistrationBase(BaseModel):
    passenger_name: str
    passenger_phone: str
    passenger_email: Optional[EmailStr] = None
    registration_date: date
    status: Optional[str] = "confirmed"

class RegistrationCreate(RegistrationBase):
    schedule_id: UUID

class RegistrationUpdate(BaseModel):
    passenger_name: Optional[str] = None
    passenger_phone: Optional[str] = None
    passenger_email: Optional[EmailStr] = None
    registration_date: Optional[date] = None
    status: Optional[str] = None

class ShuttleRegistration(RegistrationBase, TimestampMixin):
    id: UUID
    schedule_id: UUID
    registration_time: datetime
    
    class Config:
        from_attributes = True

# Admin User schemas
class AdminUserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "admin"
    is_active: Optional[bool] = True

class AdminUserCreate(AdminUserBase):
    password: str

class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class AdminUser(AdminUserBase, TimestampMixin):
    id: UUID
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AdminUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    
    class Config:
        from_attributes = True

# Auth schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: AdminUserResponse

class TokenResponse(BaseModel):
    user: AdminUserResponse

class ResetPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordResponse(BaseModel):
    message: str
    temp_password: Optional[str] = None  # Remove in production

# Generic response schemas
class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str

# Organized schedules schemas for display
class ScheduleEntry(BaseModel):
    time: str
    fullTime: str
    arrivalTime: Optional[str] = None
    shuttleName: str
    capacity: int
    companyName: str
    registeredCount: int = 0

class RouteSchedules(BaseModel):
    outbound: List[ScheduleEntry]
    return_: List[ScheduleEntry] = []
    
    class Config:
        alias_generator = lambda field: 'return' if field == 'return_' else field
        populate_by_name = True

class OrganizedSchedules(BaseModel):
    savidor_to_tzafrir: RouteSchedules
    kiryat_aryeh_to_tzafrir: RouteSchedules