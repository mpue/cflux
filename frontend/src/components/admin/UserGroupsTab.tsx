import React, { useState, useEffect } from 'react';
import { userGroupService, UserGroup, CreateUserGroupDto, UpdateUserGroupDto } from '../../services/userGroup.service';
import { userService } from '../../services/user.service';
import { User } from '../../types';

interface UserGroupsTabProps {
  onLoad?: () => void;
}

export const UserGroupsTab: React.FC<UserGroupsTabProps> = ({ onLoad }) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState<CreateUserGroupDto>({
    name: '',
    description: '',
    color: '#4CAF50',
  });

  useEffect(() => {
    document.title = 'CFlux - Benutzergruppen';
    loadData();
  }, [showInactive]);

  const loadData = async () => {
    try {
      const [groupsData, usersData] = await Promise.all([
        userGroupService.getAll(showInactive),
        userService.getAllUsers(),
      ]);
      setGroups(groupsData);
      setUsers(usersData);
      if (onLoad) onLoad();
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Fehler beim Laden der Benutzergruppen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedGroup) {
        await userGroupService.update(selectedGroup.id, formData);
      } else {
        await userGroupService.create(formData);
      }
      setShowModal(false);
      setSelectedGroup(null);
      setFormData({ name: '', description: '', color: '#4CAF50' });
      loadData();
    } catch (error) {
      console.error('Error saving user group:', error);
      alert('Fehler beim Speichern der Benutzergruppe');
    }
  };

  const handleEdit = (group: UserGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color || '#4CAF50',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Benutzergruppe wirklich löschen?')) return;
    
    try {
      await userGroupService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting user group:', error);
      alert('Fehler beim Löschen der Benutzergruppe');
    }
  };

  const handleToggleActive = async (group: UserGroup) => {
    try {
      await userGroupService.update(group.id, { isActive: !group.isActive });
      loadData();
    } catch (error) {
      console.error('Error toggling group status:', error);
      alert('Fehler beim Ändern des Status');
    }
  };

  const handleAddUser = async (groupId: string, userId: string) => {
    try {
      await userGroupService.addUser(groupId, userId);
      loadData();
    } catch (error) {
      console.error('Error adding user to group:', error);
      alert('Fehler beim Hinzufügen des Benutzers');
    }
  };

  const handleRemoveUser = async (groupId: string, userId: string) => {
    try {
      await userGroupService.removeUser(groupId, userId);
      loadData();
    } catch (error) {
      console.error('Error removing user from group:', error);
      alert('Fehler beim Entfernen des Benutzers');
    }
  };

  const getUsersInGroup = (groupId: string) => {
    return users.filter(u => u.userGroupId === groupId);
  };

  const getUsersNotInAnyGroup = () => {
    return users.filter(u => !u.userGroupId);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Benutzergruppen</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Inaktive anzeigen
          </label>
          <button onClick={() => { setSelectedGroup(null); setFormData({ name: '', description: '', color: '#4CAF50' }); setShowModal(true); }} className="btn btn-primary">
            Neue Gruppe
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {groups.map(group => (
          <div key={group.id} className="card" style={{ borderTop: `4px solid ${group.color || '#4CAF50'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{group.name}</h3>
                <p style={{ margin: '0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {group.description || 'Keine Beschreibung'}
                </p>
              </div>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: group.isActive ? '#d4edda' : '#f8d7da',
                color: group.isActive ? '#155724' : '#721c24',
              }}>
                {group.isActive ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Mitglieder: </strong>
              <span>{group._count?.users || 0}</span>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Benutzer:</h4>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {getUsersInGroup(group.id).length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {getUsersInGroup(group.id).map(user => (
                      <li key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span>{user.firstName} {user.lastName}</span>
                        <button
                          onClick={() => handleRemoveUser(group.id, user.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px' }}
                          title="Entfernen"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Keine Benutzer
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddUser(group.id, e.target.value);
                    e.target.value = '';
                  }
                }}
                style={{ width: '100%', padding: '5px', fontSize: '13px' }}
              >
                <option value="">Benutzer hinzufügen...</option>
                {users.filter(u => u.userGroupId !== group.id && u.isActive).map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleEdit(group)} className="btn btn-small">
                Bearbeiten
              </button>
              <button onClick={() => handleToggleActive(group)} className="btn btn-small">
                {group.isActive ? 'Deaktivieren' : 'Aktivieren'}
              </button>
              <button onClick={() => handleDelete(group.id)} className="btn btn-small btn-danger">
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
          <p>Keine Benutzergruppen gefunden</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{selectedGroup ? 'Gruppe bearbeiten' : 'Neue Gruppe'}</h2>
              <button onClick={() => { setShowModal(false); setSelectedGroup(null); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
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
                  <label>Farbe</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); setSelectedGroup(null); }} className="btn btn-secondary">
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedGroup ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
