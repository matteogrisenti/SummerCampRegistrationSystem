import React, { useState, useEffect } from 'react';
import './RegistrationModal.css';

export default function RegistrationModal({ isOpen, onClose, registration, onSave }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    // Check if this is a new registration (add mode)
    const isAddMode = registration && !registration.ID;

    useEffect(() => {
        if (registration) {
            setFormData({ ...registration });
            // Automatically enable editing mode when adding a new registration
            setIsEditing(isAddMode);
        }
    }, [registration, isOpen, isAddMode]);

    if (!isOpen || !registration) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleModify = () => {
        setIsEditing(true);
    };

    const handleDiscard = () => {
        setFormData({ ...registration });
        setIsEditing(false);
    };

    const handleAccept = () => {
        onSave(formData);
        setIsEditing(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isAddMode ? 'Add Registration' : 'Registration Details'}</h2>
                    <div className="modal-actions">
                        {!isEditing ? (
                            <button className="btn-modify" onClick={handleModify}>Modify</button>
                        ) : (
                            <>
                                <button className="btn-discard" onClick={handleDiscard}>Discard</button>
                                <button className="btn-accept" onClick={handleAccept}>
                                    {isAddMode ? 'Save' : 'Accept'}
                                </button>
                            </>
                        )}
                        <button className="btn-close" onClick={onClose}>&times;</button>
                    </div>
                </div>
                <div className="modal-body">
                    {/* Display error notification if present */}
                    {formData._errors && (
                        <div className="error-notification">
                            <strong>⚠️ Error:</strong> {formData._errors}
                        </div>
                    )}

                    {Object.keys(formData)
                        .filter(k => k !== 'Timestamp' && k !== 'status' && k !== 'acceptance_status' && k !== '_errors')
                        .map(key => (
                            <div key={key} className="form-group">
                                <label>{key.replace(/_/g, ' ')}</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name={key}
                                        value={formData[key] || ''}
                                        onChange={handleChange}
                                        disabled={key === 'id' || key === 'ID'}
                                    />
                                ) : (
                                    <div className="field-value">{formData[key]}</div>
                                )}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
