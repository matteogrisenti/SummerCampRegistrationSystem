function SiblingsTable({ data }) {
  if (data.length === 0) return null

  return (
    <div className="section">
      <h2>👨‍👩‍👧‍👦 Sibling Groups ({data.length} families)</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Parent Email</th>
              <th>Children Count</th>
              <th>Children Names</th>
              <th>Excel Rows</th>
            </tr>
          </thead>
          <tbody>
            {data.map((group, idx) => (
              <tr key={idx}>
                <td>{group.Parent_Email}</td>
                <td style={{ fontWeight: 600, color: '#9b59b6' }}>
                  {group.Number_of_Children}
                </td>
                <td>{group.Children_Names}</td>
                <td style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                  {group.Row_Numbers}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SiblingsTable