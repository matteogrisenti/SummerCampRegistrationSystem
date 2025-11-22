import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import GeneralInfo from './steps/GeneralInfo';
import RegistrationForm from './steps/RegistrationForm';
import CampSummary from './steps/CampSummary';
import './NewCamp.css';

export default function NewCamp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = GeneralInfo, 2 = RegistrationForm, 3 = Summary
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [campData, setCampData] = useState(null);
  const [googleAuth, setGoogleAuth] = useState({ hasCredentials: false, hasToken: false, checked: false })

  const [campInfo, setCampInfo] = useState({
    name: '',
    period: '',
    location: ''
  });

  const [fields, setFields] = useState([
    { id: 1, name: 'timestamp', label: 'Timestamp', description: 'Submission timestamp', required: true, removable: false },
    { id: 2, name: 'child_name', label: 'Nome Cognome Ragazzo', description: 'Full name of the child', required: true, removable: true },
    { id: 3, name: 'child_age', label: 'Età Ragazzo', description: 'Age of the child', required: true, removable: true },
    { id: 4, name: 'parent_name', label: 'Nome Genitore/Tutore', description: 'Name of parent or guardian', required: true, removable: true },
    { id: 5, name: 'parent_email', label: 'Email Genitore/Tutore', description: 'Email address for contact', required: true, removable: true },
    { id: 6, name: 'phone', label: 'Numero di Telefono Genitore/Tutore', description: 'Contact phone number', required: true, removable: true },
    { id: 7, name: 'allergies', label: 'Allergie/Informazioni Mediche', description: 'Any allergies or medical information', required: false, removable: true }
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await api.checkGoogleAuth()
      if (authStatus.success) {
        setGoogleAuth({ ...authStatus, checked: true })
      } else {
        setGoogleAuth({ hasCredentials: false, hasToken: false, checked: true })
      }
    }
    checkAuth()
  }, [])

  const handleNextStep = async () => {
    setError(null);

    // Validate step 1: General Info
    if (step === 1) {
      if (!campInfo.name || !campInfo.period || !campInfo.location) {
        setError('Please fill in all required fields');
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: Registration Form -> Create camp and proceed
    if (step === 2) {
      // Validate all fields have name and label
      if (window.validateRegistrationFields && !window.validateRegistrationFields()) {
        setError('Please fill in all field names and labels');
        return;
      }

      // Check if Google is authenticated
      if (!googleAuth.hasToken) {
        setError('Google authentication required. Please go to Home page and click "Google Login" first.');
        return;
      }

      try {
        setIsLoading(true);
        
        // Call createCamp API
        const result = await api.createCamp(campInfo.name, fields);
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to create camp');
        }

        // Store camp data for summary
        setCampData(result.data);
        setStep(3);
      } catch (err) {
        setError(err.message || 'Error creating camp. Please try again.');
        console.error('Camp creation error:', err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Step 3: Summary
    if (step === 3) {
      setStep(Math.min(step + 1, 3));
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleBackButton = () => {
    if (step === 1) {
      navigate('/');
    } else {
      prevStep();
    }
  };

  const handleNextButton = () => {
    if (step === 3) {
      navigate('/');
    } else {
      handleNextStep();
    }
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Create New Camp</h1>
          <p className="page-subtitle">Follow the steps to create a new camp registration form</p>
        </div>

        {/* Auth Status Warning */}
        {googleAuth.checked && !googleAuth.hasToken && (
          <div className="auth-warning">
            <span className="auth-warning-icon">⚠️</span>
            <div>
              <div className="auth-warning-title">Google authentication required</div>
              <div className="auth-warning-text">
                Please go to the Home page and click "🔐 Google Login" to authenticate before creating a camp.
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="stepper">
          {['General Info', 'Registration Form', 'Camp Summary'].map((label, index) => (
            <div key={index} className="stepper-item">
              <div className={`stepper-circle ${step === index + 1 ? 'active' : 'inactive'}`}>
                {index + 1}
              </div>
              <div className={`stepper-label ${step === index + 1 ? 'active' : 'inactive'}`}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="error-message-box">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="step-content">
          {step === 1 && <GeneralInfo campInfo={campInfo} setCampInfo={setCampInfo} />}
          {step === 2 && <RegistrationForm fields={fields} setFields={setFields} />}
          {step === 3 && <CampSummary campInfo={campInfo} fields={fields} campData={campData} />}
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <div className="loading-text">
                Creating your camp... This may take a few moments
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="navigation-buttons">
          {step !== 3 && (
            <button 
              onClick={handleBackButton} 
              disabled={isLoading}
              className="nav-button back-button"
            >
              {step === 1 ? 'Home' : 'Back'}
            </button>
          )}
          <button 
            onClick={handleNextButton} 
            disabled={isLoading || (step === 2 && !googleAuth.hasToken)}
            className="nav-button next-button"
            style={step === 3 ? { marginLeft: 'auto' } : {}}
          >
            {isLoading ? 'Creating Camp...' : step === 3 ? 'Home' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}