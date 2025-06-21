from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class FileType(str, Enum):
    VARIANT_CALL = "variant_call"
    GENOMIC_INTERVALS = "genomic_intervals"
    ALIGNMENT = "alignment"
    SEQUENCE = "sequence"
    RAW_READS = "raw_reads"
    ANNOTATION = "annotation"
    GENERIC_TEXT = "generic_text"
    TABULAR = "tabular"

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class FileUploadRequest(BaseModel):
    filename: str
    file_size: int
    file_type: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    file_type: FileType
    upload_path: str
    status: ProcessingStatus
    created_at: datetime
    message: str

class FileProcessingJob(BaseModel):
    job_id: str
    file_id: str
    filename: str
    file_type: FileType
    status: ProcessingStatus
    progress: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    results: Optional[Dict[str, Any]] = None

class FileValidationResult(BaseModel):
    is_valid: bool
    file_type: Optional[FileType] = None
    error_messages: List[str] = []
    warnings: List[str] = []
    metadata: Dict[str, Any] = {}

class ProcessingJobResponse(BaseModel):
    job_id: str
    status: ProcessingStatus
    progress: float
    message: str
    results: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None