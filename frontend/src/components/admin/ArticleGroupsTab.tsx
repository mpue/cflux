import React, { useState } from 'react';
import { ArticleGroup } from '../../types';
import * as articleGroupService from '../../services/articleGroupService';

interface ArticleGroupsTabProps {
  articleGroups: ArticleGroup[];
  onUpdate: () => void;
}

export const ArticleGroupsTab: React.FC<ArticleGroupsTabProps> = ({ articleGroups, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ArticleGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredGroups = articleGroups.filter(group => {
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || group.isActive;
    
    return matchesSearch && matchesActive;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Artikelgruppen</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingGroup(null);
            setShowModal(true);
          }}
        >
          Neue Artikelgruppe
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Name oder Beschreibung..."
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

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Beschreibung</th>
            <th>Artikel</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredGroups.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Artikelgruppen gefunden
              </td>
            </tr>
          ) : (
            filteredGroups.map((group) => (
              <tr key={group.id}>
                <td><strong>{group.name}</strong></td>
                <td>{group.description || '-'}</td>
                <td>
                  {group.articles && group.articles.length > 0 ? (
                    <span>{group.articles.length} Artikel</span>
                  ) : (
                    <span style={{ color: '#999' }}>0 Artikel</span>
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: group.isActive ? '#d4edda' : '#f8d7da',
                    color: group.isActive ? '#155724' : '#721c24'
                  }}>
                    {group.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setEditingGroup(group);
                      setShowModal(true);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      if (window.confirm('Artikelgruppe wirklich löschen?')) {
                        try {
                          await articleGroupService.deleteArticleGroup(group.id);
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
        <ArticleGroupModal
          group={editingGroup}
          onClose={() => {
            setShowModal(false);
            setEditingGroup(null);
          }}
          onSave={async (data) => {
            if (editingGroup) {
              await articleGroupService.updateArticleGroup(editingGroup.id, data);
            } else {
              await articleGroupService.createArticleGroup(data);
            }
            setShowModal(false);
            setEditingGroup(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const ArticleGroupModal: React.FC<{
  group: ArticleGroup | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ group, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    isActive: group?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Bitte Name eingeben');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <h2>{group ? 'Artikelgruppe bearbeiten' : 'Neue Artikelgruppe'}</h2>
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

          <div className="button-group">
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
