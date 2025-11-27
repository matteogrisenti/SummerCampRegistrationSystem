import { useEffect, useState } from 'react';
import { api } from '../../api';
import './Registrations.css';
import RegistrationModal from './RegistrationModal';

export default function Registrations({ camp, registrations, setRegistrations }) {
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteRegistration = async (e, registrationId) => {
    e.stopPropagation(); // Prevent row click
    if (!window.confirm('Are you sure you want to delete this registration?')) return;
    try {
      const result = await api.deleteRegistration(camp.camp_slug, registrationId);
      if (result.success) setRegistrations(result.data);
      else alert('Failed to delete registration ' + registrationId + ': ' + result.error);
    } catch (err) {
      console.error(err);
      alert('[BACKEND] Failed to delete registration ' + registrationId + ': ' + err.message);
    }
  };

  const handleAddRegistration = () => alert('Add registration feature');

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
      const result = await api.modifyRegistration(camp.camp_slug, updatedRegistration);
      if (result.success) {
        setRegistrations(result.data);
        handleCloseModal();
      } else {
        alert('Failed to modify registration: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to modify registration');
    }
  };

  if (registrations.length === 0) return <p>No registrations yet</p>;

  const columns = Object.keys(registrations[0]).filter(key => key !== 'Timestamp');

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
              <tr key={reg.id} onClick={() => handleRowClick(reg)} style={{ cursor: 'pointer' }}>
                {columns.map(col => (
                  <td key={col}
                    style={{
                      minWidth: '120px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      backgroundColor:
                        reg.status === 'invalid' ? '#f8d7da' :  // red-ish
                          reg.status === 'duplicate' ? '#fff3cd' : // yellow-ish
                            '#f4f4f4'                                // green-ish for valid
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
