export default function GeneralInfo({ campInfo, setCampInfo }) {

  const handleCampInfoChange = (e) => {
    const { name, value } = e.target;
    setCampInfo(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>    
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>
          General Information
        </h2>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
            Camp Name *
          </label>
          <input
            type="text"
            name="name"
            value={campInfo.name}
            onChange={handleCampInfoChange}
            placeholder="e.g., 1° Summer Camp"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
            Period *
          </label>
          <input
            type="text"
            name="period"
            value={campInfo.period}
            onChange={handleCampInfoChange}
            placeholder="e.g., 15-30 August 2026"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={campInfo.location}
            onChange={handleCampInfoChange}
            placeholder="e.g., Monclassico"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>
    </> 
  );
}
