from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
from uuid import UUID

from ..database import get_database_session
from ..models import ShuttleSchedule, Shuttle, Company
from ..logging_manager import logger_manager
from ..schemas import ShuttleSchedule as ScheduleSchema, ScheduleCreate, ScheduleUpdate, MessageResponse, OrganizedSchedules, ScheduleEntry, RouteSchedules
from ..auth import get_current_active_user, AdminUser

router = APIRouter()

@router.get("/public", response_model=List[ScheduleSchema])
async def get_schedules_public(
    db: AsyncSession = Depends(get_database_session)
):
    result = await db.execute(
        select(ShuttleSchedule).order_by(ShuttleSchedule.departure_time)
    )
    schedules = result.scalars().all()
    return schedules

@router.get("/", response_model=List[ScheduleSchema])
async def get_schedules(
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    logger_manager.info("Fetching schedules list", {"user_id": str(current_user.id)})
    
    result = await db.execute(
        select(ShuttleSchedule).order_by(ShuttleSchedule.departure_time)
    )
    schedules = result.scalars().all()
    
    logger_manager.info("Schedules retrieved", {"count": len(schedules)})
    return schedules

@router.get("/{schedule_id}", response_model=ScheduleSchema)
async def get_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    result = await db.execute(
        select(ShuttleSchedule).where(ShuttleSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    return schedule

@router.post("/", response_model=ScheduleSchema)
async def create_schedule(
    schedule_data: ScheduleCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    logger_manager.info("Creating new schedule", {
        "shuttle_id": str(schedule_data.shuttle_id),
        "departure_time": str(schedule_data.departure_time),
        "user_id": str(current_user.id)
    })
    # Verify shuttle exists
    result = await db.execute(
        select(Shuttle).where(Shuttle.id == schedule_data.shuttle_id)
    )
    shuttle = result.scalar_one_or_none()
    
    if not shuttle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shuttle not found"
        )
    
    new_schedule = ShuttleSchedule(
        shuttle_id=schedule_data.shuttle_id,
        route_type=schedule_data.route_type,
        direction=schedule_data.direction,
        departure_time=schedule_data.departure_time,
        arrival_time=schedule_data.arrival_time,
        days_of_week=schedule_data.days_of_week,
        is_active=schedule_data.is_active
    )
    
    db.add(new_schedule)
    await db.commit()
    await db.refresh(new_schedule)
    
    return new_schedule

@router.put("/{schedule_id}", response_model=ScheduleSchema)
async def update_schedule(
    schedule_id: UUID,
    schedule_data: ScheduleUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Check if schedule exists
    result = await db.execute(
        select(ShuttleSchedule).where(ShuttleSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # Update only provided fields
    update_data = schedule_data.dict(exclude_unset=True)
    if update_data:
        await db.execute(
            update(ShuttleSchedule)
            .where(ShuttleSchedule.id == schedule_id)
            .values(**update_data)
        )
        await db.commit()
        await db.refresh(schedule)
    
    return schedule

@router.delete("/{schedule_id}", response_model=MessageResponse)
async def delete_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Check if schedule exists
    result = await db.execute(
        select(ShuttleSchedule).where(ShuttleSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # Delete schedule
    await db.execute(
        delete(ShuttleSchedule).where(ShuttleSchedule.id == schedule_id)
    )
    await db.commit()
    
    return MessageResponse(message="Schedule deleted successfully")

@router.get("/shuttle/{shuttle_id}", response_model=List[ScheduleSchema])
async def get_schedules_by_shuttle(
    shuttle_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    result = await db.execute(
        select(ShuttleSchedule)
        .where(ShuttleSchedule.shuttle_id == shuttle_id)
        .order_by(ShuttleSchedule.departure_time)
    )
    schedules = result.scalars().all()
    return schedules

@router.get("/organized/display/public", response_model=OrganizedSchedules)
async def get_organized_schedules_public(
    date: str = None,
    db: AsyncSession = Depends(get_database_session)
):
    return await _get_organized_schedules(db)

@router.get("/organized/display", response_model=OrganizedSchedules)
async def get_organized_schedules(
    date: str = None,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    return await _get_organized_schedules(db)

async def _get_organized_schedules(db: AsyncSession) -> OrganizedSchedules:
    # Get all schedules with shuttle and company info
    result = await db.execute(
        select(ShuttleSchedule, Shuttle.name.label('shuttle_name'), Shuttle.capacity, Company.name.label('company_name'))
        .join(Shuttle, ShuttleSchedule.shuttle_id == Shuttle.id)
        .join(Company, Shuttle.company_id == Company.id)
        .where(ShuttleSchedule.is_active == True)
        .order_by(ShuttleSchedule.departure_time)
    )
    
    schedules_data = result.all()
    
    # Organize schedules by route and direction
    organized = {
        "savidor_to_tzafrir": {"outbound": [], "return": []},
        "kiryat_aryeh_to_tzafrir": {"outbound": [], "return": []}
    }
    
    for schedule, shuttle_name, capacity, company_name in schedules_data:
        # Format time
        departure_time = schedule.departure_time
        time_str = departure_time.strftime("%H:%M")
        full_time_str = departure_time.strftime("%H:%M:%S")
        
        arrival_time_str = None
        if schedule.arrival_time:
            arrival_time_str = schedule.arrival_time.strftime("%H:%M")
        
        schedule_entry = ScheduleEntry(
            time=time_str,
            fullTime=full_time_str,
            arrivalTime=arrival_time_str,
            shuttleName=shuttle_name,
            capacity=capacity,
            companyName=company_name,
            registeredCount=0  # TODO: Calculate actual registration count
        )
        
        # Add to appropriate route and direction
        if schedule.route_type in organized:
            organized[schedule.route_type][schedule.direction].append(schedule_entry)
    
    return OrganizedSchedules(
        savidor_to_tzafrir=RouteSchedules(
            outbound=organized["savidor_to_tzafrir"]["outbound"],
            return_=organized["savidor_to_tzafrir"]["return"]
        ),
        kiryat_aryeh_to_tzafrir=RouteSchedules(
            outbound=organized["kiryat_aryeh_to_tzafrir"]["outbound"],
            return_=organized["kiryat_aryeh_to_tzafrir"]["return"]
        )
    )