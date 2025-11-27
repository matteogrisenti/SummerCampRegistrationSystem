import React, { useState, useEffect } from 'react';
import './RegistrationModal.css';

export default function RegistrationModal({ isOpen, onClose, registration, onSave }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (registration) {
            setFormData({ ...registration });
        }
        setIsEditing(false);
    }, [registration, isOpen]);

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
                    <h2>Registration Details</h2>
                    <div className="modal-actions">
                        {!isEditing ? (
                            <button className="btn-modify" onClick={handleModify}>Modify</button>
                        ) : (
                            <>
                                <button className="btn-discard" onClick={handleDiscard}>Discard</button>
                                <button className="btn-accept" onClick={handleAccept}>Accept</button>
                            </>
                        )}
                        <button className="btn-close" onClick={onClose}>&times;</button>
                    </div>
                </div>
                <div className="modal-body">
                    {Object.keys(formData).filter(k => k !== 'Timestamp' && k !== 'status').map(key => (
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
