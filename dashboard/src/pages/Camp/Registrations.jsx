import { useEffect, useState } from 'react';
import { api } from '../../api';
import './Registrations.css';
import RegistrationModal from './RegistrationModal';

export default function Registrations({ camp, registrations, setRegistrations, setProcessingData }) {
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteRegistration = async (e, registrationId) => {
    e.stopPropagation(); // Prevent row click
    if (!window.confirm('Are you sure you want to delete this registration?')) return;
    try {
      const result = await api.deleteRegistration(camp.camp_slug, registrationId);
      if (result.success) {
        setRegistrations(result.data);
        setProcessingData(result.processedData);
      }
      else alert('Failed to delete registration ' + registrationId + ': ' + result.error);
    } catch (err) {
      console.error(err);
      alert('[BACKEND] Failed to delete registration ' + registrationId + ': ' + err.message);
    }
  };

  const handleAddRegistration = () => {
    // Create an empty registration object based on the structure of existing registrations
    const emptyRegistration = registrations.length > 0
      ? Object.keys(registrations[0]).reduce((acc, key) => {
        acc[key] = key === 'ID' ? null : ''; // ID will be null for new registrations
        return acc;
      }, {})
      : { ID: null }; // Fallback if no registrations exist yet

    setSelectedRegistration(emptyRegistration);
    setIsModalOpen(true);
  };

  const handleRowClick = (registration) => {
    setSelectedRegistration(registration);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRegistration(null);
  };

  const handleSaveRegistration = async (updatedRegistration) => {
    try {
      // Check if this is a new registration (no ID) or an existing one
      const isNewRegistration = !updatedRegistration.ID;
      const result = isNewRegistration
        ? await api.postRegistration(camp.camp_slug, updatedRegistration)
        : await api.modifyRegistration(camp.camp_slug, updatedRegistration);

      if (result.success) {
        setRegistrations(result.data);
        setProcessingData(result.processedData);
        handleCloseModal();
      } else {
        alert(`Failed to ${isNewRegistration ? 'add' : 'modify'} registration: ` + result.error);
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to ${updatedRegistration.ID ? 'modify' : 'add'} registration`);
    }
  };

  if (registrations.length === 0) return <p>No registrations yet</p>;

  // Filter out columns we don't want to display
  const columns = Object.keys(registrations[0]).filter(
    key => key !== 'Timestamp' && key !== 'acceptance_status' && key !== 'error'
  );

  // Helper function to get row background color based on status
  const getRowClassName = (status) => {
    if (status === 'invalid') return 'row-invalid';
    if (status === 'duplicate') return 'row-duplicate';
    return 'row-valid';
  };

  return (
    <div className="camp-details-registrations-section">
      <div className="camp-details-registrations-header">
        <h2>Registration List</h2>
        <button onClick={handleAddRegistration}>+ Add Registration</button>
      </div>

      <div className="camp-details-table-container">
        <table className="camp-details-table">
          <thead>
            <tr>
              {columns.map(col => <th key={col} style={{ minWidth: '120px' }}>{col.replace(/_/g, ' ').toUpperCase()}</th>)}
              <th style={{ minWidth: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map(reg => (
              <tr
                key={reg.ID}
                onClick={() => handleRowClick(reg)}
                className={getRowClassName(reg.status)}
                style={{ cursor: 'pointer' }}
              >
                {columns.map(col => (
                  <td key={col}
                    style={{
                      minWidth: '120px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                    {reg[col] || 'N/A'}
                  </td>
                ))}
                <td>
                  <button onClick={(e) => handleDeleteRegistration(e, reg.ID)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        registration={selectedRegistration}
        onSave={handleSaveRegistration}
      />
    </div>
  );
}
