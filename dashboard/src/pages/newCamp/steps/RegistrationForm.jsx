import { Plus, Trash2, GripVertical } from 'lucide-react';

export default function RegistrationForm({ fields, setFields }) {

    const nextId = Math.max(...fields.map(f => f.id)) + 1;

    const handleFieldChange = (id, field, value) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
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

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#333' }}>
                    Registration Form Fields
                </h2>
                <button
                    onClick={addField}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    <Plus size={16} />
                    Add Field
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {fields.map((field) => (
                    <div
                        key={field.id}
                        style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: '#fafafa'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ paddingTop: '10px', cursor: 'grab', color: '#999' }}>
                                <GripVertical size={20} />
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                                            Field Name
                                        </label>
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                                            disabled={!field.removable}
                                            placeholder="e.g., emergency_contact"
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px',
                                                border: '1px solid #d0d0d0',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                boxSizing: 'border-box',
                                                backgroundColor: field.removable ? 'white' : '#f0f0f0'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                                            Label
                                        </label>
                                        <input
                                            type="text"
                                            value={field.label}
                                            onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                                            placeholder="e.g., Emergency Contact"
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px',
                                                border: '1px solid #d0d0d0',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={field.description}
                                        onChange={(e) => handleFieldChange(field.id, 'description', e.target.value)}
                                        placeholder="Brief description of this field"
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            border: '1px solid #d0d0d0',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        id={`required-${field.id}`}
                                        checked={field.required}
                                        onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label
                                        htmlFor={`required-${field.id}`}
                                        style={{ fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}
                                    >
                                        Required field
                                    </label>
                                </div>
                            </div>

                            {field.removable && (
                                <button
                                    onClick={() => removeField(field.id)}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: '#ff4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        marginTop: '6px'
                                    }}
                                    title="Remove field"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
