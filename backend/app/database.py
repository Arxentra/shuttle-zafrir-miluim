import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv
from .logging_manager import logger_manager

load_dotenv()

# Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres123@postgres:5432/tzafrir_shuttle"
).replace("postgresql://", "postgresql+asyncpg://")

# Direct database connection for simple queries
import asyncpg

async def get_db_connection():
    return await asyncpg.connect(DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://"))

# SQLAlchemy async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True if os.getenv("NODE_ENV") != "production" else False,
    poolclass=NullPool
)

# Session factory
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Dependency to get database session
async def get_database_session() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

# Database connection events
async def connect_to_database():
    logger_manager.info("PostgreSQL connection pool initialized", {
        "database_url": DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL
    })

async def close_database_connection():
    await engine.dispose()
    logger_manager.info("Database connection pool closed")