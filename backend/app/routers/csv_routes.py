from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import pandas as pd
import io
from uuid import UUID
from datetime import date

from ..database import get_database_session
from ..models import ShuttleRegistration, ShuttleSchedule, Shuttle, Company
from ..schemas import MessageResponse
from ..auth import get_current_active_user, AdminUser

router = APIRouter()

@router.post("/import-registrations", response_model=MessageResponse)
async def import_registrations_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )
    
    try:
        # Read CSV file
        content = await file.read()
        csv_data = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['schedule_id', 'passenger_name', 'passenger_phone', 'registration_date']
        missing_columns = [col for col in required_columns if col not in csv_data.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        imported_count = 0
        errors = []
        
        for index, row in csv_data.iterrows():
            try:
                # Verify schedule exists
                schedule_result = await db.execute(
                    select(ShuttleSchedule).where(ShuttleSchedule.id == row['schedule_id'])
                )
                if not schedule_result.scalar_one_or_none():
                    errors.append(f"Row {index + 1}: Schedule {row['schedule_id']} not found")
                    continue
                
                # Create registration
                registration = ShuttleRegistration(
                    schedule_id=row['schedule_id'],
                    passenger_name=row['passenger_name'],
                    passenger_phone=row['passenger_phone'],
                    passenger_email=row.get('passenger_email'),
                    registration_date=pd.to_datetime(row['registration_date']).date(),
                    status=row.get('status', 'confirmed')
                )
                
                db.add(registration)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        if imported_count > 0:
            await db.commit()
        
        message = f"Successfully imported {imported_count} registrations"
        if errors:
            message += f". Errors: {'; '.join(errors[:5])}"  # Show first 5 errors
        
        return MessageResponse(message=message)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV: {str(e)}"
        )

@router.get("/export-registrations")
async def export_registrations_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    # Build query with joins to get related data
    query = select(
        ShuttleRegistration.passenger_name,
        ShuttleRegistration.passenger_phone,
        ShuttleRegistration.passenger_email,
        ShuttleRegistration.registration_date,
        ShuttleRegistration.status,
        ShuttleSchedule.departure_time,
        ShuttleSchedule.route_type,
        ShuttleSchedule.direction,
        Shuttle.name.label('shuttle_name'),
        Company.name.label('company_name')
    ).select_from(
        ShuttleRegistration
        .join(ShuttleSchedule)
        .join(Shuttle)
        .join(Company)
    ).where(ShuttleRegistration.status == 'confirmed')
    
    # Add date filters if provided
    if start_date:
        query = query.where(ShuttleRegistration.registration_date >= start_date)
    if end_date:
        query = query.where(ShuttleRegistration.registration_date <= end_date)
    
    query = query.order_by(ShuttleRegistration.registration_date, ShuttleSchedule.departure_time)
    
    result = await db.execute(query)
    rows = result.all()
    
    # Convert to DataFrame
    data = []
    for row in rows:
        data.append({
            'Passenger Name': row.passenger_name,
            'Phone': row.passenger_phone,
            'Email': row.passenger_email or '',
            'Date': row.registration_date.isoformat(),
            'Time': str(row.departure_time),
            'Route': row.route_type,
            'Direction': row.direction,
            'Shuttle': row.shuttle_name,
            'Company': row.company_name,
            'Status': row.status
        })
    
    df = pd.DataFrame(data)
    
    # Create CSV string
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    # Return as streaming response
    return StreamingResponse(
        io.BytesIO(csv_content.encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=registrations_export.csv"}
    )

@router.post("/import-schedules", response_model=MessageResponse)
async def import_schedules_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )
    
    try:
        # Read CSV file
        content = await file.read()
        csv_data = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['shuttle_id', 'route_type', 'direction', 'departure_time']
        missing_columns = [col for col in required_columns if col not in csv_data.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        imported_count = 0
        errors = []
        
        for index, row in csv_data.iterrows():
            try:
                # Create schedule
                schedule = ShuttleSchedule(
                    shuttle_id=row['shuttle_id'],
                    route_type=row['route_type'],
                    direction=row['direction'],
                    departure_time=pd.to_datetime(row['departure_time']).time(),
                    arrival_time=pd.to_datetime(row['arrival_time']).time() if pd.notna(row.get('arrival_time')) else None,
                    days_of_week=eval(row.get('days_of_week', '[1,2,3,4,5]')),  # Convert string to list
                    is_active=bool(row.get('is_active', True))
                )
                
                db.add(schedule)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        if imported_count > 0:
            await db.commit()
        
        message = f"Successfully imported {imported_count} schedules"
        if errors:
            message += f". Errors: {'; '.join(errors[:5])}"  # Show first 5 errors
        
        return MessageResponse(message=message)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV: {str(e)}"
        )

# Bulk update schedules
@router.put("/bulk-update-schedules", response_model=MessageResponse)
async def bulk_update_schedules(
    schedule_ids: List[UUID],
    updates: dict,
    db: AsyncSession = Depends(get_database_session),
    current_user: AdminUser = Depends(get_current_active_user)
):
    if not schedule_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No schedule IDs provided"
        )
    
    try:
        # Build update dict with only provided fields
        update_data = {}
        if "departure_time" in updates and updates["departure_time"]:
            from datetime import datetime
            update_data["departure_time"] = datetime.strptime(updates["departure_time"], "%H:%M:%S").time()
        if "arrival_time" in updates and updates["arrival_time"]:
            from datetime import datetime  
            update_data["arrival_time"] = datetime.strptime(updates["arrival_time"], "%H:%M:%S").time()
        if "is_active" in updates:
            update_data["is_active"] = updates["is_active"]
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid updates provided"
            )
        
        # Update all schedules with the provided IDs
        from sqlalchemy import update
        result = await db.execute(
            update(ShuttleSchedule)
            .where(ShuttleSchedule.id.in_(schedule_ids))
            .values(**update_data)
        )
        
        await db.commit()
        
        return MessageResponse(
            message=f"Successfully updated {result.rowcount} schedules"
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating schedules: {str(e)}"
        )