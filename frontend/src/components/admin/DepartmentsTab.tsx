import React, { useState, useEffect } from 'react';
import * as departmentService from '../../services/departmentService';
import { Department, DepartmentEmployee } from '../../services/departmentService';
import { BaseModal } from '../common/BaseModal';

interface DepartmentsTabProps {
  onUpdate: () => void;
}

export const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ onUpdate }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [assignModal, setAssignModal] = useState<Department | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = !searchTerm ||
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActive = showInactive || dept.isActive;

    return matchesSearch && matchesActive;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Abteilungsverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingDepartment(null);
            setShowModal(true);
          }}
        >
          Neue Abteilung
        </button>
      </div>

      <div style={{
        position: 'sticky',
        top: '0',
        zIndex: 100,
        background: 'var(--card-bg, #f8f9fa)',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid var(--border-color, #dee2e6)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary, #333)', fontSize: '13px' }}>
          🔍 Filter
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Suche nach Name oder Beschreibung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              minWidth: '300px'
            }}
          />
          <label style={{
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            padding: '10px',
            background: 'white',
            borderRadius: '4px',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={{ width: 'auto', marginRight: '8px', cursor: 'pointer' }}
            />
            Inaktive anzeigen
          </label>
          {(searchTerm || showInactive) && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setShowInactive(false);
              }}
              title="Alle Filter zurücksetzen"
              style={{ padding: '8px 12px' }}
            >
              ✖ Filter zurücksetzen
            </button>
          )}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
          {filteredDepartments.length} von {departments.length} Abteilungen angezeigt
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Beschreibung</th>
            <th>Mitarbeiter</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredDepartments.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Abteilungen gefunden
              </td>
            </tr>
          ) : (
            filteredDepartments.map((dept) => (
              <tr key={dept.id}>
                <td><strong>{dept.name}</strong></td>
                <td>{dept.description || '-'}</td>
                <td>
                  <div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '0.85em',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      cursor: 'pointer',
                    }}
                      onClick={() => setAssignModal(dept)}
                      title="Mitarbeiter verwalten"
                    >
                      {dept.employees?.length || 0} Mitarbeiter
                    </span>
                  </div>
                  {dept.employees && dept.employees.length > 0 && (
                    <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                      {dept.employees.slice(0, 3).map(e => `${e.firstName} ${e.lastName}`).join(', ')}
                      {dept.employees.length > 3 && ` +${dept.employees.length - 3} weitere`}
                    </div>
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: dept.isActive ? '#d4edda' : '#f8d7da',
                    color: dept.isActive ? '#155724' : '#721c24'
                  }}>
                    {dept.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-info"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => setAssignModal(dept)}
                    title="Mitarbeiter zuordnen / entfernen"
                  >
                    👥 Mitarbeiter
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setEditingDepartment(dept);
                      setShowModal(true);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      if (window.confirm(`Abteilung "${dept.name}" wirklich löschen? Alle Mitarbeiter werden aus dieser Abteilung entfernt.`)) {
                        try {
                          await departmentService.deleteDepartment(dept.id);
                          loadDepartments();
                          onUpdate();
                        } catch (error: any) {
                          alert(error.response?.data?.error || 'Fehler beim Löschen');
                        }
                      }
                    }}
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <DepartmentModal
          department={editingDepartment}
          onClose={() => {
            setShowModal(false);
            setEditingDepartment(null);
          }}
          onSave={async (data) => {
            if (editingDepartment) {
              await departmentService.updateDepartment(editingDepartment.id, data);
            } else {
              await departmentService.createDepartment(data);
            }
            setShowModal(false);
            setEditingDepartment(null);
            loadDepartments();
            onUpdate();
          }}
        />
      )}

      {assignModal && (
        <EmployeeAssignmentModal
          department={assignModal}
          onClose={() => {
            setAssignModal(null);
            loadDepartments();
          }}
        />
      )}
    </div>
  );
};

// ---------- Department Create/Edit Modal ----------

