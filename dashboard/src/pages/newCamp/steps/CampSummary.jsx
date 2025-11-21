export default function CampSummary({ campInfo, fields, campData }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#333' }}>Camp Summary</h2>
            
            {/* General Info */}
            <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: '#666' }}>Camp Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div>
                        <strong>Camp Name:</strong> {campInfo.name}
                    </div>
                    <div>
                        <strong>Period:</strong> {campInfo.period}
                    </div>
                    <div>
                        <strong>Location:</strong> {campInfo.location}
                    </div>
                </div>
            </div>

            {/* Form Fields Summary */}
            <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: '#666' }}>Registration Form Fields</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {fields && fields.map((field) => (
                        <div key={field.id} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{field.label}</span>
                            <span style={{ color: '#999' }}>
                                {field.required && <span style={{ color: '#f44336' }}>Required</span>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Google Form & Sheet Links */}
            {campData && (
                <div style={{ padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: '#2e7d32' }}>✓ Camp Created Successfully!</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                        <div>
                            <strong>Google Form:</strong>
                            <div>
                                <a 
                                    href={campData.form_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#2196F3', textDecoration: 'none' }}
                                >
                                    {campData.form_url}
                                </a>
                            </div>
                        </div>
                        <div>
                            <strong>Google Sheet:</strong>
                            <div>
                                <a 
                                    href={campData.sheet_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#2196F3', textDecoration: 'none' }}
                                >
                                    {campData.sheet_url}
                                </a>
                            </div>
                        </div>
                        <div>
                            <strong>Local Data Path:</strong>
                            <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                                {campData.xlsx_path}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}