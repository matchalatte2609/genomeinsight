'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Download, Eye, AlertCircle, RefreshCw } from 'lucide-react'

const BACKEND_URL = 'http://localhost:8002'

interface FileData {
  id: number
  filename: string
  fileSize: number
  uploadDate: string
  processingStatus: string
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${BACKEND_URL}/files`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setFiles(data.files || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch files')
      console.error('Error fetching files:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'uploaded': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Uploaded Files</h1>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Backend Status:</span>
          <span className={loading ? 'text-yellow-600' : error ? 'text-red-600' : 'text-green-600'}>
            {loading ? 'Loading...' : error ? 'Connection Error' : 'Connected'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center text-red-800">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Connection Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <p className="text-red-600 text-sm mt-2">
            Make sure the backend is running at {BACKEND_URL}
          </p>
        </div>
      )}

      {/* Files Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No files uploaded yet</h3>
            <p className="text-gray-500">Upload your first VCF file to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {file.filename}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {file.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(file.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(file.uploadDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(file.processingStatus)}`}>
                        {file.processingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900 flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-blue-600">{files.length}</div>
            <div className="text-gray-600">Total Files</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-green-600">
              {files.reduce((sum, file) => sum + file.fileSize, 0) > 0 
                ? formatFileSize(files.reduce((sum, file) => sum + file.fileSize, 0))
                : '0 Bytes'
              }
            </div>
            <div className="text-gray-600">Total Size</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-purple-600">
              {files.filter(f => f.processingStatus === 'uploaded').length}
            </div>
            <div className="text-gray-600">Ready to Process</div>
          </div>
        </div>
      )}
    </div>
  )
}