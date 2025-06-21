from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import aiofiles
from datetime import datetime
from typing import List

from app.core.config import settings
from app.models.file_models import (
    FileUploadResponse, 
    FileValidationResult,
    ProcessingStatus,
    FileType
)
from app.utils.file_validator import file_validator

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="File Processing Service for GenomeInsight Platform"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directories if they don't exist
os.makedirs(settings.upload_directory, exist_ok=True)
os.makedirs(settings.processed_directory, exist_ok=True)

@app.get("/")
async def root():
    return {
        "service": settings.app_name,
        "version": settings.version,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "file-processing",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload and validate a genomic file."""
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    
    # Create file path
    file_path = os.path.join(settings.upload_directory, f"{file_id}_{file.filename}")
    
    try:
        # Save file to disk
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Get file size
        file_size = len(content)
        
        # Validate file
        validation_result = file_validator.validate_file(
            filename=file.filename,
            file_path=file_path,
            file_size=file_size
        )
        
        if not validation_result.is_valid:
            # Remove invalid file
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "File validation failed",
                    "errors": validation_result.error_messages
                }
            )
        
        # File is valid, return response
        return FileUploadResponse(
            file_id=file_id,
            filename=file.filename,
            file_size=file_size,
            file_type=validation_result.file_type,
            upload_path=file_path,
            status=ProcessingStatus.PENDING,
            created_at=datetime.utcnow(),
            message="File uploaded successfully and ready for processing"
        )
        
    except Exception as e:
        # Clean up file if it exists
        if os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"File upload failed: {str(e)}"
        )

@app.get("/validate/{filename}")
async def validate_filename(filename: str):
    """Validate a filename without uploading."""
    extension_valid, file_type = file_validator.validate_file_extension(filename)
    
    return {
        "filename": filename,
        "is_valid": extension_valid,
        "file_type": file_type.value if file_type else None,
        "extension": file_validator.get_file_extension(filename)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)