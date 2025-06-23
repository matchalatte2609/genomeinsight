'use client'

import { useState, useEffect } from 'react'

interface UploadedFile {
  id: number
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  status: string
  uploaded_at: string
  updated_at: string
}

interface FilesResponse {
  files: UploadedFile[]
  total: number
  limit: number
  offset: number
}

export default function FilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState({
    status: '',
    file_type: ''
  })

  useEffect(() => {
    fetchFiles()
  }, [filter])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.file_type) params.append('file_type', filter.file_type)
      
      console.log('Fetching files from backend...')
      const response = await fetch(`http://localhost:8002/files?${params}`)
      
      console.log('Files response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`)
      }
      
      const data: FilesResponse = await response.json()
      console.log('Files data:', data)
      
      setFiles(data.files)
      setTotal(data.total)
    } catch (err) {
      console.error('Error fetching files:', err)
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'uploaded': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'processed': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileTypeColor = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'vcf': return 'bg-purple-100 text-purple-800'
      case 'bed': return 'bg-indigo-100 text-indigo-800'
      case 'bam': return 'bg-green-100 text-green-800'
      case 'sam': return 'bg-blue-100 text-blue-800'
      case 'fastq': return 'bg-orange-100 text-orange-800'
      case 'fasta': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const testConnection = async () => {
    try {
      console.log('Testing backend connection...')
      const response = await fetch('http://localhost:8002/health')
      const data = await response.json()
      console.log('Backend health:', data)
      alert('Backend connection successful! Check console for details.')
    } catch (error) {
      console.error('Backend connection failed:', error)
      alert('Backend connection failed! Check console for details.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading files...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Uploaded Files
            </h1>
            <p className="text-lg text-gray-600">
              Manage your genomic data files ({total} total)
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={testConnection}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border"
            >
              Test Connection
            </button>
            <a 
              href="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Upload New File
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select 
              value={filter.status}
              onChange={(e) => setFilter(prev => ({...prev, status: e.target.value}))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="processed">Processed</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Type
            </label>
            <select 
              value={filter.file_type}
              onChange={(e) => setFilter(prev => ({...prev, file_type: e.target.value}))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="vcf">VCF</option>
              <option value="bed">BED</option>
              <option value="bam">BAM</option>
              <option value="sam">SAM</option>
              <option value="fastq">FASTQ</option>
              <option value="fasta">FASTA</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={fetchFiles}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading files</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button 
                onClick={fetchFiles}
                className="text-sm text-red-700 underline mt-2"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Table */}
      {files.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-600 mb-4">
            {filter.status || filter.file_type 
              ? 'No files match your current filters.' 
              : 'Get started by uploading your first genomic data file.'
            }
          </p>
          <a 
            href="/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Upload Your First File
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
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
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {file.original_filename}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          ID: {file.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(file.file_type)}`}>
                        {file.file_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(file.status)}`}>
                        {file.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.uploaded_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => {
                          // For now, just show file details in console
                          console.log('File details:', file)
                          alert(`File Details:\nID: ${file.id}\nName: ${file.original_filename}\nType: ${file.file_type}\nSize: ${formatFileSize(file.file_size)}\nStatus: ${file.status}`)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}