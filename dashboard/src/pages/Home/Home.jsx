import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import Dashboard from './components/Dashboard'
import AddCampButton from "./components/AddCampButton"
import { api } from '../../api'

export default function Home() {
    const [data, setData] = useState(null)
    const [fileName, setFileName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [backendAvailable, setBackendAvailable] = useState(false)
    const [useBackend, setUseBackend] = useState(false)
    const [appLoaded, setAppLoaded] = useState(false)
    const [googleAuth, setGoogleAuth] = useState({ hasCredentials: false, hasToken: false, checked: false })
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [showCodeInput, setShowCodeInput] = useState(false)
    const [authCode, setAuthCode] = useState('')
    const [authUrl, setAuthUrl] = useState('')

    useEffect(() => {
        const checkBackend = async () => {
        const available = await api.checkHealth()
        setBackendAvailable(available)
        if (available) setUseBackend(true)
        
        // Check Google auth status
        const authStatus = await api.checkGoogleAuth()
        if (authStatus.success) {
            setGoogleAuth({ ...authStatus, checked: true })
        } else {
            setGoogleAuth({ hasCredentials: false, hasToken: false, checked: true })
        }
        
        setAppLoaded(true)
        }
        checkBackend()
    }, [])

    useEffect(() => {
        // Poll auth status when authenticating
        if (!isAuthenticating || !showCodeInput) return
        
        const pollInterval = setInterval(async () => {
            try {
                const authStatus = await api.checkGoogleAuth()
                if (authStatus.success && authStatus.hasToken) {
                    // Auth complete!
                    setGoogleAuth({ ...authStatus, checked: true })
                    setIsAuthenticating(false)
                    // Show success message for a moment before closing
                    setTimeout(() => {
                        setShowCodeInput(false)
                        setAuthCode('')
                    }, 1000)
                }
            } catch (err) {
                console.error('Error polling auth status:', err)
            }
        }, 2000) // Poll every 2 seconds
        
        return () => clearInterval(pollInterval)
    }, [isAuthenticating, showCodeInput])

    const handleOAuthCode = async (code) => {
        try {
            const result = await api.handleOAuthCallback(code)
            
            if (result.success) {
                // Re-check auth status
                const authStatus = await api.checkGoogleAuth()
                if (authStatus.success) {
                    setGoogleAuth({ ...authStatus, checked: true })
                }
                setShowCodeInput(false)
                setAuthCode('')
            } else {
                setError(`OAuth callback failed: ${result.message}`)
            }
        } catch (err) {
            setError(`Error processing OAuth: ${err.message}`)
        } finally {
            setIsAuthenticating(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsAuthenticating(true)
        setError(null)
        
        try {
            // Get login URL - this also starts the callback server on backend
            const loginUrl = await api.getGoogleLoginUrl()
            setAuthUrl(loginUrl)
            
            // Open the URL in default browser
            if (window.electronApi?.openUrl) {
                window.electronApi.openUrl(loginUrl)
            } else {
                window.open(loginUrl, '_blank')
            }
            
            // Show a message that browser opened
            setShowCodeInput(true)
            
            // Wait for auth to complete (the callback server will handle it automatically)
            // User just needs to authorize in browser, rest happens automatically
        } catch (err) {
            setError(`Authentication error: ${err.message}`)
            setIsAuthenticating(false)
        }
    }

    const handleCodeSubmit = async () => {
        // This function is no longer needed with automatic localhost callback
        // But keep it for reference in case we need manual fallback
    }

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
        {!appLoaded ? (
            <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            fontSize: '18px',
            color: '#7f8c8d'
            }}>
            Loading application...
            </div>
        ) : (
            <>
            <div className="header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>⛺ Parish Summer Camp Registration Dashboard</h1>
                        <p>View and analyze registration data</p>
                        <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.7 }}>
                        {backendAvailable ? (
                            <span style={{ color: 'green' }}>✓ Backend processing active</span>
                        ) : (
                            <span style={{ color: 'orange' }}>⚠ Running in local mode</span>
                        )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        {googleAuth.checked && (
                            <div style={{ fontSize: '12px' }}>
                                {googleAuth.hasToken ? (
                                    <span style={{ color: 'green', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        ✓ Google authenticated
                                    </span>
                                ) : (
                                    <span style={{ color: '#ff9800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        ⚠ Not authenticated
                                    </span>
                                )}
                            </div>
                        )}
                        {!googleAuth.hasToken && (
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isAuthenticating}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#4285F4',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    opacity: isAuthenticating ? 0.7 : 1
                                }}
                            >
                                {isAuthenticating ? 'Authenticating...' : '🔐 Google Login'}
                            </button>
                        )}
                    </div>
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
                
                <AddCampButton onClick={() => console.log("Create Camp!")} />

                {fileName && <div className="file-name">✓ {fileName}</div>}
            </div>

            {error && <div className="error">{error}</div>}

            {loading && <div className="loading">Processing data...</div>}

            {data && <Dashboard data={data} />}

            {/* OAuth Authorization Modal */}
            {showCodeInput && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        maxWidth: '500px',
                        width: '90%',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
                            🔐 Google Authorization
                        </h2>

                        {isAuthenticating ? (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{
                                        fontSize: '40px',
                                        marginBottom: '20px',
                                        animation: 'spin 2s linear infinite'
                                    }}>
                                        ⏳
                                    </div>
                                    <p style={{ color: '#666', fontSize: '16px', marginBottom: '10px' }}>
                                        Waiting for authorization...
                                    </p>
                                    <p style={{ color: '#999', fontSize: '13px' }}>
                                        A browser window has opened. Log in with your Google account and grant permissions.
                                    </p>
                                </div>
                                {error && (
                                    <div style={{
                                        backgroundColor: '#fee',
                                        color: '#c33',
                                        padding: '12px',
                                        borderRadius: '4px',
                                        marginBottom: '15px',
                                        fontSize: '13px'
                                    }}>
                                        ✗ {error}
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setShowCodeInput(false)
                                        setIsAuthenticating(false)
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#f0f0f0',
                                        color: '#333',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <p style={{ color: '#666', fontSize: '16px', marginBottom: '10px' }}>
                                    ✓ Authorization complete!
                                </p>
                                <p style={{ color: '#999', fontSize: '13px', marginBottom: '20px' }}>
                                    You can close this window and return to the app.
                                </p>
                                <button
                                    onClick={() => setShowCodeInput(false)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#4285F4',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Close
                                </button>
                            </>
                        )}

                        <style>{`
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                </div>
            )}
            </>
        )}
        </div>
    )
}
