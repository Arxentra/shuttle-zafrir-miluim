from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
from uuid import UUID
from datetime import date, datetime
from sqlalchemy import cast, Date, func

from ..database import get_database_session
from ..models import ShuttleRegistration, ShuttleSchedule
from ..logging_manager import logger_manager
from ..schemas import ShuttleRegistration as RegistrationSchema, RegistrationCreate, RegistrationUpdate, MessageResponse
from ..auth import get_current_active_user, AdminUser

router = APIRouter()

@router.get("/count/public")
async def get_registration_count_public(
    time_slot: str = None,
    route_type: str = None,
    direction: str = None,
    registration_date: str = None,
    db: AsyncSession = Depends(get_database_session)
):
    # Build query based on provided parameters
    query = select(ShuttleRegistration)
    
    if time_slot:
        # Convert time_slot to match database format (assumes time_slot is like "07:00")
        query = query.where(ShuttleRegistration.time_slot == time_slot + ":00")
    
    if route_type:
        query = query.where(ShuttleRegistration.route_type == route_type)
    
    if direction:
        query = query.where(ShuttleRegistration.direction == direction)
    
    if registration_date:
        # Convert string date to date object
        date_obj = datetime.strptime(registration_date, '%Y-%m-%d').date()
        query = query.where(func.date(ShuttleRegistration.registration_date) == date_obj)
    
    result = await db.execute(query)
    registrations = result.scalars().all()
    
    return {"count": len(registrations)}

@router.get("/public", response_model=List[RegistrationSchema])
async def get_registrations_public(
    time_slot: str = None,
    route_type: str = None,
    direction: str = None,
    registration_date: str = None,
    db: AsyncSession = Depends(get_database_session)
):
    # Build query based on provided parameters
    query = select(ShuttleRegistration)
    
    if time_slot:
        # Convert time_slot to match database format (assumes time_slot is like "07:00")
        query = query.where(ShuttleRegistration.time_slot == time_slot + ":00")
    
    if route_type:
        query = query.where(ShuttleRegistration.route_type == route_type)
    
    if direction:
        query = query.where(ShuttleRegistration.direction == direction)
    
    if registration_date:
        # Convert string date to date object
        date_obj = datetime.strptime(registration_date, '%Y-%m-%d').date()
        query = query.where(func.date(ShuttleRegistration.registration_date) == date_obj)
    
    result = await db.execute(query.order_by(ShuttleRegistration.registration_time.desc()))
    registrations = result.scalars().all()
    
    return registrations

@router.get("/", response_model=List[RegistrationSchema])
async def get_registrations(
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    logger_manager.info("Fetching registrations list", {"user_id": str(current_user.id)})
    
    result = await db.execute(
        select(ShuttleRegistration).order_by(ShuttleRegistration.registration_time.desc())
    )
    registrations = result.scalars().all()
    
    logger_manager.info("Registrations retrieved", {"count": len(registrations)})
    return registrations

@router.get("/{registration_id}", response_model=RegistrationSchema)
async def get_registration(
    registration_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    result = await db.execute(
        select(ShuttleRegistration).where(ShuttleRegistration.id == registration_id)
    )
    registration = result.scalar_one_or_none()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
    
    return registration

@router.post("/", response_model=RegistrationSchema)
async def create_registration(
    registration_data: RegistrationCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    logger_manager.info("Creating new registration", {
        "schedule_id": str(registration_data.schedule_id),
        "passenger_name": registration_data.passenger_name,
        "user_id": str(current_user.id)
    })
    # Verify schedule exists
    result = await db.execute(
        select(ShuttleSchedule).where(ShuttleSchedule.id == registration_data.schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    new_registration = ShuttleRegistration(
        schedule_id=registration_data.schedule_id,
        passenger_name=registration_data.passenger_name,
        passenger_phone=registration_data.passenger_phone,
        passenger_email=registration_data.passenger_email,
        registration_date=registration_data.registration_date,
        status=registration_data.status
    )
    
    db.add(new_registration)
    await db.commit()
    await db.refresh(new_registration)
    
    return new_registration

@router.put("/{registration_id}", response_model=RegistrationSchema)
async def update_registration(
    registration_id: UUID,
    registration_data: RegistrationUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Check if registration exists
    result = await db.execute(
        select(ShuttleRegistration).where(ShuttleRegistration.id == registration_id)
    )
    registration = result.scalar_one_or_none()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
    
    # Update only provided fields
    update_data = registration_data.dict(exclude_unset=True)
    if update_data:
        await db.execute(
            update(ShuttleRegistration)
            .where(ShuttleRegistration.id == registration_id)
            .values(**update_data)
        )
        await db.commit()
        await db.refresh(registration)
    
    return registration

@router.delete("/{registration_id}", response_model=MessageResponse)
async def delete_registration(
    registration_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Check if registration exists
    result = await db.execute(
        select(ShuttleRegistration).where(ShuttleRegistration.id == registration_id)
    )
    registration = result.scalar_one_or_none()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
    
    # Delete registration
    await db.execute(
        delete(ShuttleRegistration).where(ShuttleRegistration.id == registration_id)
    )
    await db.commit()
    
    return MessageResponse(message="Registration deleted successfully")

@router.get("/schedule/{schedule_id}", response_model=List[RegistrationSchema])
async def get_registrations_by_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    result = await db.execute(
        select(ShuttleRegistration)
        .where(ShuttleRegistration.schedule_id == schedule_id)
        .order_by(ShuttleRegistration.registration_time.desc())
    )
    registrations = result.scalars().all()
    return registrations

@router.get("/date/{registration_date}", response_model=List[RegistrationSchema])
async def get_registrations_by_date(
    registration_date: date,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    result = await db.execute(
        select(ShuttleRegistration)
        .where(ShuttleRegistration.registration_date == registration_date)
        .order_by(ShuttleRegistration.registration_time.desc())
    )
    registrations = result.scalars().all()
    return registrations