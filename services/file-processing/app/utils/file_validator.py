import os
import magic
from typing import Tuple, Optional
from app.core.config import settings, FILE_TYPE_MAPPING
from app.models.file_models import FileType, FileValidationResult

class FileValidator:
    def __init__(self):
        self.magic = magic.Magic(mime=True)
    
    def get_file_extension(self, filename: str) -> str:
        """Extract file extension, handling compressed files."""
        filename_lower = filename.lower()
        
        # Handle double extensions for compressed files
        if filename_lower.endswith('.gz'):
            base_name = filename_lower[:-3]  # Remove .gz
            if '.' in base_name:
                return '.' + base_name.split('.')[-1] + '.gz'
            else:
                return '.gz'
        elif filename_lower.endswith('.bgz'):
            base_name = filename_lower[:-4]  # Remove .bgz
            if '.' in base_name:
                return '.' + base_name.split('.')[-1] + '.bgz'
            else:
                return '.bgz'
        else:
            return os.path.splitext(filename_lower)[1]
    
    def validate_file_extension(self, filename: str) -> Tuple[bool, Optional[FileType]]:
        """Validate if file extension is supported."""
        extension = self.get_file_extension(filename)
        
        if extension in FILE_TYPE_MAPPING:
            file_type = FileType(FILE_TYPE_MAPPING[extension])
            return True, file_type
        
        return False, None
    
    def validate_file_size(self, file_size: int) -> bool:
        """Validate file size against maximum allowed."""
        return file_size <= settings.max_file_size
    
    def validate_mime_type(self, file_path: str) -> bool:
        """Validate MIME type of the uploaded file."""
        try:
            mime_type = self.magic.from_file(file_path)
            return mime_type in settings.allowed_file_types
        except Exception:
            return False
    
    def validate_file(self, filename: str, file_path: str, file_size: int) -> FileValidationResult:
        """Comprehensive file validation."""
        errors = []
        warnings = []
        metadata = {}
        
        # Validate file extension
        extension_valid, file_type = self.validate_file_extension(filename)
        if not extension_valid:
            errors.append(f"Unsupported file extension: {self.get_file_extension(filename)}")
        
        # Validate file size
        if not self.validate_file_size(file_size):
            errors.append(f"File size {file_size} exceeds maximum allowed size {settings.max_file_size}")
        
        # Validate MIME type
        if os.path.exists(file_path):
            if not self.validate_mime_type(file_path):
                warnings.append("MIME type validation failed - file may be corrupted")
            
            # Add basic file metadata
            metadata.update({
                "file_size": file_size,
                "extension": self.get_file_extension(filename)
            })
        
        is_valid = len(errors) == 0
        
        return FileValidationResult(
            is_valid=is_valid,
            file_type=file_type if extension_valid else None,
            error_messages=errors,
            warnings=warnings,
            metadata=metadata
        )

# Global validator instance
file_validator = FileValidator()