const DepartmentModal: React.FC<{
  department: Department | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ department, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || '',
    managerId: department?.managerId || '',
    isActive: department?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Bitte Abteilungsname eingeben');
      return;
    }
    await onSave({
      ...formData,
      managerId: formData.managerId || null,
    });
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} maxWidth="500px">
      <h2>{department ? 'Abteilung bearbeiten' : 'Neue Abteilung'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Beschreibung</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            Aktiv
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className="btn btn-primary">
            Speichern
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

// ---------- Employee Assignment Modal ----------

const EmployeeAssignmentModal: React.FC<{
  department: Department;
  onClose: () => void;
}> = ({ department, onClose }) => {
  const [currentEmployees, setCurrentEmployees] = useState<DepartmentEmployee[]>(department.employees || []);
  const [availableEmployees, setAvailableEmployees] = useState<DepartmentEmployee[]>([]);
  const [searchAvailable, setSearchAvailable] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableEmployees();
  }, []);

  const loadAvailableEmployees = async () => {
    try {
      const data = await departmentService.getAvailableEmployees(department.id);
      setAvailableEmployees(data);
    } catch (error) {
      console.error('Failed to load available employees:', error);
    }
  };

  const reloadDepartment = async () => {
    try {
      const data = await departmentService.getDepartmentById(department.id);
      setCurrentEmployees(data.employees);
    } catch (error) {
      console.error('Failed to reload department:', error);
    }
  };

  const handleAdd = async (employeeId: string) => {
    setLoading(true);
    try {
      await departmentService.addEmployeeToDepartment(department.id, employeeId);
      await Promise.all([reloadDepartment(), loadAvailableEmployees()]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Zuordnen');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (employeeId: string) => {
    setLoading(true);
    try {
      await departmentService.removeEmployeeFromDepartment(department.id, employeeId);
      await Promise.all([reloadDepartment(), loadAvailableEmployees()]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Entfernen');
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailable = availableEmployees.filter(e => {
    if (!searchAvailable) return true;
    const term = searchAvailable.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(term) ||
      e.lastName.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      e.employeeNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <BaseModal isOpen={true} onClose={onClose} maxWidth="700px">
      <h2>Mitarbeiter — {department.name}</h2>

      {/* Current employees */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>
          Zugeordnete Mitarbeiter ({currentEmployees.length})
        </h3>
        {currentEmployees.length === 0 ? (
          <div style={{ color: '#999', fontStyle: 'italic', padding: '10px' }}>
            Keine Mitarbeiter zugeordnet
          </div>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
            {currentEmployees.map((emp) => (
              <div
                key={emp.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: '1px solid #eee',
                }}
              >
                <div>
                  <strong>{emp.firstName} {emp.lastName}</strong>
                  <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '8px' }}>
                    {emp.position || emp.email}
                  </span>
                  {emp.employeeNumber && (
                    <span style={{ color: '#999', fontSize: '0.85em', marginLeft: '8px' }}>
                      #{emp.employeeNumber}
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  disabled={loading}
                  onClick={() => handleRemove(emp.id)}
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available employees */}
      <div>
        <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>
          Verfügbare Mitarbeiter
        </h3>
        <input
          type="text"
          placeholder="Mitarbeiter suchen..."
          value={searchAvailable}
          onChange={(e) => setSearchAvailable(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            marginBottom: '10px',
            fontSize: '14px',
          }}
        />
        <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
          {filteredAvailable.length === 0 ? (
            <div style={{ color: '#999', fontStyle: 'italic', padding: '10px', textAlign: 'center' }}>
              Keine verfügbaren Mitarbeiter gefunden
            </div>
          ) : (
            filteredAvailable.map((emp) => (
              <div
                key={emp.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: '1px solid #eee',
                }}
              >
                <div>
                  <strong>{emp.firstName} {emp.lastName}</strong>
                  <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '8px' }}>
                    {emp.position || emp.email}
                  </span>
                  {emp.employeeNumber && (
                    <span style={{ color: '#999', fontSize: '0.85em', marginLeft: '8px' }}>
                      #{emp.employeeNumber}
                    </span>
                  )}
                  {emp.departmentRef && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.8em',
                      padding: '2px 6px',
                      backgroundColor: '#fff3cd',
                      color: '#856404',
                      borderRadius: '3px',
                    }}>
                      aktuell: {emp.departmentRef.name}
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-success"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  disabled={loading}
                  onClick={() => handleAdd(emp.id)}
                >
                  Zuordnen
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="modal-actions" style={{ marginTop: '20px' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          Schliessen
        </button>
      </div>
    </BaseModal>
  );
};
