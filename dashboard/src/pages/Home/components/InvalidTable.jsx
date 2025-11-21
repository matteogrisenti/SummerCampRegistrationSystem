function InvalidTable({ data }) {
  if (data.length === 0) return null

  return (
    <div className="section">
      <h2>🚨 Invalid Registrations ({data.length})</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Row</th>
              <th>Issues</th>
              <th>Child Name</th>
              <th>Parent Email</th>
              <th>Parent Name</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td>{row.Row_Number || idx + 1}</td>
                <td style={{ color: '#e74c3c', fontWeight: 500 }}>
                  {row.Validation_Issues}
                </td>
                <td>{row['Child Full Name'] || row['Child Name'] || '-'}</td>
                <td>{row['Parent Email'] || '-'}</td>
                <td>{row['Parent/Guardian Name'] || row['Parent Name'] || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InvalidTable