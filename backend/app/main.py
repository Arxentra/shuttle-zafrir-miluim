from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn
import os
import time
import logging
from dotenv import load_dotenv

from .database import engine, Base, connect_to_database, close_database_connection
from .routers import auth, companies, shuttles, schedules, registrations, admin, csv_routes
from .telemetry import setup_telemetry, instrument_app, cleanup_telemetry
from .logging_manager import logger_manager

load_dotenv()

tracer = setup_telemetry()

app = FastAPI(
    title="Tzafrir Shuttle System API",
    description="Backend API for Tzafrir Shuttle System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("CORS_ORIGIN", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Instrument the app with OpenTelemetry
if tracer:
    instrument_app(app)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    with logger_manager.span("http_request", {
        "http.method": request.method,
        "http.url": str(request.url),
        "http.route": request.url.path
    }) as span:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        span.set_attribute("http.status_code", response.status_code)
        span.set_attribute("http.response_time_ms", round(process_time * 1000, 2))
        
        logger_manager.log_request(
            request.method,
            request.url.path,
            response.status_code,
            process_time,
            {"user_agent": request.headers.get("user-agent")}
        )
    
    return response

# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "Validation error", "details": exc.errors()}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    error_message = "Something went wrong!" if os.getenv("NODE_ENV") == "production" else str(exc)
    logger_manager.error(f"Unhandled exception: {exc}", {
        "exception_type": type(exc).__name__,
        "request_path": request.url.path,
        "request_method": request.method
    })
    return JSONResponse(
        status_code=500,
        content={"error": error_message}
    )

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger_manager.info("Starting Tzafrir Shuttle API")
    await connect_to_database()
    logger_manager.info("Database connection established")

@app.on_event("shutdown")
async def shutdown_event():
    logger_manager.info("Shutting down Tzafrir Shuttle API")
    await close_database_connection()
    if tracer:
        cleanup_telemetry()
    logger_manager.info("Shutdown complete")


# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Test database connection
        from .database import get_db_connection
        conn = await get_db_connection()
        await conn.fetchval("SELECT 1")
        await conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "unhealthy", "database": "disconnected"}

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies"])
app.include_router(shuttles.router, prefix="/api/shuttles", tags=["Shuttles"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["Schedules"])
app.include_router(registrations.router, prefix="/api/registrations", tags=["Registrations"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(csv_routes.router, prefix="/api/csv", tags=["CSV"])


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3001)),
        reload=True
    )