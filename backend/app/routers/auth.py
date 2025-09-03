from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.sql import func
from datetime import datetime, timedelta
import secrets
import string

from ..database import get_database_session
from ..logging_manager import logger_manager
from ..models import AdminUser
from ..schemas import (
    LoginRequest, LoginResponse, AdminUserCreate, AdminUserResponse,
    TokenResponse, ResetPasswordRequest, ResetPasswordResponse, MessageResponse
)
from ..auth import (
    verify_password, get_password_hash, create_access_token, 
    get_current_user, get_current_active_user
)

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_database_session)
):
    logger_manager.info("Login attempt", {"email": request.email})
    
    with logger_manager.span("user_authentication") as span:
        # Find user
        result = await db.execute(
            select(AdminUser).where(
                AdminUser.email == request.email,
                AdminUser.is_active == True
            )
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(request.password, user.password_hash):
            logger_manager.warning("Login failed - invalid credentials", {"email": request.email})
            span.set_attribute("auth.result", "failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
    
        # Update last login
        await db.execute(
            update(AdminUser)
            .where(AdminUser.id == user.id)
            .values(last_login=func.now())
        )
        await db.commit()
        
        # Create access token
        access_token = create_access_token(
            data={"id": str(user.id), "email": user.email, "role": user.role}
        )
        
        logger_manager.info("Login successful", {
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role
        })
        span.set_attribute("auth.result", "success")
        span.set_attribute("user.id", str(user.id))
        
        return LoginResponse(
            token=access_token,
            user=AdminUserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role
            )
        )

@router.get("/verify", response_model=TokenResponse)
async def verify_token(
    current_user: AdminUser = Depends(get_current_active_user)
):
    return TokenResponse(
        user=AdminUserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role
        )
    )

@router.post("/register", response_model=LoginResponse)
async def register(
    user_data: AdminUserCreate,
    db: AsyncSession = Depends(get_database_session)
):
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
        full_name=user_data.full_name or "Admin User",
        role=user_data.role or "admin"
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(
        data={"id": str(new_user.id), "email": new_user.email, "role": new_user.role}
    )
    
    return LoginResponse(
        token=access_token,
        user=AdminUserResponse(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role
        )
    )

@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_database_session)
):
    # Check if user exists
    result = await db.execute(
        select(AdminUser).where(
            AdminUser.email == request.email,
            AdminUser.is_active == True
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # For security, don't reveal if email exists
        return ResetPasswordResponse(
            message="If the email exists, a reset link has been sent"
        )
    
    # Generate temporary password
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
    hashed_password = get_password_hash(temp_password)
    
    # Update password
    await db.execute(
        update(AdminUser)
        .where(AdminUser.email == request.email)
        .values(password_hash=hashed_password)
    )
    await db.commit()
    
    # In development, return the temp password (remove in production!)
    return ResetPasswordResponse(
        message="Password reset successfully",
        temp_password=temp_password  # Remove this in production!
    )

@router.get("/session", response_model=TokenResponse)
async def get_session(
    current_user: AdminUser = Depends(get_current_active_user)
):
    return TokenResponse(
        user=AdminUserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role
        )
    )

@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Generate new access token
    access_token = create_access_token(
        data={"id": str(current_user.id), "email": current_user.email, "role": current_user.role}
    )
    
    return LoginResponse(
        token=access_token,
        user=AdminUserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role
        )
    )

@router.post("/logout", response_model=MessageResponse)
async def logout():
    return MessageResponse(message="Logged out successfully")