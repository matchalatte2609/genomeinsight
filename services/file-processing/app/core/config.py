"""
Core configuration settings for the file processing service.
Fixed to properly read Docker environment variables.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
import os
from typing import Optional


class Settings(BaseSettings):
    """Application settings with proper Docker environment variable handling."""
    
    # Database Configuration
    postgresql_url: str = Field(
        default="postgresql://genomeinsight:genomeinsight123@localhost:5432/genomeinsight",
        description="PostgreSQL database URL"
    )
    
    # Redis Configuration  
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    
    # MongoDB Configuration
    mongodb_url: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URL"
    )
    mongodb_database: str = Field(
        default="genomeinsight",
        description="MongoDB database name"
    )
    
    # File Upload Configuration
    upload_dir: str = Field(
        default="/app/uploads",
        description="Directory for uploaded files"
    )
    processed_dir: str = Field(
        default="/app/processed", 
        description="Directory for processed files"
    )
    max_file_size: int = Field(
        default=1024 * 1024 * 1024,  # 1GB
        description="Maximum file size in bytes"
    )
    
    # API Configuration
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8002, description="API port")
    debug: bool = Field(default=True, description="Debug mode")
    
    # External API Configuration
    clinvar_api_url: str = Field(
        default="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/",
        description="ClinVar API URL"
    )
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        # This is the key fix - tell pydantic to read from environment
        env_prefix = ""
        
        # Allow reading from environment variables with different formats
        @classmethod
        def prepare_field_env_vars(cls, field_name: str, field_info) -> list[str]:
            """Generate environment variable names for a field."""
            return [
                field_name.upper(),
                f"GENOMEINSIGHT_{field_name.upper()}",
                field_name.lower(),
            ]

    def __init__(self, **kwargs):
        """Initialize settings with environment variable override."""
        # Manual environment variable override for Docker
        env_overrides = {}
        
        # Check for PostgreSQL URL in environment
        if "POSTGRESQL_URL" in os.environ:
            env_overrides["postgresql_url"] = os.environ["POSTGRESQL_URL"]
        elif "DATABASE_URL" in os.environ:
            env_overrides["postgresql_url"] = os.environ["DATABASE_URL"]
            
        # Check for Redis URL
        if "REDIS_URL" in os.environ:
            env_overrides["redis_url"] = os.environ["REDIS_URL"]
            
        # Check for MongoDB URL
        if "MONGODB_URL" in os.environ:
            env_overrides["mongodb_url"] = os.environ["MONGODB_URL"]
            
        # Merge with any provided kwargs
        env_overrides.update(kwargs)
        
        super().__init__(**env_overrides)
        
    def get_database_url(self) -> str:
        """Get the database URL, ensuring it uses Docker service names in containers."""
        url = self.postgresql_url
        
        # If we're in a Docker container and using localhost, switch to service name
        if os.environ.get("DOCKER_CONTAINER", "false").lower() == "true":
            if "localhost" in url:
                url = url.replace("localhost", "postgres")
        
        return url


# Create global settings instance
settings = Settings()

# Debug print to verify environment variables are being read
if __name__ == "__main__":
    print("=== GenomeInsight Configuration Debug ===")
    print(f"PostgreSQL URL: {settings.postgresql_url}")
    print(f"Redis URL: {settings.redis_url}")
    print(f"MongoDB URL: {settings.mongodb_url}")
    print(f"Upload Directory: {settings.upload_dir}")
    print(f"Debug Mode: {settings.debug}")
    print("==========================================")