from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload, joinedload
from typing import List
from uuid import UUID

from ..database import get_database_session
from ..models import Shuttle, Company
from ..logging_manager import logger_manager
from ..schemas import Shuttle as ShuttleSchema, ShuttleCreate, ShuttleUpdate, MessageResponse
from ..auth import get_current_active_user, AdminUser

router = APIRouter()

@router.get("/public", response_model=List[ShuttleSchema])
async def get_shuttles_public(
    db: AsyncSession = Depends(get_database_session)
):    
    result = await db.execute(
        select(Shuttle, Company.name.label('company_name'))
        .join(Company)
        .order_by(Shuttle.name)
    )
    
    shuttles = []
    for shuttle, company_name in result.all():
        shuttle_dict = {
            "id": shuttle.id,
            "name": shuttle.name,
            "company_id": shuttle.company_id,
            "capacity": shuttle.capacity,
            "status": shuttle.status,
            "created_at": shuttle.created_at,
            "updated_at": shuttle.updated_at,
            "company_name": company_name
        }
        shuttles.append(ShuttleSchema(**shuttle_dict))
    
    return shuttles

@router.get("/", response_model=List[ShuttleSchema])
async def get_shuttles(
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    logger_manager.info("Fetching shuttles list", {"user_id": str(current_user.id)})
    
    result = await db.execute(
        select(Shuttle, Company.name.label('company_name'))
        .join(Company)
        .order_by(Shuttle.name)
    )
    
    shuttles = []
    for shuttle, company_name in result.all():
        shuttle_dict = {
            "id": shuttle.id,
            "name": shuttle.name,
            "company_id": shuttle.company_id,
            "capacity": shuttle.capacity,
            "status": shuttle.status,
            "created_at": shuttle.created_at,
            "updated_at": shuttle.updated_at,
            "company_name": company_name
        }
        shuttles.append(ShuttleSchema(**shuttle_dict))
    
    logger_manager.info("Shuttles retrieved", {"count": len(shuttles)})
    return shuttles

@router.get("/{shuttle_id}", response_model=ShuttleSchema)
async def get_shuttle(
    shuttle_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Shuttle, Company.name.label('company_name'))
        .join(Company)
        .where(Shuttle.id == shuttle_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shuttle not found"
        )
    
    shuttle, company_name = row
    shuttle_dict = {
        "id": shuttle.id,
        "name": shuttle.name,
        "company_id": shuttle.company_id,
        "capacity": shuttle.capacity,
        "status": shuttle.status,
        "created_at": shuttle.created_at,
        "updated_at": shuttle.updated_at,
        "company_name": company_name
    }
    
    return ShuttleSchema(**shuttle_dict)

@router.post("/", response_model=ShuttleSchema)
async def create_shuttle(
    shuttle_data: ShuttleCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Verify company exists
    result = await db.execute(
        select(Company).where(Company.id == shuttle_data.company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    new_shuttle = Shuttle(
        name=shuttle_data.name,
        company_id=shuttle_data.company_id,
        capacity=shuttle_data.capacity,
        status=shuttle_data.status
    )
    
    db.add(new_shuttle)
    await db.commit()
    await db.refresh(new_shuttle)
    
    # Return with company name
    shuttle_dict = {
        "id": new_shuttle.id,
        "name": new_shuttle.name,
        "company_id": new_shuttle.company_id,
        "capacity": new_shuttle.capacity,
        "status": new_shuttle.status,
        "created_at": new_shuttle.created_at,
        "updated_at": new_shuttle.updated_at,
        "company_name": company.name
    }
    
    return ShuttleSchema(**shuttle_dict)

@router.put("/{shuttle_id}", response_model=ShuttleSchema)
async def update_shuttle(
    shuttle_id: UUID,
    shuttle_data: ShuttleUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Check if shuttle exists
    result = await db.execute(
        select(Shuttle).where(Shuttle.id == shuttle_id)
    )
    shuttle = result.scalar_one_or_none()
    
    if not shuttle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shuttle not found"
        )
    
    # Update only provided fields
    update_data = shuttle_data.dict(exclude_unset=True)
    if update_data:
        await db.execute(
            update(Shuttle)
            .where(Shuttle.id == shuttle_id)
            .values(**update_data)
        )
        await db.commit()
        await db.refresh(shuttle)
    
    # Get company name for response
    company_result = await db.execute(
        select(Company.name).where(Company.id == shuttle.company_id)
    )
    company_name = company_result.scalar()
    
    shuttle_dict = {
        "id": shuttle.id,
        "name": shuttle.name,
        "company_id": shuttle.company_id,
        "capacity": shuttle.capacity,
        "status": shuttle.status,
        "created_at": shuttle.created_at,
        "updated_at": shuttle.updated_at,
        "company_name": company_name
    }
    
    return ShuttleSchema(**shuttle_dict)

@router.delete("/{shuttle_id}", response_model=MessageResponse)
async def delete_shuttle(
    shuttle_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Check if shuttle exists
    result = await db.execute(
        select(Shuttle).where(Shuttle.id == shuttle_id)
    )
    shuttle = result.scalar_one_or_none()
    
    if not shuttle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shuttle not found"
        )
    
    # Delete shuttle
    await db.execute(
        delete(Shuttle).where(Shuttle.id == shuttle_id)
    )
    await db.commit()
    
    return MessageResponse(message="Shuttle deleted successfully")