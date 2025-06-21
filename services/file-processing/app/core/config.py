from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Application
    app_name: str = "GenomeInsight File Processing Service"
    version: str = "1.0.0"
    debug: bool = True
    
    # Database connections
    postgresql_url: str = "postgresql://genomeinsight:genomeinsight123@localhost:5432/genomeinsight"
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "genomeinsight"
    redis_url: str = "redis://localhost:6379"
    
    # File processing
    max_file_size: int = 500 * 1024 * 1024  # 500MB
    upload_directory: str = "/app/uploads"
    processed_directory: str = "/app/processed"
    allowed_file_types: list = [
        "application/gzip",
        "text/plain",
        "application/octet-stream",
        "application/x-bgzip"
    ]
    
    # Supported genomic file extensions
    genomic_extensions: list = [
        ".vcf", ".vcf.gz", ".vcf.bgz",
        ".bed", ".bed.gz", ".bed.bgz", 
        ".bam", ".sam",
        ".fasta", ".fa", ".fasta.gz", ".fa.gz",
        ".fastq", ".fq", ".fastq.gz", ".fq.gz",
        ".gff", ".gff3", ".gtf",
        ".txt", ".tsv", ".csv"
    ]
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # External services
    api_gateway_url: str = "http://localhost:3001"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()

# File type validation mapping
FILE_TYPE_MAPPING = {
    ".vcf": "variant_call",
    ".vcf.gz": "variant_call",
    ".vcf.bgz": "variant_call",
    ".bed": "genomic_intervals",
    ".bed.gz": "genomic_intervals", 
    ".bed.bgz": "genomic_intervals",
    ".bam": "alignment",
    ".sam": "alignment",
    ".fasta": "sequence",
    ".fa": "sequence",
    ".fasta.gz": "sequence",
    ".fa.gz": "sequence",
    ".fastq": "raw_reads",
    ".fq": "raw_reads",
    ".fastq.gz": "raw_reads",
    ".fq.gz": "raw_reads",
    ".gff": "annotation",
    ".gff3": "annotation",
    ".gtf": "annotation",
    ".txt": "generic_text",
    ".tsv": "tabular",
    ".csv": "tabular"
}