import { useEffect, useState, useRef } from 'react';
import { api } from '../../api';
import './Registrations.css';
import RegistrationModal from './RegistrationModal';

export default function Registrations({ camp, registrations, setRegistrations, setProcessingData }) {
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tableRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

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
    // Don't open modal if user was dragging
    if (hasDragged) {
      setHasDragged(false);
      return;
    }
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

  // Drag scrolling handlers
  const handleMouseDown = (e) => {
    if (!tableRef.current) return;
    setIsDragging(true);
    setHasDragged(false); // Reset drag state
    setStartX(e.pageX - tableRef.current.offsetLeft);
    setScrollLeft(tableRef.current.scrollLeft);
    tableRef.current.style.cursor = 'grabbing';
    tableRef.current.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    if (!tableRef.current) return;
    setIsDragging(false);
    tableRef.current.style.cursor = 'grab';
    tableRef.current.style.userSelect = 'auto';
  };

  const handleMouseUp = () => {
    if (!tableRef.current) return;
    setIsDragging(false);
    tableRef.current.style.cursor = 'grab';
    tableRef.current.style.userSelect = 'auto';
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !tableRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    if (Math.abs(walk) > 5) { // Only mark as dragged if moved more than 5px
      setHasDragged(true);
    }
    tableRef.current.scrollLeft = scrollLeft - walk;
  };

  if (registrations.length === 0) return <p>No registrations yet</p>;

  // Filter out columns we don't want to display
  const columns = Object.keys(registrations[0]).filter(
    key => key !== 'Timestamp' && key !== 'acceptance_status' && key !== '_errors' && key !== 'status'
  );

  // Helper function to get row background color based on status
  const getRowClassName = (status) => {
    if (status === 'invalid') return 'row-invalid';
    if (status === 'duplicate') return 'row-duplicate';
    return 'row-valid';
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    if (status === 'invalid') return <span className="status-badge status-invalid">✗ Invalid</span>;
    if (status === 'duplicate') return <span className="status-badge status-duplicate">⚠ Duplicate</span>;
    return <span className="status-badge status-valid">✓ Valid</span>;
  };

  return (
    <div className="registrations-section">
      <div className="registrations-header">
        <h2>Registration Management</h2>
        <button onClick={handleAddRegistration}>+ Add Registration</button>
      </div>

      <div
        className="registrations-table-container"
        ref={tableRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ cursor: 'grab' }}
      >
        <table className="registrations-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Status</th>
              {columns.map(col => (
                <th key={col} style={{ minWidth: '120px' }}>
                  {col.replace(/_/g, ' ').toUpperCase()}
                </th>
              ))}
              <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map(reg => (
              <tr
                key={reg.ID}
                onClick={() => handleRowClick(reg)}
                className={getRowClassName(reg.status)}
                title={reg.status === 'invalid' && reg._errors ? reg._errors : ''}
              >
                <td>{getStatusBadge(reg.status)}</td>
                {columns.map(col => (
                  <td
                    key={col}
                    style={{
                      minWidth: '120px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {reg[col] || 'N/A'}
                  </td>
                ))}
                <td className="actions-cell">
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
