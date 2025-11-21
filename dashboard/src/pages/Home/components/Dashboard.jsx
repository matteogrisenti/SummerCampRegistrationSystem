import RegistrationStats from './RegistrationStats'
import InvalidTable from './InvalidTable'
import SiblingsTable from './SiblingsTable'

function Dashboard({ data }) {
  const { registrations, invalid, siblings } = data

  const stats = {
    total: registrations.length,
    valid: registrations.length - invalid.length,
    invalid: invalid.length,
    siblings: siblings.reduce((sum, group) => sum + group.Number_of_Children, 0)
  }

  return (
    <div className="dashboard">
      <RegistrationStats stats={stats} />
      
      {invalid.length > 0 && (
        <InvalidTable data={invalid} />
      )}
      
      {siblings.length > 0 && (
        <SiblingsTable data={siblings} />
      )}

      {invalid.length === 0 && siblings.length === 0 && (
        <div className="section">
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <h3>All Clear!</h3>
            <p>No invalid registrations or sibling groups detected.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard