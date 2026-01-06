import React, { useState, useEffect } from 'react';
import { userGroupService, UserGroup, CreateUserGroupDto, UpdateUserGroupDto } from '../../services/userGroup.service';
import { userService } from '../../services/user.service';
import { User } from '../../types';

interface UserGroupsTabProps {
  onLoad?: () => void;
}

interface UserGroupsDialogProps {
  user: User;
  groups: UserGroup[];
  onClose: () => void;
  onSave: (userId: string, groupIds: string[]) => void;
}

const UserGroupsDialog: React.FC<UserGroupsDialogProps> = ({ user, groups, onClose, onSave }) => {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => {
    return user.userGroupMemberships?.map(m => m.userGroup.id) || [];
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

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSave = () => {
    onSave(user.id, selectedGroupIds);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Gruppenzuordnung für {user.firstName} {user.lastName}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
            Wählen Sie die Gruppen aus, denen dieser Benutzer angehören soll:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
            {groups.filter(g => g.isActive).map(group => (
              <label
                key={group.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: `2px solid ${selectedGroupIds.includes(group.id) ? group.color : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedGroupIds.includes(group.id) ? `${group.color}15` : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                  style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    marginBottom: '4px'
                  }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: group.color || '#4CAF50',
                      }}
                    />
                    <strong>{group.name}</strong>
                  </div>
                  {group.description && (
                    <p style={{ 
                      margin: 0, 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)',
                      marginLeft: '26px'
                    }}>
                      {group.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>

          {groups.filter(g => g.isActive).length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
              Keine aktiven Gruppen verfügbar
            </p>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Abbrechen
          </button>
          <button type="button" onClick={handleSave} className="btn btn-primary">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export const UserGroupsTab: React.FC<UserGroupsTabProps> = ({ onLoad }) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
        userService.getAllUsersAdmin(),
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

  const handleSaveUserGroups = async (userId: string, groupIds: string[]) => {
    try {
      await userGroupService.setUserGroups(userId, groupIds);
      setEditingUser(null);
      await loadData();
    } catch (error: any) {
      console.error('Error saving user groups:', error);
      alert('Fehler beim Speichern der Gruppenzuordnung: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const getUsersInGroup = (groupId: string) => {
    return users.filter(u => u.userGroupMemberships?.some(m => m.userGroup.id === groupId));
  };

  const getUserGroupsDisplay = (user: User) => {
    const userGroups = user.userGroupMemberships?.map(m => m.userGroup) || [];
    if (userGroups.length === 0) return 'Keine Gruppe';
    return userGroups.map(g => g.name).join(', ');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Benutzergruppen</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '5px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'cards' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'cards' ? 'white' : 'var(--text-primary)',
                fontWeight: viewMode === 'cards' ? 'bold' : 'normal',
              }}
            >
              Gruppen
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'table' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'table' ? 'white' : 'var(--text-primary)',
                fontWeight: viewMode === 'table' ? 'bold' : 'normal',
              }}
            >
              Alle Benutzer
            </button>
          </div>
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

      {viewMode === 'cards' ? (
        <>
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
                  <span>{group._count?.userGroupMemberships || 0}</span>
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
                    {users.filter(u => !u.userGroupMemberships?.some(m => m.userGroup.id === group.id) && u.isActive).map(user => (
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
        </>
      ) : (
        // Tabellenansicht - Alle Benutzer mit ihren Gruppen
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Alle Benutzer - Gruppenzuordnung</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>E-Mail</th>
                <th style={{ padding: '12px' }}>Rolle</th>
                <th style={{ padding: '12px' }}>Benutzergruppen</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const userGroups = user.userGroupMemberships?.map(m => m.userGroup) || [];
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{user.firstName} {user.lastName}</strong>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: user.role === 'ADMIN' ? '#e3f2fd' : '#f3e5f5',
                        color: user.role === 'ADMIN' ? '#1565c0' : '#6a1b9a',
                      }}>
                        {user.role === 'ADMIN' ? 'Admin' : 'Benutzer'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {userGroups.length > 0 ? (
                          userGroups.map(group => (
                            <span
                              key={group.id}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                backgroundColor: group.color || '#4CAF50',
                                color: 'white',
                                fontWeight: 'bold',
                              }}
                            >
                              {group.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Keine Gruppe
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: user.isActive ? '#d4edda' : '#f8d7da',
                        color: user.isActive ? '#155724' : '#721c24',
                      }}>
                        {user.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => setEditingUser(user)}
                        className="btn btn-small"
                      >
                        Bearbeiten
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
              <p>Keine Benutzer gefunden</p>
            </div>
          )}
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

      {editingUser && (
        <UserGroupsDialog
          user={editingUser}
          groups={groups}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUserGroups}
        />
      )}
    </div>
  );
};
