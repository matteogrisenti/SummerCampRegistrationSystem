import { useState, useEffect } from 'react'
import { api } from '../../../api'
import './CampsGrid.css'

export default function CampsGrid() {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    loadCamps()
  }, [])

  const loadCamps = async () => {
    try {
      setLoading(true)
      setDebugInfo('Starting to load camps...')
      
      // Check if we're in Electron - check multiple ways
      const hasElectronApi = !!window.electronApi?.invoke
      const hasElectron = !!window.electron
      const hasIpcRenderer = !!window.ipcRenderer
      
      setDebugInfo(prev => prev + `\nElectron API (electronApi.invoke): ${hasElectronApi}`)
      setDebugInfo(prev => prev + `\nElectron (window.electron): ${hasElectron}`)
      setDebugInfo(prev => prev + `\nIPC Renderer: ${hasIpcRenderer}`)
      
      // Use API helper which handles both Electron and web
      setDebugInfo(prev => prev + '\nCalling api.listCamps()...')
      const result = await api.listCamps()
      
      setDebugInfo(prev => prev + `\nAPI result: ${JSON.stringify(result)}`)
      
      if (result.success && result.data && result.data.length > 0) {
        setDebugInfo(prev => prev + `\nFound ${result.data.length} camps`)
        setCamps(result.data)
        setError(null)
      } else {
        setDebugInfo(prev => prev + '\nNo camps found or API returned empty')
        setCamps([])
      }
      
    } catch (err) {
      console.error('Error loading camps:', err)
      setError(err.message)
      setDebugInfo(prev => prev + `\nFatal error: ${err.message}`)
      setCamps([])
    } finally {
      setLoading(false)
    }
  }

  const formatPeriod = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return 'Period not set'
    }
    
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      const formatDate = (date) => {
        return date.toLocaleDateString('it-IT', { 
          day: 'numeric', 
          month: 'short',
          year: 'numeric'
        })
      }
      
      return `${formatDate(start)} - ${formatDate(end)}`
    } catch {
      return 'Period not set'
    }
  }

  const handleCampClick = (camp) => {
    // For now, just log - you can add navigation later
    console.log('Clicked camp:', camp)
    alert(`Opening details for: ${camp.camp_name}`)
  }

  const loadSampleData = () => {
    const sampleCamps = [
      {
        camp_name: "1° Turno",
        camp_slug: "1-turno",
        start_date: "2025-06-15",
        end_date: "2025-06-22",
        form_id: "sample_form_1",
        form_url: "https://docs.google.com/forms/sample1",
        sheet_id: "sample_sheet_1",
        sheet_url: "https://docs.google.com/spreadsheets/sample1",
        xlsx_path: "/path/to/1-turno.xlsx",
        created_at: new Date().toISOString()
      },
      {
        camp_name: "2° Turno",
        camp_slug: "2-turno",
        start_date: "2025-06-29",
        end_date: "2025-07-06",
        form_id: "sample_form_2",
        form_url: "https://docs.google.com/forms/sample2",
        sheet_id: "sample_sheet_2",
        sheet_url: "https://docs.google.com/spreadsheets/sample2",
        xlsx_path: "/path/to/2-turno.xlsx",
        created_at: new Date().toISOString()
      }
    ]
    
    setCamps(sampleCamps)
    setDebugInfo(prev => prev + '\n\n✨ Loaded sample data for testing')
  }

  if (loading) {
    return (
      <div className="camps-loading">
        <div className="spinner">⏳</div>
        <p>Loading camps...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="camps-error">
        <span className="error-icon">⚠️</span>
        <h3>Error Loading Camps</h3>
        <p>{error}</p>
        <button onClick={loadCamps} className="retry-button">
          Try Again
        </button>
      </div>
    )
  }

  if (camps.length === 0) {
    return (
      <div className="camps-empty">
        <span className="empty-icon">⛺</span>
        <h3>No Camps Yet</h3>
        <p>Create your first camp to get started!</p>
        <p style={{ fontSize: '12px', color: '#95a5a6', marginTop: '10px' }}>
          Place a camps.json file in your public folder to see camps here.
        </p>
        
        {/* Debug Information */}
        <details style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          textAlign: 'left',
          maxWidth: '600px'
        }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
            🔍 Debug Information
          </summary>
          <pre style={{ 
            fontSize: '11px', 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            margin: 0,
            color: '#333'
          }}>
            {debugInfo}
          </pre>
        </details>
        
        <button 
          onClick={loadCamps}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            marginRight: '10px'
          }}
        >
          🔄 Retry Loading
        </button>
        
        <button 
          onClick={loadSampleData}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ✨ Load Sample Data
        </button>
      </div>
    )
  }

  return (
    <div className="camps-grid-container">
      <div className="camps-header">
        <h2>🏕️ Summer Camps</h2>
        <p className="camps-count">{camps.length} camp{camps.length !== 1 ? 's' : ''} available</p>
      </div>
      
      <div className="camps-grid">
        {camps.map((camp) => (
          <div 
            key={camp.camp_slug} 
            className="camp-card"
            onClick={() => handleCampClick(camp)}
          >
            <div className="camp-card-header">
              <h3 className="camp-name">{camp.camp_name}</h3>
              {!(camp.start_date && camp.end_date) && (
                <span className="warning-badge" title="Period not set">⚠️</span>
              )}
            </div>
            
            <div className="camp-period">
              <span className="calendar-icon">📅</span>
              <span className={(camp.start_date && camp.end_date) ? '' : 'period-missing'}>
                {formatPeriod(camp.start_date, camp.end_date)}
              </span>
            </div>
            
            <div className="camp-card-footer">
              <div className="camp-stats">
                <div className="stat-item">
                  <span className="stat-icon">📋</span>
                  <span className="stat-label">Form</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📊</span>
                  <span className="stat-label">Sheet</span>
                </div>
              </div>
              
              <div className="camp-card-action">
                <span>View Details</span>
                <span className="arrow">→</span>
              </div>
            </div>
            
            <div className="camp-created">
              Created: {new Date(camp.created_at).toLocaleDateString('it-IT')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}