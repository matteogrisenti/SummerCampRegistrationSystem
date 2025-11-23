import { useState, useEffect } from 'react'
import CampsGrid from './components/CampsGrid'
import OAuthModal from './components/OAuthModal'
import { api } from '../../api'
import './Home.css'

export default function Home() {
    const [error, setError] = useState(null)
    const [backendAvailable, setBackendAvailable] = useState(false)
    const [appLoaded, setAppLoaded] = useState(false)
    const [googleAuth, setGoogleAuth] = useState({ 
        hasCredentials: false, 
        hasToken: false, 
        checked: false 
    })
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [showCodeInput, setShowCodeInput] = useState(false)

    useEffect(() => {
        checkBackend()
    }, [])

    useEffect(() => {
        if (!isAuthenticating || !showCodeInput) return
        
        const pollInterval = setInterval(async () => {
            try {
                const authStatus = await api.checkGoogleAuth()
                if (authStatus.success && authStatus.hasToken) {
                    setGoogleAuth({ ...authStatus, checked: true })
                    setIsAuthenticating(false)
                    setTimeout(() => {
                        setShowCodeInput(false)
                    }, 1000)
                }
            } catch (err) {
                console.error('Error polling auth status:', err)
            }
        }, 2000)
        
        return () => clearInterval(pollInterval)
    }, [isAuthenticating, showCodeInput])

    const checkBackend = async () => {
        try {
            const available = await api.checkHealth()
            setBackendAvailable(available)
            
            if (available) {
                const authStatus = await api.checkGoogleAuth()
                if (authStatus.success) {
                    setGoogleAuth({ ...authStatus, checked: true })
                } else {
                    setGoogleAuth({ hasCredentials: false, hasToken: false, checked: true })
                }
            } else {
                setGoogleAuth({ hasCredentials: false, hasToken: false, checked: true })
            }
        } catch (err) {
            console.error('Error checking backend:', err)
            setBackendAvailable(false)
            setGoogleAuth({ hasCredentials: false, hasToken: false, checked: true })
        } finally {
            setAppLoaded(true)
        }
    }

    const handleGoogleLogin = async () => {
        setIsAuthenticating(true)
        setError(null)
        
        try {
            const loginUrl = await api.getGoogleLoginUrl()
            
            if (window.electronApi?.openUrl) {
                window.electronApi.openUrl(loginUrl)
            } else {
                window.open(loginUrl, '_blank')
            }
            
            setShowCodeInput(true)
        } catch (err) {
            setError(`Authentication error: ${err.message}`)
            setIsAuthenticating(false)
        }
    }

    const handleCancelAuth = () => {
        setShowCodeInput(false)
        setIsAuthenticating(false)
        setError(null)
    }

    if (!appLoaded) {
        return (
            <div className="loading-screen">
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
                <div>Loading application...</div>
            </div>
        )
    }

    return (
        <div className="home-container">
            <div className="home-header">
                <div className="header-content">
                    <div className="header-title">
                        <h1>⛺ Parish Summer Camp Registration</h1>
                        <p>Manage and analyze your summer camp registrations</p>
                        <div className={`backend-status ${backendAvailable ? 'active' : 'local'}`}>
                            {backendAvailable ? '✓ Backend processing active' : '⚠ Running in local mode'}
                        </div>
                    </div>
                    
                    <div className="header-actions">
                        {googleAuth.checked && (
                            <div className={`auth-status ${googleAuth.hasToken ? 'authenticated' : 'not-authenticated'}`}>
                                {googleAuth.hasToken ? (
                                    <>✓ Google authenticated</>
                                ) : (
                                    <>⚠ Not authenticated</>
                                )}
                            </div>
                        )}
                        
                        {!googleAuth.hasToken && backendAvailable && (
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isAuthenticating}
                                className="google-login-btn"
                            >
                                🔐 {isAuthenticating ? 'Authenticating...' : 'Google Login'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            {/* Camps Grid Section */}
            <CampsGrid />

            {/* OAuth Modal */}
            {showCodeInput && (
                <OAuthModal
                    isAuthenticating={isAuthenticating}
                    error={error}
                    onCancel={handleCancelAuth}
                    onClose={() => setShowCodeInput(false)}
                />
            )}
        </div>
    )
}