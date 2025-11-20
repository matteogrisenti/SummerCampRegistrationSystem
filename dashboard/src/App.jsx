import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import Dashboard from './components/Dashboard'
import { api } from './api'

function App() {
  const [data, setData] = useState(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [useBackend, setUseBackend] = useState(false)

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      const available = await api.checkHealth()
      setBackendAvailable(available)
      if (available) {
        setUseBackend(true)
      }
    }
    checkBackend()
  }, [])

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)
    setError(null)

    try {
      if (useBackend && backendAvailable) {
        // Use backend API for processing
        const response = await api.processFile(file)
        
        if (!response.success) {
          throw new Error(response.message || 'Processing failed')
        }

        // Read the processed file to display results
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        // Parse all sheets
        const parsedData = {
          registrations: [],
          invalid: [],
          siblings: [],
          processingResults: response.data
        }

        // Main registrations
        const mainSheet = workbook.SheetNames[0]
        parsedData.registrations = XLSX.utils.sheet_to_json(
          workbook.Sheets[mainSheet]
        )

        // Invalid registrations
        if (workbook.SheetNames.includes('Invalid_Registrations')) {
          parsedData.invalid = XLSX.utils.sheet_to_json(
            workbook.Sheets['Invalid_Registrations']
          )
        }

        // Sibling groups
        if (workbook.SheetNames.includes('Possible_Siblings')) {
          parsedData.siblings = XLSX.utils.sheet_to_json(
            workbook.Sheets['Possible_Siblings']
          )
        }

        setData(parsedData)
      } else {
        // Fallback to client-side parsing only
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        // Parse all sheets
        const parsedData = {
          registrations: [],
          invalid: [],
          siblings: []
        }

        // Main registrations (usually first sheet or "Form Responses 1")
        const mainSheet = workbook.SheetNames[0]
        parsedData.registrations = XLSX.utils.sheet_to_json(
          workbook.Sheets[mainSheet]
        )

        // Invalid registrations
        if (workbook.SheetNames.includes('Invalid_Registrations')) {
          parsedData.invalid = XLSX.utils.sheet_to_json(
            workbook.Sheets['Invalid_Registrations']
          )
        }

        // Sibling groups
        if (workbook.SheetNames.includes('Possible_Siblings')) {
          parsedData.siblings = XLSX.utils.sheet_to_json(
            workbook.Sheets['Possible_Siblings']
          )
        }

        setData(parsedData)
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1>⛺ Parish Summer Camp Registration Dashboard</h1>
        <p>View and analyze registration data</p>
        <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.7 }}>
          {backendAvailable ? (
            <span style={{ color: 'green' }}>✓ Backend processing active</span>
          ) : (
            <span style={{ color: 'orange' }}>⚠ Client-side mode only (install backend for full processing)</span>
          )}
        </div>
      </div>

      <div className="file-upload">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="file-input"
          id="file-input"
        />
        <label htmlFor="file-input">
          <span className="upload-button" style={{ display: 'inline-block' }}>
            📁 Upload Excel File
          </span>
        </label>
        {fileName && <div className="file-name">✓ {fileName}</div>}
      </div>

      {error && <div className="error">{error}</div>}

      {loading && <div className="loading">Processing data...</div>}

      {data && <Dashboard data={data} />}
    </div>
  )
}

export default App