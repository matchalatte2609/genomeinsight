"""
Database models for GenomeInsight file processing service.
Simplified version for Phase 1 testing.
"""

from sqlalchemy import Column, Integer, String, DateTime, BigInteger, Text, JSON, Boolean, Index
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any

from ..core.database import Base


class UploadedFile(Base):
    """Model for tracking uploaded genomic files."""
    
    __tablename__ = "uploaded_files"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # File identification
    filename = Column(String(255), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    
    # File metadata
    file_size = Column(BigInteger, nullable=False)
    file_type = Column(String(50), nullable=False, index=True)
    
    # File status tracking
    status = Column(String(50), nullable=False, default="uploaded", index=True)
    # Status values: uploaded, processing, processed, error, deleted
    
    # Validation and analysis results (JSON fields)
    validation_result = Column(JSON, nullable=True)
    analysis_results = Column(JSON, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    
    # Basic genomic metadata
    sample_count = Column(Integer, nullable=True)
    variant_count = Column(Integer, nullable=True)
    
    # Create indexes for common queries
    __table_args__ = (
        Index('idx_status_uploaded_at', 'status', 'uploaded_at'),
        Index('idx_file_type_status', 'file_type', 'status'),
    )
    
    def __repr__(self):
        return f"<UploadedFile(id={self.id}, filename='{self.filename}', status='{self.status}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_size": self.file_size,
            "file_type": self.file_type,
            "status": self.status,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "validation_result": self.validation_result,
            "analysis_results": self.analysis_results
        }