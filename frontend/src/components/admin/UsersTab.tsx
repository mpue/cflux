import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { userService } from '../../services/user.service';
import { UserDetailModal } from '../UserDetailModal';
import PDFReportModal from '../PDFReportModal';
import SalaryConfigDialog from './SalaryConfigDialog';

const UserCreateModal: React.FC<{
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER',
    isActive: true,
    vacationDays: 30,
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      alert('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    try {
      await onSave(formData);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Erstellen des Benutzers');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Neuer Benutzer</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vorname</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Nachname</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>E-Mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Passwort</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Mindestens 6 Zeichen</small>
          </div>

          <div className="form-group">
            <label>Rolle</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
            >
              <option value="USER">Benutzer</option>
              <option value="ADMIN">Administrator</option>
            </select>
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

          <div className="form-group">
            <label>Urlaubstage</label>
            <input
              type="number"
              step="0.5"
              value={formData.vacationDays}
              onChange={(e) => setFormData({ ...formData, vacationDays: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Benutzer erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UsersTab: React.FC<{ users: User[]; onUpdate: () => void }> = ({ users, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [pdfReportUser, setPdfReportUser] = useState<User | null>(null);
  const [salaryConfigUser, setSalaryConfigUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || user.isActive;
    
    return matchesSearch && matchesActive;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Benutzerverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Neuer Benutzer
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Name, E-Mail, Personalnr., Ort oder Telefon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: 'auto', marginRight: '5px' }}
          />
          Inaktive anzeigen
        </label>
      </div>

      <div className="data-table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Personalnr.</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Telefon</th>
              <th>Ort</th>
              <th>Eintrittsdatum</th>
              <th>Rolle</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  Keine Benutzer gefunden
                </td>
              </tr>
            ) : null}
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.employeeNumber || '-'}</td>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.mobile || user.phone || '-'}</td>
                <td>{user.city || '-'}</td>
                <td>{user.entryDate ? new Date(user.entryDate).toLocaleDateString('de-DE') : '-'}</td>
                <td>{user.role}</td>
                <td>{user.isActive ? 'Aktiv' : 'Inaktiv'}</td>
                <td>
                <button
                  className="btn btn-primary"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setEditingUser(user);
                    setShowModal(true);
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  className="btn btn-success"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => setPdfReportUser(user)}
                >
                  PDF-Bericht
                </button>
                <button
                  className="btn btn-warning"
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => setSalaryConfigUser(user)}
                >
                  💰 Gehalt
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={async () => {
                    if (window.confirm('Benutzer wirklich löschen?')) {
                      await userService.deleteUser(user.id);
                      onUpdate();
                    }
                  }}
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {showModal && editingUser && (
        <UserDetailModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={async (data) => {
            await userService.updateUser(editingUser.id, data);
            setShowModal(false);
            setEditingUser(null);
            onUpdate();
          }}
        />
      )}

      {showCreateModal && (
        <UserCreateModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            await userService.createUser(data);
            setShowCreateModal(false);
            onUpdate();
          }}
        />
      )}

      {pdfReportUser && (
        <PDFReportModal
          user={pdfReportUser}
          isOpen={true}
          onClose={() => setPdfReportUser(null)}
          isAdmin={true}
        />
      )}

      {salaryConfigUser && (
        <SalaryConfigDialog
          open={true}
          user={salaryConfigUser}
          onClose={() => setSalaryConfigUser(null)}
          onSuccess={() => {
            setSalaryConfigUser(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};
