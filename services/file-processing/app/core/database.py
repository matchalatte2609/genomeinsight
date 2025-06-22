"""
Database connection and session management.
Fixed to properly handle Docker environment and connection errors.
"""

from sqlalchemy import create_engine, text, pool
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError, OperationalError
import logging
import time
from contextlib import contextmanager
from typing import Generator

from .config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SQLAlchemy base class
Base = declarative_base()

# Database engine configuration
engine_kwargs = {
    "poolclass": pool.QueuePool,
    "pool_size": 5,
    "max_overflow": 10,
    "pool_pre_ping": True,
    "pool_recycle": 300,
    "echo": settings.debug,  # SQL query logging in debug mode
}

# Global variables
engine = None
SessionLocal = None


def create_database_engine():
    """Create database engine with proper error handling."""
    global engine
    
    try:
        database_url = settings.get_database_url()
        logger.info(f"Creating database engine with URL: {database_url}")
        
        engine = create_engine(database_url, **engine_kwargs)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection successful!")
            
        return engine
        
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        raise


def create_session_factory():
    """Create session factory."""
    global SessionLocal
    
    if engine is None:
        raise RuntimeError("Database engine not initialized")
        
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal


def wait_for_db(max_retries: int = 30, retry_interval: int = 2) -> bool:
    """
    Wait for database to become available.
    Useful for Docker containers where services start in parallel.
    """
    logger.info("Waiting for database to become available...")
    
    for attempt in range(max_retries):
        try:
            database_url = settings.get_database_url()
            test_engine = create_engine(database_url, **engine_kwargs)
            
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                
            logger.info(f"Database available after {attempt + 1} attempts")
            test_engine.dispose()
            return True
            
        except (OperationalError, SQLAlchemyError) as e:
            if attempt < max_retries - 1:
                logger.warning(f"Database not ready (attempt {attempt + 1}/{max_retries}): {e}")
                time.sleep(retry_interval)
            else:
                logger.error(f"Database failed to become available after {max_retries} attempts: {e}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error waiting for database: {e}")
            return False
    
    return False


def init_database():
    """Initialize database connection and create tables."""
    global engine, SessionLocal
    
    try:
        logger.info("Initializing database...")
        
        # Wait for database to be available
        if not wait_for_db():
            raise RuntimeError("Database not available")
        
        # Create engine and session factory
        engine = create_database_engine()
        SessionLocal = create_session_factory()
        
        # Import models to ensure they're registered
        from ..models.database import UploadedFile
        
        # Create all tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Get database session with proper error handling and cleanup.
    Use as context manager: with get_db_session() as session:
    """
    if SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        session.close()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI to get database session.
    Used with Depends(get_db) in route functions.
    """
    if SessionLocal is None:
        raise RuntimeError("Database not initialized")
        
    session = SessionLocal()
    try:
        yield session
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        session.close()


def close_database():
    """Close database connections."""
    global engine, SessionLocal
    
    if engine:
        logger.info("Closing database connections...")
        engine.dispose()
        engine = None
        SessionLocal = None
        logger.info("Database connections closed")


# Health check function
def check_database_health() -> dict:
    """Check database health status."""
    try:
        if engine is None:
            return {"status": "error", "message": "Database not initialized"}
            
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as health_check"))
            row = result.fetchone()
            
            if row and row[0] == 1:
                return {"status": "healthy", "message": "Database connection OK"}
            else:
                return {"status": "error", "message": "Database query failed"}
                
    except Exception as e:
        return {"status": "error", "message": f"Database error: {str(e)}"}