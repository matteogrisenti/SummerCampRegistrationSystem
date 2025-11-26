import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ArrowLeft, ExternalLink, Calendar, FileText, Table, Download, Copy, Check } from 'lucide-react';
import './Camp.css';


export default function Camp() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [camp, setCamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  const [processingData, setProcessingData] = useState(null);
  const [processingLoading, setProcessingLoading] = useState(true);
  const [processingError, setProcessingError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [registrations, setRegistrations] = useState([]);

  const campSlug = slug;

  useEffect(() => {
    loadCampDetails();
    loadProcessingData();
  }, [campSlug]);


  const loadCampDetails = async () => {
    try {
      setLoading(true);
      const result = await api.getCamp(campSlug);
      
      if (result.success && result.data) {
        setCamp(result.data);
        setError(null);
      } else {
        setError("Camp not found");
      }
    } catch (err) {
      console.error('Error loading camp:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProcessingData = async () => {
    try {
      setProcessingLoading(true);
      setProcessingError(null);
      
      const result = await api.processCampRegistrations(campSlug);
      
      if (result.success && result.data) {
        setProcessingData(result.data);
        if (result.data.registrations) {
          setRegistrations(result.data.registrations);
        }
      } else {
        setProcessingError(result.error || "Failed to process data");
      }
    } catch (err) {
      console.error('Error processing data:', err);
      setProcessingError(err.message);
    } finally {
      setProcessingLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(camp.form_url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await fetch(`/api/camps/${campSlug}/download-excel`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${camp.camp_slug}-registrations.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to download Excel file');
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to delete this registration?')) {
      return;
    }
    
    try {
      const result = await api.deleteRegistration(campSlug, registrationId);
      if (result.success) {
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
        loadProcessingData();
      } else {
        alert('Failed to delete registration');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete registration');
    }
  };

  const handleAddRegistration = () => {
    alert('Add registration feature - implement modal or navigation');
  };

  if (loading) {
    return (
      <div className="camp-details-container">
        <div className="camp-details-loading">
          <div className="camp-details-spinner">⏳</div>
          <p>Loading camp details...</p>
        </div>
      </div>
    );
  }

  if (error || !camp) {
    return (
      <div className="camp-details-container">
        <div className="camp-details-error">
          <span className="camp-details-error-icon">⚠️</span>
          <h3 className="camp-details-error-title">Error Loading Camp</h3>
          <p className="camp-details-error-text">{error || "Camp not found"}</p>
          <button onClick={handleBack} className="camp-details-retry-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="camp-details-container">
      {/* Header */}
      <div className="camp-details-header">
        <button onClick={handleBack} className="camp-details-back-button">
          <ArrowLeft size={20} />
          <span>Back to Camps</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="camp-details-main-card">
        <div className="camp-details-camp-header">
          <div>
            <h1 className="camp-details-camp-title">🏕️ {camp.camp_name}</h1>
            <p className="camp-details-camp-slug">/{camp.camp_slug}</p>
          </div>
          <div className="camp-details-camp-dates">
            <Calendar size={24} className="camp-details-calendar-icon" />
            <div>
              <div className="camp-details-date-label">Camp Period</div>
              <div className="camp-details-date-range">
              </div>
            </div>
          </div>
        </div>

        <div className="camp-details-divider"></div>

        {/* Processing Results Section */}
        <div className="camp-details-processing-section">
          <h2 className="camp-details-section-title">Registration Analysis</h2>
          
          {processingLoading && (
            <div className="camp-details-processing-loading">
              <div className="camp-details-spinner">⏳</div>
              <p>Processing registration data...</p>
            </div>
          )}

          {processingError && (
            <div className="camp-details-processing-error">
              <span>⚠️</span>
              <p>{processingError}</p>
              <button onClick={loadProcessingData} className="camp-details-retry-button">
                Retry Processing
              </button>
            </div>
          )}

          {!processingLoading && !processingError && processingData && (
            <div className="camp-details-stats-grid">
              {/* Valid Registrations */}
              <div className="camp-details-stat-card stat-card-success">
                <div className="stat-card-icon">✅</div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{processingData.validCount || 0}</div>
                  <div className="stat-card-label">Valid Registrations</div>
                </div>
              </div>

              {/* Invalid Registrations */}
              <div className="camp-details-stat-card stat-card-warning">
                <div className="stat-card-icon">⚠️</div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{processingData.invalidCount || 0}</div>
                  <div className="stat-card-label">Invalid Registrations</div>
                </div>
              </div>

              {/* Sibling Groups */}
              <div className="camp-details-stat-card stat-card-info">
                <div className="stat-card-icon">👨‍👩‍👧‍👦</div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{processingData.siblingGroupsCount || 0}</div>
                  <div className="stat-card-label">Possible Sibling Groups</div>
                </div>
              </div>

              {/* Duplicated Registrations */}
              <div className="camp-details-stat-card stat-card-danger">
                <div className="stat-card-icon">📑</div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{processingData.duplicateCount || 0}</div>
                  <div className="stat-card-label">Duplicate Registrations</div>
                </div>
              </div>

              {/* Total Registrations */}
              <div className="camp-details-stat-card stat-card-primary">
                <div className="stat-card-icon">📊</div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{processingData.totalCount || 0}</div>
                  <div className="stat-card-label">Total Registrations</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="camp-details-divider"></div>

        {/* Tab Navigation */}
        <div className="camp-details-tabs">
          <button 
            className={`camp-details-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General Info
          </button>
          <button 
            className={`camp-details-tab ${activeTab === 'registrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('registrations')}
          >
            Registration Management
          </button>
        </div>

        {/* Tab Content - General Info */}
        {activeTab === 'general' && (
          <>
            {/* Resources Grid */}
            <div className="camp-details-resources-section">
              <h2 className="camp-details-section-title">Camp Resources</h2>
              <div className="camp-details-resources-grid">
                
                {/* Registration Form */}
                <div className="camp-details-resource-card">
                  <div className="camp-details-resource-icon resource-icon-form">
                    <FileText size={32} />
                  </div>
                  <div className="camp-details-resource-content">
                    <h3 className="camp-details-resource-title">Registration Form</h3>
                    <p className="camp-details-resource-description">
                      Share this link with parents to register their children for the camp
                    </p>
                    
                    <div className="camp-details-url-container">
                      <input 
                        type="text" 
                        value={camp.form_url} 
                        readOnly 
                        className="camp-details-url-input"
                      />
                      <button 
                        onClick={handleCopyUrl}
                        className="camp-details-copy-button"
                        title="Copy to clipboard"
                      >
                        {copiedUrl ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>

                    <a 
                      href={camp.form_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="camp-details-resource-link"
                    >
                      <span>Open Form</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                {/* Spreadsheet */}
                <div className="camp-details-resource-card">
                  <div className="camp-details-resource-icon resource-icon-sheet">
                    <Table size={32} />
                  </div>
                  <div className="camp-details-resource-content">
                    <h3 className="camp-details-resource-title">Response Spreadsheet</h3>
                    <p className="camp-details-resource-description">
                      Access live registration data directly from form submissions. Updates automatically when new registrations are received.
                    </p>
                    <a 
                      href={camp.sheet_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="camp-details-resource-link"
                    >
                      <span>Open Live Spreadsheet</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                {/* XLSX Download */}
                <div className="camp-details-resource-card">
                  <div className="camp-details-resource-icon resource-icon-xlsx">
                    <Download size={32} />
                  </div>
                  <div className="camp-details-resource-content">
                    <h3 className="camp-details-resource-title">Excel Export</h3>
                    <p className="camp-details-resource-description">
                      Download a local copy of the registration data as an Excel file to your computer for offline access.
                    </p>
                    <button 
                      onClick={handleDownloadExcel}
                      className="camp-details-download-button"
                    >
                      <Download size={16} />
                      <span>Download Excel File</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <div className="camp-details-divider"></div>

            {/* Technical Details */}
            <div className="camp-details-technical-section">
              <h2 className="camp-details-section-title">Technical Details</h2>
              <div className="camp-details-details-grid">
                <div className="camp-details-detail-item">
                  <span className="camp-details-detail-label">Form ID:</span>
                  <code className="camp-details-detail-value">{camp.form_id}</code>
                </div>
                <div className="camp-details-detail-item">
                  <span className="camp-details-detail-label">Sheet ID:</span>
                  <code className="camp-details-detail-value">{camp.sheet_id}</code>
                </div>
                <div className="camp-details-detail-item">
                  <span className="camp-details-detail-label">Created:</span>
                  <span className="camp-details-detail-value">
                    {new Date(camp.created_at).toLocaleString('it-IT')}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab Content - Registration Management */}
        {activeTab === 'registrations' && (
          <div className="camp-details-registrations-section">
            <div className="camp-details-registrations-header">
              <h2 className="camp-details-section-title">Registration List</h2>
              <button 
                onClick={handleAddRegistration}
                className="camp-details-add-button"
              >
                + Add Registration
              </button>
            </div>

            {registrations.length === 0 ? (
              <div className="camp-details-empty-state">
                <p>No registrations yet</p>
              </div>
            ) : (
              <div className="camp-details-table-container">
                <table className="camp-details-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Registered At</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration) => (
                      <tr key={registration.id}>
                        <td>{registration.name || 'N/A'}</td>
                        <td>{registration.email || 'N/A'}</td>
                        <td>{registration.phone || 'N/A'}</td>
                        <td>
                          {registration.created_at 
                            ? new Date(registration.created_at).toLocaleString('it-IT')
                            : 'N/A'}
                        </td>
                        <td>
                          <span className={`camp-details-status-badge status-${registration.status || 'pending'}`}>
                            {registration.status || 'pending'}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteRegistration(registration.id)}
                            className="camp-details-delete-button"
                            title="Delete registration"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}