import React, { useState, useEffect } from 'react';
import { costCenterService, CostCenter } from '../../services/costCenter.service';
import { userService } from '../../services/user.service';
import { BaseModal } from '../common/BaseModal';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CostCentersTabProps {
  onUpdate: () => void;
}

const CostCentersTab: React.FC<CostCentersTabProps> = ({ onUpdate }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCostCenter) {
        await costCenterService.update(editingCostCenter.id, formData);
      } else {
        await costCenterService.create(formData);
      }
      setShowModal(false);
      setEditingCostCenter(null);
      setFormData({ code: '', name: '', description: '', managerId: '' });
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error('Error saving cost center:', error);
      alert(error.response?.data?.message || 'Fehler beim Speichern');
    }
  };

  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    setFormData({
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description || '',
      managerId: costCenter.managerId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Kostenstelle wirklich löschen?')) {
      return;
    }
    try {
      await costCenterService.delete(id);
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting cost center:', error);
      alert(error.response?.data?.message || 'Fehler beim Löschen');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCostCenter(null);
    setFormData({ code: '', name: '', description: '', managerId: '' });
  };

  if (loading) {
    return <div>Laden...</div>;
  }

  return (
    <div className="tab-content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Kostenstellen</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Inaktive anzeigen
          </label>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Neue Kostenstelle
          </button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Beschreibung</th>
            <th>Manager</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {costCenters.map((cc) => (
            <tr key={cc.id} style={{ opacity: cc.isActive ? 1 : 0.5 }}>
              <td><strong>{cc.code}</strong></td>
              <td>{cc.name}</td>
              <td>{cc.description || '-'}</td>
              <td>
                {cc.manager 
                  ? `${cc.manager.firstName} ${cc.manager.lastName}` 
                  : '-'}
              </td>
              <td>
                <span className={`status-badge ${cc.isActive ? 'status-active' : 'status-inactive'}`}>
                  {cc.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              <td>
                <button 
                  onClick={() => handleEdit(cc)} 
                  className="btn btn-small"
                  style={{ marginRight: '5px' }}
                >
                  Bearbeiten
                </button>
                <button 
                  onClick={() => handleDelete(cc.id)} 
                  className="btn btn-small btn-danger"
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <BaseModal
          isOpen={showModal}
          onClose={handleCloseModal}
        >
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
                placeholder="z.B. Marketing"
              />
            </div>

            <div className="form-group">
              <label>Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
              >
                <option value="">-- Kein Manager --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                Abbrechen
              </button>
              <button type="submit" className="btn btn-primary">
                {editingCostCenter ? 'Aktualisieren' : 'Erstellen'}
              </button>
            </div>
          </form>
        </BaseModal>
      )}
    </div>
  );
};

export default CostCentersTab;
