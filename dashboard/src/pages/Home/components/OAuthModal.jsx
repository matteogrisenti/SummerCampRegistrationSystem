import '../Home.css'

export default function OAuthModal({ isAuthenticating, error, onCancel, onClose }) {
    return (
        <div className="oauth-modal-overlay">
            <div className="oauth-modal">
                <h2>🔐 Google Authorization</h2>

                {isAuthenticating ? (
                    <>
                        <div className="oauth-spinner">⏳</div>
                        <p className="oauth-text">Waiting for authorization...</p>
                        <p className="oauth-subtext">
                            A browser window has opened. Log in with your Google account and grant permissions.
                        </p>
                        
                        {error && (
                            <div className="error-message" style={{ marginTop: '20px' }}>
                                ✗ {error}
                            </div>
                        )}
                        
                        <button
                            onClick={onCancel}
                            className="oauth-button secondary"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <p className="oauth-text">✓ Authorization complete!</p>
                        <p className="oauth-subtext">
                            You can close this window and return to the app.
                        </p>
                        <button
                            onClick={onClose}
                            className="oauth-button primary"
                        >
                            Close
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}