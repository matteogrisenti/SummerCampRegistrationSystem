import { useState, useEffect } from 'react';
import { api } from '../../api';
import GeneralInfo from './steps/GeneralInfo';
import RegistrationForm from './steps/RegistrationForm';
import CampSummary from './steps/CampSummary';

export default function NewCamp() {
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
    { id: 2, name: 'child_name', label: 'Child Full Name', description: 'Full name of the child', required: true, removable: true },
    { id: 3, name: 'child_age', label: 'Child Age', description: 'Age of the child', required: true, removable: true },
    { id: 4, name: 'parent_name', label: 'Parent/Guardian Name', description: 'Name of parent or guardian', required: true, removable: true },
    { id: 5, name: 'parent_email', label: 'Parent Email', description: 'Email address for contact', required: true, removable: true },
    { id: 6, name: 'phone', label: 'Phone Number', description: 'Contact phone number', required: true, removable: true },
    { id: 7, name: 'allergies', label: 'Allergies/Medical Info', description: 'Any allergies or medical information', required: false, removable: true }
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

  return (
    <div style={{ minHeight: '100vh', padding: '24px', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Create New Camp</h1>
          <p style={{ color: '#666' }}>Follow the steps to create a new camp registration form</p>
        </div>

        {/* Auth Status Warning */}
        {googleAuth.checked && !googleAuth.hasToken && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#856404',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <strong>Google authentication required</strong>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                Please go to the Home page and click "🔐 Google Login" to authenticate before creating a camp.
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          {['General Info', 'Registration Form', 'Camp Summary'].map((label, index) => (
            <div key={index} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: '30px',
                height: '30px',
                margin: '0 auto 8px',
                borderRadius: '50%',
                backgroundColor: step === index + 1 ? '#2196F3' : '#ccc',
                color: 'white',
                lineHeight: '30px'
              }}>{index + 1}</div>
              <div style={{ fontSize: '12px', color: step === index + 1 ? '#2196F3' : '#999' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            border: '1px solid #ef5350',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#c62828'
          }}>
            {error}
          </div>
        )}

        {/* Step content */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {step === 1 && <GeneralInfo campInfo={campInfo} setCampInfo={setCampInfo} />}
          {step === 2 && <RegistrationForm fields={fields} setFields={setFields} />}
          {step === 3 && <CampSummary campInfo={campInfo} fields={fields} campData={campData} />}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <button 
            onClick={prevStep} 
            disabled={step === 1 || isLoading}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              cursor: step === 1 || isLoading ? 'not-allowed' : 'pointer',
              opacity: step === 1 || isLoading ? 0.6 : 1
            }}
          >
            Back
          </button>
          <button 
            onClick={handleNextStep} 
            disabled={step === 3 || isLoading || (step === 2 && !googleAuth.hasToken)}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: 'none', 
              backgroundColor: '#2196F3', 
              color: 'white',
              cursor: step === 3 || isLoading || (step === 2 && !googleAuth.hasToken) ? 'not-allowed' : 'pointer',
              opacity: step === 3 || isLoading || (step === 2 && !googleAuth.hasToken) ? 0.6 : 1
            }}
          >
            {isLoading ? 'Creating Camp...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
