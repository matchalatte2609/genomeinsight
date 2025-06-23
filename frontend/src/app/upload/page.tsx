'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadResponse {
  file_id: number
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  status: string
  message: string
  validation: {
    is_valid: boolean
    file_type: string
    errors: string[]
    warnings: string[]
  }
}

export default function UploadPage() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploadStatus('uploading')
    setErrorMessage('')
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('Uploading file:', file.name, 'Size:', file.size)

      // Connect directly from browser to backend (bypassing Docker networking issues)
      const uploadResponse = await fetch('http://localhost:8002/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', uploadResponse.status)

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Upload failed with status:', uploadResponse.status, 'Response:', errorText)
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`)
      }

      const result = await uploadResponse.json()
      console.log('Upload result:', result)
      setUploadResult(result)
      setUploadStatus('success')
    } catch (error) {
      console.error('Upload error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      setUploadStatus('error')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/gzip': ['.gz'],
      'text/plain': ['.vcf', '.bed', '.txt', '.tsv', '.csv', '.fasta', '.fa', '.fastq', '.fq'],
      'application/octet-stream': ['.bam', '.sam'],
    },
    maxSize: 1024 * 1024 * 1024, // 1GB limit
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const resetUpload = () => {
    setUploadStatus('idle')
    setUploadResult(null)
    setErrorMessage('')
  }

  const testConnection = async () => {
    try {
      console.log('Testing backend connection...')
      const response = await fetch('http://localhost:8002/health')
      const data = await response.json()
      console.log('Backend health:', data)
      alert(`✅ Connection successful!\nService: ${data.service}\nStatus: ${data.status}\nDatabase: ${data.database.status}`)
    } catch (error) {
      console.error('Backend connection failed:', error)
      alert(`❌ Connection failed!\nError: ${error}\n\nMake sure the backend is running on port 8002`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Genomic Files
        </h1>
        <p className="text-lg text-gray-600">
          Upload your genomic data files for population genetics analysis
        </p>
        
        {/* Connection Test */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Backend Connection</h3>
              <p className="text-sm text-blue-700">Test your connection before uploading files</p>
            </div>
            <button 
              onClick={testConnection}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
            {uploadStatus === 'uploading' ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {uploadStatus === 'uploading' 
              ? 'Processing file...' 
              : isDragActive 
                ? 'Drop your file here' 
                : 'Drag & drop a file here'
            }
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {uploadStatus === 'uploading' 
              ? 'Please wait while we validate and store your file' 
              : 'or click to select a file'
            }
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: VCF, BED, BAM, SAM, FASTA, FASTQ, and compressed versions (.gz)
            <br />
            Maximum file size: 1GB
          </p>
        </div>
      </div>

      {/* Success Result */}
      {uploadStatus === 'success' && uploadResult && (
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-900 flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Upload Successful!
            </h3>
            <button 
              onClick={resetUpload}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Upload Another File
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="font-medium text-gray-700">File ID:</span>
              <span className="ml-2 text-gray-900 font-mono">{uploadResult.file_id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Original Name:</span>
              <span className="ml-2 text-gray-900">{uploadResult.original_filename}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Stored As:</span>
              <span className="ml-2 text-gray-900 font-mono">{uploadResult.filename}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">File Size:</span>
              <span className="ml-2 text-gray-900">{formatFileSize(uploadResult.file_size)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">File Type:</span>
              <span className="ml-2 text-gray-900 uppercase">{uploadResult.file_type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className="ml-2 text-green-700 font-medium">{uploadResult.status}</span>
            </div>
          </div>

          {uploadResult.validation && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Validation Results</h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium text-gray-700">Valid:</span>
                  <span className={`ml-2 ${uploadResult.validation.is_valid ? 'text-green-700' : 'text-red-700'}`}>
                    {uploadResult.validation.is_valid ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Detected Type:</span>
                  <span className="ml-2 text-gray-900 uppercase">{uploadResult.validation.file_type}</span>
                </div>
                {uploadResult.validation.warnings.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Warnings:</span>
                    <ul className="ml-2 text-yellow-700">
                      {uploadResult.validation.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            <a 
              href="/files" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Files
            </a>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadStatus === 'error' && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-900 flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Upload Failed
            </h3>
            <button 
              onClick={resetUpload}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Try Again
            </button>
          </div>
          <p className="text-red-800 mb-4">{errorMessage}</p>
          <div className="text-sm text-red-700">
            <p className="font-medium mb-1">Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1 text-red-600">
              <li>Click "Test Connection" to verify backend is reachable</li>
              <li>Make sure file format is supported (VCF, BED, BAM, SAM, FASTA, FASTQ)</li>
              <li>Check file size is under 1GB</li>
              <li>Ensure backend service is running on port 8002</li>
            </ul>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Supported File Formats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Variant Data</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <strong>VCF</strong> - Variant Call Format</li>
              <li>• <strong>VCF.GZ</strong> - Compressed VCF</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Sequence Data</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <strong>FASTA/FA</strong> - Reference sequences</li>
              <li>• <strong>FASTQ/FQ</strong> - Raw sequencing reads</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Alignment Data</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <strong>BAM</strong> - Binary alignment</li>
              <li>• <strong>SAM</strong> - Sequence alignment</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Annotation Data</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <strong>BED</strong> - Genomic intervals</li>
              <li>• <strong>GFF/GTF</strong> - Gene annotations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}