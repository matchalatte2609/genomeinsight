"""
Main FastAPI application for GenomeInsight file processing service.
Simplified version for Phase 1 - Database integration testing.
"""

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
import logging
from typing import List, Optional
from datetime import datetime
import aiofiles
from pathlib import Path

# Local imports
from .core.config import settings
from .core.database import init_database, get_db, check_database_health, close_database
from .models.database import UploadedFile

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="GenomeInsight File Processing Service",
    description="Bioinformatics file processing and validation service",
    version="1.0.0",
    debug=settings.debug
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    try:
        logger.info("Starting GenomeInsight File Processing Service...")
        
        # Print configuration for debugging
        logger.info(f"PostgreSQL URL: {settings.postgresql_url}")
        logger.info(f"Upload directory: {settings.upload_dir}")
        logger.info(f"Processed directory: {settings.processed_dir}")
        
        # Create upload directories
        os.makedirs(settings.upload_dir, exist_ok=True)
        os.makedirs(settings.processed_dir, exist_ok=True)
        logger.info("Upload directories created")
        
        # Initialize database with proper error handling
        try:
            logger.info("Initializing database connection...")
            init_database()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            logger.warning("Continuing without database - some features will be disabled")
        
        logger.info("Service startup completed successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    logger.info("Shutting down GenomeInsight File Processing Service...")
    close_database()
    logger.info("Shutdown completed")


@app.get("/health")
async def health_check():
    """Health check endpoint with database status."""
    db_health = check_database_health()
    
    return {
        "status": "healthy",
        "service": "file-processing",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_health,
        "upload_dir": settings.upload_dir,
        "processed_dir": settings.processed_dir,
        "config": {
            "postgresql_url": settings.postgresql_url,
            "debug": settings.debug
        }
    }


@app.get("/validate/{filename}")
async def validate_file_endpoint(filename: str):
    """Basic file validation by filename."""
    file_path = Path(settings.upload_dir) / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Basic validation without external validator
    file_size = file_path.stat().st_size
    file_extension = file_path.suffix.lower()
    
    # Simple file type detection
    genomic_extensions = {
        '.vcf': 'vcf',
        '.vcf.gz': 'vcf',
        '.bed': 'bed',
        '.bam': 'bam',
        '.sam': 'sam',
        '.fastq': 'fastq',
        '.fq': 'fastq',
        '.fa': 'fasta',
        '.fasta': 'fasta'
    }
    
    file_type = genomic_extensions.get(file_extension, 'unknown')
    is_valid = file_type != 'unknown' and file_size > 0
    
    return {
        "filename": filename,
        "is_valid": is_valid,
        "file_type": file_type,
        "file_size": file_size,
        "errors": [] if is_valid else [f"Unsupported file type: {file_extension}"],
        "warnings": [],
        "metadata": {
            "file_extension": file_extension,
            "file_size_mb": round(file_size / (1024*1024), 2)
        }
    }


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and validate a genomic file with database persistence."""
    try:
        # Check file size
        if file.size and file.size > settings.max_file_size:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size: {settings.max_file_size / (1024*1024):.0f}MB"
            )
        
        # Create unique filename to avoid conflicts
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = Path(settings.upload_dir) / safe_filename
        
        # Save file to disk
        logger.info(f"Saving file: {safe_filename}")
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        file_size = len(content)
        logger.info(f"File saved: {safe_filename} ({file_size} bytes)")
        
        # Basic file type detection
        file_extension = Path(file.filename).suffix.lower()
        genomic_extensions = {
            '.vcf': 'vcf',
            '.vcf.gz': 'vcf',
            '.bed': 'bed',
            '.bam': 'bam',
            '.sam': 'sam',
            '.fastq': 'fastq',
            '.fq': 'fastq',
            '.fa': 'fasta',
            '.fasta': 'fasta'
        }
        
        file_type = genomic_extensions.get(file_extension, 'unknown')
        is_valid = file_type != 'unknown' and file_size > 0
        
        if not is_valid:
            # Remove invalid file
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type: {file_extension}"
            )
        
        # Save file metadata to database
        try:
            db_file = UploadedFile(
                filename=safe_filename,
                original_filename=file.filename,
                file_size=file_size,
                file_type=file_type,
                status="uploaded",
                file_path=str(file_path),
                validation_result={
                    "is_valid": is_valid,
                    "file_type": file_type,
                    "errors": [],
                    "warnings": [],
                    "metadata": {
                        "file_extension": file_extension,
                        "file_size_mb": round(file_size / (1024*1024), 2)
                    }
                }
            )
            
            db.add(db_file)
            db.commit()
            db.refresh(db_file)
            
            logger.info(f"File metadata saved to database: ID {db_file.id}")
            
            return {
                "message": "File uploaded successfully",
                "file_id": db_file.id,
                "filename": safe_filename,
                "original_filename": file.filename,
                "file_size": file_size,
                "file_type": file_type,
                "status": "uploaded",
                "validation": {
                    "is_valid": is_valid,
                    "file_type": file_type,
                    "errors": [],
                    "warnings": []
                }
            }
            
        except Exception as e:
            logger.error(f"Database error: {e}")
            # Remove file if database save fails
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/files")
async def list_files(
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
    file_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List uploaded files with pagination and filtering."""
    try:
        query = db.query(UploadedFile).filter(UploadedFile.is_deleted == False)
        
        # Apply filters
        if status:
            query = query.filter(UploadedFile.status == status)
        if file_type:
            query = query.filter(UploadedFile.file_type == file_type)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        files = query.order_by(UploadedFile.uploaded_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "files": [
                {
                    "id": f.id,
                    "filename": f.filename,
                    "original_filename": f.original_filename,
                    "file_size": f.file_size,
                    "file_type": f.file_type,
                    "status": f.status,
                    "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None,
                    "updated_at": f.updated_at.isoformat() if f.updated_at else None
                }
                for f in files
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@app.get("/files/{file_id}")
async def get_file_details(file_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific file."""
    try:
        file = db.query(UploadedFile).filter(
            UploadedFile.id == file_id,
            UploadedFile.is_deleted == False
        ).first()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        return {
            "id": file.id,
            "filename": file.filename,
            "original_filename": file.original_filename,
            "file_size": file.file_size,
            "file_type": file.file_type,
            "status": file.status,
            "file_path": file.file_path,
            "uploaded_at": file.uploaded_at.isoformat() if file.uploaded_at else None,
            "updated_at": file.updated_at.isoformat() if file.updated_at else None,
            "validation_result": file.validation_result,
            "analysis_results": file.analysis_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get file details: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )