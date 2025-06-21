'use client'

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [services, setServices] = useState({
    apiGateway: 'checking...',
    fileProcessing: 'checking...',
  })

  useEffect(() => {
    // Check service health on component mount
    checkServices()
  }, [])

  const checkServices = async () => {
    try {
      // Check API Gateway
      const apiResponse = await fetch('http://localhost:3001/health')
      const apiStatus = apiResponse.ok ? 'healthy' : 'unhealthy'
      
      // Check File Processing Service
      const fileResponse = await fetch('http://localhost:8002/health')
      const fileStatus = fileResponse.ok ? 'healthy' : 'unhealthy'
      
      setServices({
        apiGateway: apiStatus,
        fileProcessing: fileStatus,
      })
    } catch (error) {
      setServices({
        apiGateway: 'error',
        fileProcessing: 'error',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'unhealthy': return 'text-red-600 bg-red-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to GenomeInsight
        </h1>
        <p className="text-lg text-gray-600">
          Advanced population genomics analysis platform
        </p>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            API Gateway
          </h3>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(services.apiGateway)}`}>
            {services.apiGateway}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Main API routing service
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            File Processing
          </h3>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(services.fileProcessing)}`}>
            {services.fileProcessing}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Genomic file upload and validation
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <a href="/upload" className="btn-primary block text-center">
              Upload Files
            </a>
            <button 
              onClick={checkServices}
              className="btn-secondary w-full"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <p className="text-gray-600">
          No recent activity. Start by uploading your genomic data files.
        </p>
      </div>
    </div>
  )
}