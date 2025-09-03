from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from ..database import get_database_session
from ..models import Company
from ..logging_manager import logger_manager
from ..schemas import Company as CompanySchema, CompanyCreate, CompanyUpdate, MessageResponse
from ..auth import get_current_active_user, AdminUser

router = APIRouter()

@router.get("/public", response_model=List[CompanySchema])
async def get_companies_public(
    db: AsyncSession = Depends(get_database_session)
):
    result = await db.execute(
        select(Company).order_by(Company.name)
    )
    companies = result.scalars().all()
    return companies

@router.get("/", response_model=List[CompanySchema])
async def get_companies(
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    logger_manager.info("Fetching companies list", {"user_id": str(current_user.id)})
    
    result = await db.execute(
        select(Company).order_by(Company.name)
    )
    companies = result.scalars().all()
    
    logger_manager.info("Companies retrieved", {"count": len(companies)})
    return companies

@router.get("/{company_id}", response_model=CompanySchema)
async def get_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return company

@router.post("/", response_model=CompanySchema)
async def create_company(
    company_data: CompanyCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    logger_manager.info("Creating new company", {
        "company_name": company_data.name,
        "user_id": str(current_user.id)
    })
    new_company = Company(
        name=company_data.name,
        contact_email=company_data.contact_email,
        contact_phone=company_data.contact_phone
    )
    
    db.add(new_company)
    await db.commit()
    await db.refresh(new_company)
    
    return new_company

@router.put("/{company_id}", response_model=CompanySchema)
async def update_company(
    company_id: UUID,
    company_data: CompanyUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Check if company exists
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update only provided fields
    update_data = company_data.dict(exclude_unset=True)
    if update_data:
        await db.execute(
            update(Company)
            .where(Company.id == company_id)
            .values(**update_data)
        )
        await db.commit()
        await db.refresh(company)
    
    return company

@router.delete("/{company_id}", response_model=MessageResponse)
async def delete_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Check if company exists
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Delete company
    await db.execute(
        delete(Company).where(Company.id == company_id)
    )
    await db.commit()
    
    return MessageResponse(message="Company deleted successfully")