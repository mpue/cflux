import React, { useState } from 'react';
import { Tool, werkzeugeService } from '../../services/werkzeuge.service';
import { User } from '../../types';

interface WerkzeugeTabProps {
  tools: Tool[];
  users: User[];
  onUpdate: () => void;
}

export const WerkzeugeTab: React.FC<WerkzeugeTabProps> = ({ tools, users, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningTool, setAssigningTool] = useState<Tool | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [editingCell, setEditingCell] = useState<{ toolId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    inventoryNumber: '',
    manufacturer: '',
    model: '',
    category: '',
    location: '',
    purchaseDate: '',
    lastInspection: '',
    nextInspection: '',
    condition: 'gut',
    notes: '',
    assignedToId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');

  const categories = ['Handwerkzeug', 'Elektrowerkzeug', 'Messwerkzeug', 'Druckluftwerkzeug', 'Schneidwerkzeug', 'Schweisswerkzeug', 'Sonstiges'];
  const conditions = ['gut', 'beschädigt', 'defekt', 'ausgemustert'];

  const conditionColors: Record<string, string> = {
    'gut': '#27ae60',
    'beschädigt': '#f39c12',
    'defekt': '#e74c3c',
    'ausgemustert': '#95a5a6'
  };

  const handleOpenModal = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      setFormData({
        name: tool.name,
        inventoryNumber: tool.inventoryNumber || '',
        manufacturer: tool.manufacturer || '',
        model: tool.model || '',
        category: tool.category || '',
        location: tool.location || '',
        purchaseDate: tool.purchaseDate ? tool.purchaseDate.split('T')[0] : '',
        lastInspection: tool.lastInspection ? tool.lastInspection.split('T')[0] : '',
        nextInspection: tool.nextInspection ? tool.nextInspection.split('T')[0] : '',
        condition: tool.condition || 'gut',
        notes: tool.notes || '',
        assignedToId: tool.assignedToId || ''
      });
    } else {
      setEditingTool(null);
      setFormData({
        name: '',
        inventoryNumber: '',
        manufacturer: '',
        model: '',
        category: '',
        location: '',
        purchaseDate: '',
        lastInspection: '',
        nextInspection: '',
        condition: 'gut',
        notes: '',
        assignedToId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const toolData = {
        ...formData,
        inventoryNumber: formData.inventoryNumber || undefined,
        manufacturer: formData.manufacturer || undefined,
        model: formData.model || undefined,
        category: formData.category || undefined,
        location: formData.location || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        lastInspection: formData.lastInspection || undefined,
        nextInspection: formData.nextInspection || undefined,
        condition: formData.condition || undefined,
        notes: formData.notes || undefined,
        assignedToId: formData.assignedToId || undefined
      };

      if (editingTool) {
        await werkzeugeService.updateTool(editingTool.id, toolData);
      } else {
        await werkzeugeService.createTool(toolData);
      }

      handleCloseModal();
      onUpdate();
    } catch (error) {
      console.error('Error saving tool:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Speichern');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie dieses Werkzeug wirklich löschen?')) {
      return;
    }

    try {
      await werkzeugeService.deleteTool(id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert('Fehler beim Löschen des Werkzeugs');
    }
  };

  const handleAssign = async (tool: Tool) => {
    setAssigningTool(tool);
    setSelectedUserId('');
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!assigningTool || !selectedUserId) {
      alert('Bitte wählen Sie einen Benutzer aus');
      return;
    }

    try {
      await werkzeugeService.assignTool(assigningTool.id, selectedUserId);
      setIsAssignModalOpen(false);
      setAssigningTool(null);
      setSelectedUserId('');
      onUpdate();
    } catch (error) {
      console.error('Error assigning tool:', error);
      alert('Fehler beim Zuweisen des Werkzeugs');
    }
  };

  const handleCancelAssign = () => {
    setIsAssignModalOpen(false);
    setAssigningTool(null);
    setSelectedUserId('');
  };

  const handleReturn = async (toolId: string) => {
    if (!window.confirm('Möchten Sie dieses Werkzeug zurückgeben?')) {
      return;
    }

    try {
      await werkzeugeService.returnTool(toolId);
      onUpdate();
    } catch (error) {
      console.error('Error returning tool:', error);
      alert('Fehler beim Zurückgeben des Werkzeugs');
    }
  };

  const handleDuplicate = (tool: Tool) => {
    setEditingTool(null);
    setFormData({
      name: `${tool.name} (Kopie)`,
      inventoryNumber: '',
      manufacturer: tool.manufacturer || '',
      model: tool.model || '',
      category: tool.category || '',
      location: tool.location || '',
      purchaseDate: tool.purchaseDate ? tool.purchaseDate.split('T')[0] : '',
      lastInspection: '',
      nextInspection: '',
      condition: 'gut',
      notes: tool.notes || '',
      assignedToId: ''
    });
    setIsModalOpen(true);
  };

  const handleCellDoubleClick = (tool: Tool, field: string) => {
    setEditingCell({ toolId: tool.id, field });
    const value = (tool as any)[field];
    setEditValue(value || '');
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    const tool = tools.find(t => t.id === editingCell.toolId);
    if (!tool) return;

    const currentValue = (tool as any)[editingCell.field];
    if (currentValue === editValue || (!currentValue && !editValue)) {
      setEditingCell(null);
      return;
    }

    try {
      await werkzeugeService.updateTool(tool.id, {
        [editingCell.field]: editValue || undefined
      });
      setEditingCell(null);
      onUpdate();
    } catch (error) {
      console.error('Error updating tool:', error);
      alert('Fehler beim Speichern');
      setEditingCell(null);
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.inventoryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tool.assignedTo && `${tool.assignedTo.firstName} ${tool.assignedTo.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !categoryFilter || tool.category === categoryFilter;
    const matchesCondition = !conditionFilter || tool.condition === conditionFilter;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  const isInspectionOverdue = (tool: Tool) => {
    if (!tool.nextInspection) return false;
    return new Date(tool.nextInspection) < new Date();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🔧 Werkzeugverwaltung</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={() => handleOpenModal()}
          >
            Neues Werkzeug
          </button>
        </div>
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
            placeholder="Suche nach Name, Inventarnummer, Hersteller, Standort..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc', 
              minWidth: '300px',
              fontSize: '14px'
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="">Alle Kategorien</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            style={{ 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="">Alle Zustände</option>
            {conditions.map(cond => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>
          {(searchTerm || categoryFilter || conditionFilter) && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setConditionFilter('');
              }}
              title="Alle Filter zurücksetzen"
              style={{ padding: '8px 12px' }}
            >
              ✖ Filter zurücksetzen
            </button>
          )}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
          {filteredTools.length} von {tools.length} Werkzeugen angezeigt
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Kategorie</th>
            <th>Inv.-Nr.</th>
            <th>Hersteller</th>
            <th>Standort</th>
            <th>Zugewiesen an</th>
            <th>Zustand</th>
            <th>Nächste Prüfung</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredTools.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Werkzeuge gefunden
              </td>
            </tr>
          ) : (
            filteredTools.map(tool => (
              <tr key={tool.id}>
                <td onDoubleClick={() => handleCellDoubleClick(tool, 'name')}>
                  {editingCell?.toolId === tool.id && editingCell?.field === 'name' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    />
                  ) : (
                    <strong>{tool.name}</strong>
                  )}
                </td>
                <td onDoubleClick={() => handleCellDoubleClick(tool, 'category')}>
                  {editingCell?.toolId === tool.id && editingCell?.field === 'category' ? (
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    >
                      <option value="">-</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    tool.category || '-'
                  )}
                </td>
                <td onDoubleClick={() => handleCellDoubleClick(tool, 'inventoryNumber')}>
                  {editingCell?.toolId === tool.id && editingCell?.field === 'inventoryNumber' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    />
                  ) : (
                    tool.inventoryNumber || '-'
                  )}
                </td>
                <td onDoubleClick={() => handleCellDoubleClick(tool, 'manufacturer')}>
                  {editingCell?.toolId === tool.id && editingCell?.field === 'manufacturer' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    />
                  ) : (
                    tool.manufacturer || '-'
                  )}
                </td>
                <td onDoubleClick={() => handleCellDoubleClick(tool, 'location')}>
                  {editingCell?.toolId === tool.id && editingCell?.field === 'location' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                      style={{ width: '100%', padding: '4px', border: '1px solid #3498db' }}
                    />
                  ) : (
                    tool.location || '-'
                  )}
                </td>
                <td>
                  {tool.assignedTo ? (
                    <span>
                      {tool.assignedTo.firstName} {tool.assignedTo.lastName}
                    </span>
                  ) : (
                    <span style={{ color: '#999' }}>Nicht zugewiesen</span>
                  )}
                </td>
                <td>
                  <span style={{
                    color: conditionColors[tool.condition || 'gut'] || '#333',
                    fontWeight: 600
                  }}>
                    {tool.condition || '-'}
                  </span>
                </td>
                <td>
                  {tool.nextInspection ? (
                    <span style={{
                      color: isInspectionOverdue(tool) ? '#e74c3c' : '#27ae60',
                      fontWeight: isInspectionOverdue(tool) ? 700 : 400
                    }}>
                      {new Date(tool.nextInspection).toLocaleDateString('de-CH')}
                      {isInspectionOverdue(tool) && ' ⚠️'}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenModal(tool)}
                      title="Bearbeiten"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleDuplicate(tool)}
                      title="Duplizieren"
                    >
                      📋
                    </button>
                    {tool.assignedToId ? (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleReturn(tool.id)}
                        title="Zurückgeben"
                      >
                        ↩️
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleAssign(tool)}
                        title="Zuweisen"
                      >
                        👤
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(tool.id)}
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

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', padding: '0' }}>
            <div className="modal-header">
              <h3>{editingTool ? 'Werkzeug bearbeiten' : 'Neues Werkzeug'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                  <label>Inventarnummer</label>
                  <input
                    type="text"
                    value={formData.inventoryNumber}
                    onChange={(e) => setFormData({ ...formData, inventoryNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Kategorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Bitte wählen</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Hersteller</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Modell</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Standort / Lagerort</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Zugewiesen an</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  >
                    <option value="">Nicht zugewiesen</option>
                    {users.filter(u => u.isActive).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Zustand</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  >
                    {conditions.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Kaufdatum</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Letzte Prüfung</label>
                  <input
                    type="date"
                    value={formData.lastInspection}
                    onChange={(e) => setFormData({ ...formData, lastInspection: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Nächste Prüfung</label>
                  <input
                    type="date"
                    value={formData.nextInspection}
                    onChange={(e) => setFormData({ ...formData, nextInspection: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notizen</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTool ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssignModalOpen && assigningTool && (
        <div className="modal-overlay" onClick={handleCancelAssign}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', padding: '0' }}>
            <div className="modal-header">
              <h3>Werkzeug zuweisen</h3>
              <button className="modal-close" onClick={handleCancelAssign}>×</button>
            </div>

            <div style={{ padding: '30px' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ marginBottom: '10px' }}>
                  <strong>Werkzeug:</strong> {assigningTool.name}
                  {assigningTool.inventoryNumber && ` (Inv.: ${assigningTool.inventoryNumber})`}
                </p>
                {assigningTool.category && (
                  <p style={{ marginBottom: '10px', color: '#666' }}>
                    <strong>Kategorie:</strong> {assigningTool.category}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Benutzer auswählen *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  autoFocus
                >
                  <option value="">Bitte wählen...</option>
                  {users
                    .filter(u => u.isActive)
                    .sort((a, b) => {
                      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
                      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
                      return nameA.localeCompare(nameB);
                    })
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.lastName} {user.firstName} ({user.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCancelAssign}>
                  Abbrechen
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleConfirmAssign}
                  disabled={!selectedUserId}
                >
                  Zuweisen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
