from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from typing import List
from uuid import UUID

from ..database import get_database_session
from ..models import AdminUser, Company, Shuttle, ShuttleSchedule, ShuttleRegistration
from ..logging_manager import logger_manager
from ..schemas import (
    AdminUser as AdminUserSchema, AdminUserCreate, AdminUserUpdate, MessageResponse
)
from ..auth import get_current_active_user, AdminUser as AuthUser, get_password_hash

router = APIRouter()

@router.get("/users", response_model=List[AdminUserSchema])
async def get_admin_users(
    db: AsyncSession = Depends(get_database_session),
    current_user: AuthUser = Depends(get_current_active_user)
):
    logger_manager.info("Admin fetching users list", {
        "admin_user_id": str(current_user.id),
        "admin_role": current_user.role
    })
    
    # Only super_admin can view all users
    if current_user.role != "super_admin":
        logger_manager.warning("Unauthorized access to admin users list", {
            "user_id": str(current_user.id),
            "role": current_user.role
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    result = await db.execute(
        select(AdminUser).order_by(AdminUser.created_at.desc())
    )
    users = result.scalars().all()
    
    logger_manager.info("Admin users retrieved", {"count": len(users)})
    return users

@router.get("/users/{user_id}", response_model=AdminUserSchema)
async def get_admin_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AuthUser = Depends(get_current_active_user)
):
    # Users can only view themselves unless they're super_admin
    if current_user.role != "super_admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    result = await db.execute(
        select(AdminUser).where(AdminUser.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.post("/users", response_model=AdminUserSchema)
async def create_admin_user(
    user_data: AdminUserCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AuthUser = Depends(get_current_active_user)
):
    # Only super_admin can create users
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if user already exists
    result = await db.execute(
        select(AdminUser).where(AdminUser.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = AdminUser(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        is_active=user_data.is_active
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@router.put("/users/{user_id}", response_model=AdminUserSchema)
async def update_admin_user(
    user_id: UUID,
    user_data: AdminUserUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AuthUser = Depends(get_current_active_user)
):
    # Users can only update themselves unless they're super_admin
    if current_user.role != "super_admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if user exists
    result = await db.execute(
        select(AdminUser).where(AdminUser.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update only provided fields
    update_data = user_data.dict(exclude_unset=True)
    if update_data:
        await db.execute(
            update(AdminUser)
            .where(AdminUser.id == user_id)
            .values(**update_data)
        )
        await db.commit()
        await db.refresh(user)
    
    return user

@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_admin_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AuthUser = Depends(get_current_active_user)
):
    # Only super_admin can delete users
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Cannot delete yourself
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    # Check if user exists
    result = await db.execute(
        select(AdminUser).where(AdminUser.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete user
    await db.execute(
        delete(AdminUser).where(AdminUser.id == user_id)
    )
    await db.commit()
    
    return MessageResponse(message="User deleted successfully")

@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_database_session),
    current_user: AuthUser = Depends(get_current_active_user)
):
    # Get comprehensive dashboard statistics
    companies_result = await db.execute(select(func.count(Company.id)))
    shuttles_result = await db.execute(select(func.count(Shuttle.id)))
    active_shuttles_result = await db.execute(
        select(func.count(Shuttle.id)).where(Shuttle.status == 'active')
    )
    active_schedules_result = await db.execute(
        select(func.count(ShuttleSchedule.id)).where(ShuttleSchedule.is_active == True)
    )
    upcoming_registrations_result = await db.execute(
        select(func.count(ShuttleRegistration.id)).where(
            ShuttleRegistration.status == 'confirmed',
            ShuttleRegistration.registration_date >= func.current_date()
        )
    )
    
    return {
        "total_companies": companies_result.scalar(),
        "total_shuttles": shuttles_result.scalar(), 
        "active_shuttles": active_shuttles_result.scalar(),
        "active_schedules": active_schedules_result.scalar(),
        "upcoming_registrations": upcoming_registrations_result.scalar()
    }

@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_database_session),
    current_user: AuthUser = Depends(get_current_active_user)
):
    # Get counts of various entities (backward compatibility)
    companies_result = await db.execute(select(func.count(Company.id)))
    shuttles_result = await db.execute(select(func.count(Shuttle.id)))
    schedules_result = await db.execute(select(func.count(ShuttleSchedule.id)))
    registrations_result = await db.execute(select(func.count(ShuttleRegistration.id)))
    active_shuttles_result = await db.execute(
        select(func.count(Shuttle.id)).where(Shuttle.status == 'active')
    )
    
    return {
        "companies": companies_result.scalar(),
        "shuttles": shuttles_result.scalar(),
        "active_shuttles": active_shuttles_result.scalar(),
        "schedules": schedules_result.scalar(),
        "registrations": registrations_result.scalar()
    }