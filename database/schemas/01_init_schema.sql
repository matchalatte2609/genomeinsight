-- Database Schema for GenomeInsight

-- Create database user for file-processing service
CREATE USER genomeinsight WITH ENCRYPTED PASSWORD 'genomeinsight123';

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE genomeinsight TO genomeinsight;

-- Connect to the genomeinsight database
\c genomeinsight;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO genomeinsight;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO genomeinsight;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO genomeinsight;

-- Create files table
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_status VARCHAR(50) DEFAULT 'uploaded',
    file_type VARCHAR(50),
    content_type VARCHAR(100),
    checksum VARCHAR(64),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (if needed for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analyses table (for future use)
CREATE TABLE IF NOT EXISTS analyses (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    parameters JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_status ON files(processing_status);
CREATE INDEX IF NOT EXISTS idx_files_upload_date ON files(upload_date);
CREATE INDEX IF NOT EXISTS idx_analyses_file_id ON analyses(file_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

-- Grant permissions on new tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO genomeinsight;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO genomeinsight;

-- Insert a test record to verify everything works
INSERT INTO files (filename, original_filename, file_size, file_path, file_type) 
VALUES ('test.vcf', 'test_sample.vcf', 157, '/app/uploads/test.vcf', 'vcf')
ON CONFLICT DO NOTHING;
