'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadResponse {
  file_id: string
  filename: string
  file_size: number
  file_type: string
  status: string
  message: string
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
      // First validate the filename
      const validateResponse = await fetch(`http://localhost:8002/validate/${file.name}`)
      const validateData = await validateResponse.json()
      
      if (!validateData.is_valid) {
        throw new Error(`Invalid file type: ${file.name}. Please upload a genomic data file.`)
      }

      // Upload the file
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('http://localhost:8002/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.detail?.message || 'Upload failed')
      }

      const result = await uploadResponse.json()
      setUploadResult(result)
      setUploadStatus('success')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      setUploadStatus('error')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/gzip': ['.gz'],
      'text/plain': ['.vcf', '.bed', '.txt', '.tsv', '.csv'],
      'application/octet-stream': ['.bam', '.sam'],
    }
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Genomic Files
        </h1>
        <p className="text-lg text-gray-600">
          Upload your genomic data files for analysis
        </p>
      </div>

      {/* Upload Area */}
      <div className="card mb-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop your file here' : 'Drag & drop a file here'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            or click to select a file
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: VCF, BED, BAM, SAM, FASTA, FASTQ, GFF, and compressed versions
          </p>
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus === 'uploading' && (
        <div className="card mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
            <span className="text-gray-900">Uploading and validating file...</span>
          </div>
        </div>
      )}

      {/* Success Result */}
      {uploadStatus === 'success' && uploadResult && (
        <div className="card mb-6 border-green-200 bg-green-50">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            ✅ Upload Successful!
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">File ID:</span>
              <span className="ml-2 text-gray-900 font-mono">{uploadResult.file_id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Filename:</span>
              <span className="ml-2 text-gray-900">{uploadResult.filename}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">File Size:</span>
              <span className="ml-2 text-gray-900">{formatFileSize(uploadResult.file_size)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">File Type:</span>
              <span className="ml-2 text-gray-900">{uploadResult.file_type}</span>
            </div>
          </div>
          <p className="mt-4 text-green-800">{uploadResult.message}</p>
        </div>
      )}

      {/* Error Message */}
      {uploadStatus === 'error' && (
        <div className="card border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            ❌ Upload Failed
          </h3>
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}
    </div>
  )
}