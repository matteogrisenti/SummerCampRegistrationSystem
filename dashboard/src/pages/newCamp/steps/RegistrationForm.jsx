import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import './RegistrationForm.css';

export default function RegistrationForm({ fields, setFields }) {

    const nextId = Math.max(...fields.map(f => f.id)) + 1;
    const [validationErrors, setValidationErrors] = useState({});

    const validateFields = () => {
        const errors = {};
        fields.forEach(field => {
            if (!field.name.trim()) {
                errors[`${field.id}-name`] = true;
            }
            if (!field.label.trim()) {
                errors[`${field.id}-label`] = true;
            }
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Expose validation function to parent component
    if (typeof window !== 'undefined') {
        window.validateRegistrationFields = validateFields;
    }

    const handleFieldChange = (id, field, value) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
        // Clear validation error when user starts typing
        if (validationErrors[`${id}-${field}`]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${id}-${field}`];
                return newErrors;
            });
        }
    };

    const addField = () => {
        setFields(prev => [...prev, {
            id: nextId,
            name: '',
            label: '',
            description: '',
            required: false,
            removable: true
        }]);
    };

    const removeField = (id) => {
        setFields(prev => prev.filter(f => f.id !== id));
    };

    const moveFieldUp = (index) => {
        if (index <= 1) return; // Can't move up if at index 0 or 1 (timestamp must stay first)
        setFields(prev => {
            const newFields = [...prev];
            [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
            return newFields;
        });
    };

    const moveFieldDown = (index) => {
        if (index === fields.length - 1) return;
        setFields(prev => {
            const newFields = [...prev];
            [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
            return newFields;
        });
    };

    return (
        <>
            <div className="registration-form-header">
                <h2 className="registration-form-title">
                    Registration Form Fields
                </h2>
            </div>

            <div className="fields-container">
                {fields.map((field, index) => (
                    <div key={field.id} className="field-card">
                        <div className="field-card-content">
                            {field.removable && (
                                <div className="arrow-controls">
                                    <button
                                        onClick={() => moveFieldUp(index)}
                                        disabled={index <= 1}
                                        className="arrow-button"
                                        title="Move up"
                                    >
                                        <ChevronUp size={18} />
                                    </button>
                                    <button
                                        onClick={() => moveFieldDown(index)}
                                        disabled={index === fields.length - 1}
                                        className="arrow-button"
                                        title="Move down"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                </div>
                            )}

                            <div className="field-inputs">
                                <div className="field-grid">
                                    <div className="field-group">
                                        <label>Field Name</label>
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                                            disabled={!field.removable}
                                            placeholder="e.g., emergency_contact"
                                            className={`field-input ${validationErrors[`${field.id}-name`] ? 'field-input-error' : ''}`}
                                        />
                                        {validationErrors[`${field.id}-name`] && (
                                            <span className="error-message">Field name is required</span>
                                        )}
                                    </div>

                                    <div className="field-group">
                                        <label>Label</label>
                                        <input
                                            type="text"
                                            value={field.label}
                                            onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                                            placeholder="e.g., Emergency Contact"
                                            className={`field-input ${validationErrors[`${field.id}-label`] ? 'field-input-error' : ''}`}
                                        />
                                        {validationErrors[`${field.id}-label`] && (
                                            <span className="error-message">Label is required</span>
                                        )}
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        value={field.description}
                                        onChange={(e) => handleFieldChange(field.id, 'description', e.target.value)}
                                        placeholder="Brief description of this field"
                                        className="field-input"
                                    />
                                </div>

                                <div className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        id={`required-${field.id}`}
                                        checked={field.required}
                                        onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                                        className="checkbox-input"
                                    />
                                    <label htmlFor={`required-${field.id}`} className="checkbox-label">
                                        Required field
                                    </label>
                                </div>
                            </div>

                            {field.removable && (
                                <button
                                    onClick={() => removeField(field.id)}
                                    className="delete-button"
                                    title="Remove field"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Field Button with horizontal line */}
            <div className="add-field-container">
                <div className="add-field-line"></div>
                <button onClick={addField} className="add-field-button">
                    <Plus size={16} />
                    Add Field
                </button>
            </div>
        </>
    );
}