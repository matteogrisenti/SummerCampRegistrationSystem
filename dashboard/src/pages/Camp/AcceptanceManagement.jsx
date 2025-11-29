import { useState, useEffect } from 'react';
import { api } from '../../api';
import './AcceptanceManagement.css';

export default function AcceptanceManagement({ camp, registrations, setRegistrations, setProcessingData }) {
    const [selectedRegistrations, setSelectedRegistrations] = useState(new Set());
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, accepted, rejected

    // Filter and sort registrations based on acceptance status
    // Sort order: Accepted → Pending → Rejected
    const filteredRegistrations = registrations
        .filter(reg => {
            if (filterStatus === 'all') return true;
            if (filterStatus === 'pending') return !reg.acceptance_status || reg.acceptance_status === 'pending';
            return reg.acceptance_status === filterStatus;
        })
        .sort((a, b) => {
            // Define sort priority: accepted = 1, pending = 2, rejected = 3
            const getStatusPriority = (status) => {
                if (status === 'accepted') return 1;
                if (status === 'rejected') return 3;
                return 2; // pending or undefined
            };

            const priorityA = getStatusPriority(a.acceptance_status);
            const priorityB = getStatusPriority(b.acceptance_status);

            return priorityA - priorityB;
        });

    const handleSelectRegistration = (registration) => {
        const newSelected = new Set(selectedRegistrations);
        if (newSelected.has(registration)) {
            newSelected.delete(registration);
        } else {
            newSelected.add(registration);
        }
        setSelectedRegistrations(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedRegistrations.size === filteredRegistrations.length) {
            setSelectedRegistrations(new Set());
        } else {
            setSelectedRegistrations(filteredRegistrations);
        }
    };

    const handleAcceptSelected = async () => {
        if (selectedRegistrations.size === 0) {
            alert('Please select at least one registration');
            return;
        }

        try {
            const result = await api.updateAcceptanceStatus(
                camp.camp_slug,
                Array.from(selectedRegistrations),
                'accepted'
            );

            if (result.success) {
                setRegistrations(result.data);
                setProcessingData(result.processedData);
                setSelectedRegistrations(new Set());
                alert(`${selectedRegistrations.size} registration(s) accepted successfully`);
            } else {
                alert('Failed to accept registrations: ' + result.error);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to accept registrations');
        }
    };

    const handleRejectSelected = async () => {
        if (selectedRegistrations.size === 0) {
            alert('Please select at least one registration');
            return;
        }

        if (!window.confirm(`Are you sure you want to reject ${selectedRegistrations.size} registration(s)?`)) {
            return;
        }

        try {
            const result = await api.updateAcceptanceStatus(
                camp.camp_slug,
                Array.from(selectedRegistrations),
                'rejected'
            );

            if (result.success) {
                setRegistrations(result.data);
                setProcessingData(result.processedData);
                setSelectedRegistrations(new Set());
                alert(`${selectedRegistrations.size} registration(s) rejected successfully`);
            } else {
                alert('Failed to reject registrations: ' + result.error);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to reject registrations');
        }
    };

    const handleResetSelected = async () => {
        if (selectedRegistrations.size === 0) {
            alert('Please select at least one registration');
            return;
        }

        try {
            const result = await api.updateAcceptanceStatus(
                camp.camp_slug,
                Array.from(selectedRegistrations),
                'pending'
            );

            if (result.success) {
                setRegistrations(result.data);
                setProcessingData(result.processedData);
                setSelectedRegistrations(new Set());
                alert(`${selectedRegistrations.size} registration(s) reset to pending`);
            } else {
                alert('Failed to reset registrations: ' + result.error);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to reset registrations');
        }
    };

    if (registrations.length === 0) return <p>No registrations yet</p>;

    const columns = Object.keys(registrations[0]).filter(
        key => key !== 'Timestamp' && key !== 'acceptance_status' && key !== '_errors' && key !== 'status'
    );

    const getStatusBadge = (status) => {
        if (!status || status === 'pending') return <span className="status-badge status-pending">Pending</span>;
        if (status === 'accepted') return <span className="status-badge status-accepted">✓ Accepted</span>;
        if (status === 'rejected') return <span className="status-badge status-rejected">✗ Rejected</span>;
    };

    const getRowClassName = (status) => {
        if (!status || status === 'pending') return '';
        if (status === 'accepted') return 'row-accepted';
        if (status === 'rejected') return 'row-rejected';
        return '';
    };

    return (
        <div className="acceptance-management-section">
            <div className="acceptance-management-header">
                <h2>Acceptance Management</h2>
                <div className="acceptance-management-stats">
                    <span className="stat-item">
                        <strong>Accepted:</strong> {registrations.filter(r => r.acceptance_status === 'accepted').length}
                    </span>
                    <span className="stat-item">
                        <strong>Rejected:</strong> {registrations.filter(r => r.acceptance_status === 'rejected').length}
                    </span>
                    <span className="stat-item">
                        <strong>Pending:</strong> {registrations.filter(r => !r.acceptance_status || r.acceptance_status === 'pending').length}
                    </span>
                </div>
            </div>

            <div className="acceptance-management-controls">
                <div className="filter-controls">
                    <label>Filter by status:</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">All Registrations</option>
                        <option value="pending">Pending Only</option>
                        <option value="accepted">Accepted Only</option>
                        <option value="rejected">Rejected Only</option>
                    </select>
                </div>

                <div className="action-controls">
                    <button onClick={handleSelectAll} className="btn-select-all">
                        {selectedRegistrations.size === filteredRegistrations.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button onClick={handleAcceptSelected} className="btn-accept" disabled={selectedRegistrations.size === 0}>
                        ✓ Accept Selected ({selectedRegistrations.size})
                    </button>
                    <button onClick={handleRejectSelected} className="btn-reject" disabled={selectedRegistrations.size === 0}>
                        ✗ Reject Selected ({selectedRegistrations.size})
                    </button>
                    <button onClick={handleResetSelected} className="btn-reset" disabled={selectedRegistrations.size === 0}>
                        ↺ Reset Selected ({selectedRegistrations.size})
                    </button>
                </div>
            </div>

            <div className="acceptance-table-container">
                <table className="acceptance-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedRegistrations.size === filteredRegistrations.length && filteredRegistrations.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th style={{ width: '120px' }}>Status</th>
                            {columns.map(col => (
                                <th key={col} style={{ minWidth: '120px' }}>
                                    {col.replace(/_/g, ' ').toUpperCase()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRegistrations.map(reg => (
                            <tr
                                key={reg.ID}
                                className={getRowClassName(reg.acceptance_status)}
                            >
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedRegistrations.has(reg)}
                                        onChange={() => handleSelectRegistration(reg)}
                                    />
                                </td>
                                <td>{getStatusBadge(reg.acceptance_status)}</td>
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
