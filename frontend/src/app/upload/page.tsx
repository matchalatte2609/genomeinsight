'use client'

import React, { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react'

// - file-processing service runs on port 8002 
// - api-gateway runs on port 3001
const BACKEND_URL = 'http://localhost:8002'  // file-processing service
const API_GATEWAY_URL = 'http://localhost:3001'  // api-gateway service

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  const testConnection = async () => {
    setConnectionStatus('testing')
    try {
      // Try both backend services to see which one responds
      console.log('Testing file-processing service...')
      const response1 = await fetch(`${BACKEND_URL}/health`).catch(() => null)
      
      console.log('Testing api-gateway service...')
      const response2 = await fetch(`${API_GATEWAY_URL}/health`).catch(() => null)
      
      if (response1?.ok) {
        const data = await response1.json()
        setConnectionStatus('success')
        console.log('File-processing service connected:', data)
      } else if (response2?.ok) {
        const data = await response2.json()
        setConnectionStatus('success')
        console.log('API Gateway connected:', data)
      } else {
        throw new Error('Neither service responded')
      }
    } catch (error) {
      setConnectionStatus('error')
      console.error('Backend connection failed:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Try file-processing service first (port 8002)
      let response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      }).catch(() => null)

      // If that fails, try api-gateway (port 3001)
      if (!response?.ok) {
        response = await fetch(`${API_GATEWAY_URL}/upload`, {
          method: 'POST',
          body: formData,
        })
      }

      const result = await response.json()
      
      if (response.ok) {
        setUploadResult({ success: true, data: result })
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setUploadResult({ success: false, error: result.error || 'Upload failed' })
      }
    } catch (error) {
      setUploadResult({ success: false, error: error.message || 'Network error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Upload Genomic Data</h1>
      
      {/* Connection Test Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Backend Connection Test</h2>
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={testConnection}
            disabled={connectionStatus === 'testing'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
          
          {connectionStatus === 'success' && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              Backend Connected Successfully
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              Backend Connection Failed
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600">
          <p>Testing: File Processing Service (port 8002) and API Gateway (port 3001)</p>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Upload VCF File</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          
          <div className="mb-4">
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="text-blue-500 hover:text-blue-600 font-medium">
                Choose a VCF file
              </span>
              <input
                id="file-input"
                type="file"
                accept=".vcf,.vcf.gz"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-gray-500 text-sm mt-1">
              Supported formats: .vcf, .vcf.gz (Max 100MB)
            </p>
          </div>

          {file && (
            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <div className="flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-700 font-medium">{file.name}</span>
                <span className="text-gray-500 ml-2">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {/* Upload Results */}
        {uploadResult && (
          <div className={`mt-6 p-4 rounded-md ${
            uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {uploadResult.success ? (
              <div>
                <div className="flex items-center text-green-800 mb-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Upload Successful!</span>
                </div>
                <div className="text-green-700 text-sm">
                  <p><strong>File ID:</strong> {uploadResult.data.id}</p>
                  <p><strong>Filename:</strong> {uploadResult.data.filename}</p>
                  <p><strong>Size:</strong> {uploadResult.data.fileSize} bytes</p>
                  <p><strong>Status:</strong> {uploadResult.data.status}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center text-red-800 mb-2">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Upload Failed</span>
                </div>
                <p className="text-red-700 text-sm">{uploadResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Instructions</h3>
        <ol className="text-blue-700 text-sm space-y-1">
          <li>1. First, test the backend connection using the blue button above</li>
          <li>2. Once connected, select a VCF file from your computer</li>
          <li>3. Click "Upload File" to process your genomic data</li>
          <li>4. View your uploaded files in the "Files" section</li>
        </ol>
      </div>
    </div>
  )
}