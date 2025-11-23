import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api } from '../../../api'
import AddCampButton from './AddCampButton'
import './CampsGrid.css'

export default function CampsGrid() {
  const navigate = useNavigate(); // Add this hook
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCamps()
  }, [])

  const loadCamps = async () => {
    try {
      setLoading(true)
      
      const result = await api.listCamps()
      
      if (result.success && result.data && result.data.length > 0) {
        setCamps(result.data)
        setError(null)
      } else {
        setCamps([])
      }
      
    } catch (err) {
      console.error('Error loading camps:', err)
      setError(err.message)
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

  const handleCampClick = (camp, e) => {
    // Check if the user clicked on the delete button (or the icon inside it)
    console.log(e.target)
    if (e.target.closest('.delete-camp-button')) {
      // If yes, call the delete logic and STOP here.
      handleDeleteCamp(camp.camp_slug);
      return;
    }

    // Otherwise, proceed to navigate to camp details page
    navigate(`/camps/${camp.camp_slug}`);
  }

  const handleDeleteCamp = async (camp_slug, e) => {
    if (!confirm("Are you sure you want to delete this camp?")) return
    
    try {
      const result = await api.deleteCamp(camp_slug)
      if (result.success) {
        setCamps(camps.filter(c => c.camp_slug !== camp_slug))
      } else {
        alert("Failed to delete camp")
      }
    } catch (err) {
      console.error(err)
      alert("Error deleting camp")
    }
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
        
        <AddCampButton/>
      </div>
    )
  }
  
  return (
    <div className="camps-grid-container">
      <div className="camps-header">
        <div className="camps-header-content">
          <div className="camps-header-left">
            <h2>🏕️ Summer Camps</h2>
            <p className="camps-count">{camps.length} camp{camps.length !== 1 ? 's' : ''} available</p>
          </div>
          <div className="camps-header-right">
            <AddCampButton/>
          </div>
        </div>
      </div>
      
      <div className="camps-grid">
        {camps.map((camp) => (
          <div 
            key={camp.camp_slug} 
            className="camp-card"
            onClick={(e) => handleCampClick(camp, e)}
          >
            <div className="camp-card-header">
              <h3 className="camp-name">{camp.camp_name}</h3>

              <button className="delete-camp-button">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="camp-period">
              <span className="calendar-icon">📅</span>
              <span className={(camp.start_date && camp.end_date) ? '' : 'period-missing'}>
                {formatPeriod(camp.start_date, camp.end_date)}
              </span>
            </div>
            
            <div className="camp-card-footer">
              <div className="camp-stats">
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