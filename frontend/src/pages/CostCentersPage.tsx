import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { costCenterService, CostCenter } from '../services/costCenter.service';
import { userService } from '../services/user.service';
import '../App.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const CostCentersPage: React.FC = () => {
  const navigate = useNavigate();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    managerId: ''
  });

  useEffect(() => {
    loadData();
  }, [includeInactive]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [costCentersData, usersData] = await Promise.all([
        costCenterService.getAll(includeInactive),
        userService.getAllUsers()
      ]);
      setCostCenters(costCentersData);
      setUsers(usersData.filter((u: User) => u.id));
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (costCenter?: CostCenter) => {
    if (costCenter) {
      setEditingCostCenter(costCenter);
      setFormData({
        code: costCenter.code,
        name: costCenter.name,
        description: costCenter.description || '',
        managerId: costCenter.managerId || ''
      });
    } else {
      setEditingCostCenter(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        managerId: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCostCenter(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      managerId: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      alert('Code und Name sind erforderlich');
      return;
    }

    try {
      if (editingCostCenter) {
        await costCenterService.update(editingCostCenter.id, formData);
      } else {
        await costCenterService.create(formData);
      }
      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error('Error saving cost center:', error);
      alert(error.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  const handleDelete = async (costCenter: CostCenter) => {
    if (!window.confirm(`Kostenstelle "${costCenter.name}" wirklich löschen?`)) {
      return;
    }

    try {
      await costCenterService.delete(costCenter.id);
      loadData();
    } catch (error: any) {
      console.error('Error deleting cost center:', error);
      alert(error.response?.data?.error || 'Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar title="Kostenstellen" />
        <div className="loading">Lade Kostenstellen...</div>
      </>
    );
  }

  return (
    <>
      <AppNavbar title="Kostenstellen" />
      <div className="page-container">
        <div className="page-header">
          <h1>Kostenstellen</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              Inaktive anzeigen
            </label>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              + Neue Kostenstelle
            </button>
          </div>
        </div>

        <div className="card">
          <div className="data-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Beschreibung</th>
                  <th>Verantwortlicher</th>
                  <th>Zeiteinträge</th>
                  <th>Rechnungen</th>
                  <th>Bestellungen</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {costCenters.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#999' }}>
                      Keine Kostenstellen vorhanden
                    </td>
                  </tr>
                ) : (
                  costCenters.map((costCenter) => (
                    <tr key={costCenter.id} className={!costCenter.isActive ? 'inactive-row' : ''}>
                      <td><strong>{costCenter.code}</strong></td>
                      <td>{costCenter.name}</td>
                      <td>{costCenter.description || '-'}</td>
                      <td>
                        {costCenter.manager
                          ? `${costCenter.manager.firstName} ${costCenter.manager.lastName}`
                          : '-'}
                      </td>
                      <td>{costCenter._count?.timeEntries || 0}</td>
                      <td>{costCenter._count?.invoices || 0}</td>
                      <td>{costCenter._count?.orders || 0}</td>
                      <td>
                        <span className={`status-badge ${costCenter.isActive ? 'approved' : 'rejected'}`}>
                          {costCenter.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenModal(costCenter)}
                            title="Bearbeiten"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(costCenter)}
                            title="Löschen"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingCostCenter ? 'Kostenstelle bearbeiten' : 'Neue Kostenstelle'}</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="z.B. KST-001"
                  />
                </div>

                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="z.B. Verwaltung"
                  />
                </div>

                <div className="form-group">
                  <label>Beschreibung</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Optionale Beschreibung"
                  />
                </div>

                <div className="form-group">
                  <label>Verantwortlicher</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">Kein Verantwortlicher</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Abbrechen
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCostCenter ? 'Speichern' : 'Erstellen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CostCentersPage;
