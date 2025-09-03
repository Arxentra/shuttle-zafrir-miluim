# FastAPI Migration Guide

## Migration Complete

The backend has been successfully migrated from Express.js to FastAPI. Here's what was done:

### Files Created/Modified:

#### Core FastAPI Files:
- `requirements.txt` - Python dependencies
- `app/main.py` - Main FastAPI application
- `app/__init__.py` - Package initializer
- `app/database.py` - Database configuration with asyncpg + SQLAlchemy
- `app/models.py` - SQLAlchemy models
- `app/schemas.py` - Pydantic schemas for request/response validation
- `app/auth.py` - JWT authentication utilities
- `app/websocket.py` - WebSocket connection manager

#### API Routers:
- `app/routers/auth.py` - Authentication endpoints
- `app/routers/companies.py` - Company CRUD operations
- `app/routers/shuttles.py` - Shuttle CRUD operations
- `app/routers/schedules.py` - Schedule CRUD operations  
- `app/routers/registrations.py` - Registration CRUD operations
- `app/routers/admin.py` - Admin management endpoints
- `app/routers/csv_routes.py` - CSV import/export functionality

#### Configuration:
- `package.json` - Updated scripts to run Python backend
- `.env.example` - Environment variables template

### Key Features Migrated:

✅ **Authentication System**
- JWT token generation and validation
- Login, register, verify, refresh endpoints
- Password reset functionality
- Role-based access control

✅ **Database Operations**
- All CRUD operations for companies, shuttles, schedules, registrations
- PostgreSQL integration with asyncpg
- SQLAlchemy ORM with async support
- Database connection pooling

✅ **API Endpoints**
- All original Express.js endpoints converted
- Request/response validation with Pydantic
- Error handling and status codes
- CORS configuration

✅ **Additional Features**
- WebSocket support for real-time updates
- CSV import/export functionality
- Admin statistics endpoint
- Health check endpoint

### Running the FastAPI Backend:

1. **Install Python Dependencies:**
   ```bash
   npm run install-python
   # or directly: pip install -r requirements.txt
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   # or directly: python -m uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
   ```

3. **Start Production Server:**
   ```bash
   npm start
   # or directly: python -m uvicorn app.main:app --host 0.0.0.0 --port 3001
   ```

### API Documentation:

FastAPI automatically generates interactive API documentation:
- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

### Environment Variables:

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Allowed frontend URL

### Database Schema:

The existing PostgreSQL database schema remains unchanged. The FastAPI backend uses the same tables:
- `companies`
- `shuttles` 
- `shuttle_schedules`
- `shuttle_registrations`
- `admin_users`

### Migration Benefits:

1. **Performance**: Async/await throughout the stack
2. **Type Safety**: Pydantic models for request/response validation
3. **Documentation**: Auto-generated OpenAPI/Swagger docs
4. **Modern Python**: Latest async features and libraries
5. **Maintainability**: Clean separation of concerns with routers
6. **Development Experience**: Hot reload and better error messages

The legacy Express.js files are preserved in the `src/` directory and can be run with `npm run legacy-dev` if needed during transition.