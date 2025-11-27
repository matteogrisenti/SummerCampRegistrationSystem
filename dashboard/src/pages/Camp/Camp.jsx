import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ArrowLeft, Calendar } from 'lucide-react';
import GeneralInfo from './GeneralInfo';
import Registrations from './Registrations';
import './Camp.css';

export default function Camp() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [camp, setCamp] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [processingData, setProcessingData] = useState(null);
  const [processingLoading, setProcessingLoading] = useState(true);
  const [processingError, setProcessingError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const campSlug = slug;

  const lastFetchedSlug = useRef(null);

  useEffect(() => {
    if (lastFetchedSlug.current === campSlug) return;
    lastFetchedSlug.current = campSlug;

    loadCampDetails();      // Load the Metadata Information fo the Camp
    loadProcessingData();   // Load the Registration Processing Result
    // loadRegistrations();    // Load the Registration of the Camp
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


  const loadRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getRegistrations(campSlug);
      if (result.success && result.data) {
        setRegistrations(result.data);
      } else {
        setError("Failed to load registrations: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error('Error loading registrations:', err);
      setError("Error loading registrations: " + err.message);
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
        if (result.data.registrations) setRegistrations(result.data.registrations);
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

  const handleBack = () => navigate('/');

  if (loading) return (
    <div className="camp-details-container">
      <div className="camp-details-loading">
        <div className="camp-details-spinner">⏳</div>
        <p>Loading camp details...</p>
      </div>
    </div>
  );

  if (error || !camp) return (
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
              <div className="camp-details-date-range"></div>
            </div>
          </div>
        </div>

        <div className="camp-details-divider"></div>

        {/* --- Processing Results Section --- */}
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
              {[
                { label: "Valid Registrations", value: processingData.validCount, icon: "✅", className: "stat-card-success" },
                { label: "Invalid Registrations", value: processingData.invalidCount, icon: "⚠️", className: "stat-card-warning" },
                { label: "Possible Sibling Groups", value: processingData.siblingGroupsCount, icon: "👨‍👩‍👧‍👦", className: "stat-card-info" },
                { label: "Duplicate Registrations", value: processingData.duplicateCount, icon: "📑", className: "stat-card-danger" },
                { label: "Total Registrations", value: processingData.totalCount, icon: "📊", className: "stat-card-primary" },
              ].map((stat, index) => (
                <div key={index} className={`camp-details-stat-card ${stat.className}`}>
                  <div className="stat-card-icon">{stat.icon}</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{stat.value || 0}</div>
                    <div className="stat-card-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* --- End Processing Section --- */}

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

        {/* Tab Content */}
        {activeTab === 'general' && (
          <GeneralInfo
            camp={camp}
            copiedUrl={copiedUrl}
            setCopiedUrl={setCopiedUrl}
          />
        )}

        {activeTab === 'registrations' && (
          <Registrations
            camp={camp}
            registrations={registrations}
            setRegistrations={setRegistrations}
          />
        )}
      </div>
    </div>
  );
}
