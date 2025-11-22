function RegistrationStats({ stats }) {
  const validPercentage = ((stats.valid / stats.total) * 100).toFixed(1)

  return (
    <div className="stats-grid">
      <div className="stat-card total">
        <div className="stat-label">Total Registrations</div>
        <div className="stat-value">{stats.total}</div>
      </div>

      <div className="stat-card valid">
        <div className="stat-label">Valid Registrations</div>
        <div className="stat-value">
          {stats.valid}
          <span style={{ fontSize: '1rem', marginLeft: '0.5rem', color: '#7f8c8d' }}>
            ({validPercentage}%)
          </span>
        </div>
      </div>

      <div className="stat-card invalid">
        <div className="stat-label">Invalid Registrations</div>
        <div className="stat-value">{stats.invalid}</div>
      </div>

      <div className="stat-card siblings">
        <div className="stat-label">Children in Sibling Groups</div>
        <div className="stat-value">{stats.siblings}</div>
      </div>
    </div>
  )
}

export default RegistrationStats