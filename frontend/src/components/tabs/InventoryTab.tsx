import React, { useState, useEffect } from 'react';
import { inventoryService, InventoryItem } from '../../services/inventory.service';
import * as articleService from '../../services/articleService';
import { BaseModal } from '../common/BaseModal';

interface Article {
  id: string;
  articleNumber: string;
  name: string;
  unit: string;
  isActive: boolean;
}

interface InventoryTabProps {
  onUpdate: () => void;
}

const InventoryTab: React.FC<InventoryTabProps> = ({ onUpdate }) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formData, setFormData] = useState({
    articleId: '',
    quantity: 0,
    minQuantity: 0,
    location: '',
    notes: ''
  });
  const [movementData, setMovementData] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 0,
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, [includeInactive]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryData, articlesData] = await Promise.all([
        inventoryService.getAll(includeInactive),
        articleService.getAllArticles()
      ]);
      setInventoryItems(inventoryData);
      setArticles(articlesData.filter((a: Article) => a.isActive));
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
      await inventoryService.upsert(formData);
      setShowModal(false);
      setEditingItem(null);
      setFormData({ articleId: '', quantity: 0, minQuantity: 0, location: '', notes: '' });
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error('Error saving inventory item:', error);
      alert(error.response?.data?.message || 'Fehler beim Speichern');
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await inventoryService.recordMovement({
        inventoryItemId: selectedItem.id,
        type: movementData.type,
        quantity: movementData.quantity,
        reason: movementData.reason
      });
      setShowMovementModal(false);
      setSelectedItem(null);
      setMovementData({ type: 'IN', quantity: 0, reason: '' });
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error('Error recording movement:', error);
      alert(error.response?.data?.message || 'Fehler beim Erfassen der Bewegung');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      articleId: item.articleId,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      location: item.location || '',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleMovement = (item: InventoryItem) => {
    setSelectedItem(item);
    setMovementData({ type: 'IN', quantity: 0, reason: '' });
    setShowMovementModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diesen Lagerbestand wirklich löschen?')) {
      return;
    }
    try {
      await inventoryService.delete(id);
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      alert(error.response?.data?.message || 'Fehler beim Löschen');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ articleId: '', quantity: 0, minQuantity: 0, location: '', notes: '' });
  };

  const handleCloseMovementModal = () => {
    setShowMovementModal(false);
    setSelectedItem(null);
    setMovementData({ type: 'IN', quantity: 0, reason: '' });
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Nicht verfügbar', className: 'status-out-of-stock' };
    if (item.quantity <= item.minQuantity) return { label: 'Niedrig', className: 'status-low-stock' };
    return { label: 'Verfügbar', className: 'status-in-stock' };
  };

  if (loading) {
    return <div>Laden...</div>;
  }

  // Get available articles (those not yet in inventory)
  const availableArticles = articles.filter(
    article => !inventoryItems.some(item => item.articleId === article.id)
  );

  return (
    <div className="tab-content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Lagerbestand</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Inaktive Artikel anzeigen
          </label>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Neuer Lagerbestand
          </button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Artikel-Nr.</th>
            <th>Artikel</th>
            <th>Bestand</th>
            <th>Mindestbestand</th>
            <th>Einheit</th>
            <th>Lagerort</th>
            <th>Status</th>
            <th>Letzte Nachbestellung</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {inventoryItems.map((item) => {
            const status = getStockStatus(item);
            return (
              <tr key={item.id}>
                <td><strong>{item.article.articleNumber}</strong></td>
                <td>{item.article.name}</td>
                <td style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{item.quantity}</td>
                <td>{item.minQuantity}</td>
                <td>{item.article.unit}</td>
                <td>{item.location || '-'}</td>
                <td>
                  <span className={`status-badge ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                <td>
                  {item.lastRestocked 
                    ? new Date(item.lastRestocked).toLocaleDateString('de-CH')
                    : '-'}
                </td>
                <td>
                  <button 
                    onClick={() => handleMovement(item)} 
                    className="btn btn-small"
                    style={{ marginRight: '5px' }}
                    title="Bewegung erfassen"
                  >
                    📦 Bewegung
                  </button>
                  <button 
                    onClick={() => handleEdit(item)} 
                    className="btn btn-small"
                    style={{ marginRight: '5px' }}
                  >
                    Bearbeiten
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="btn btn-small btn-danger"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modal für Neuen/Bearbeiten Lagerbestand */}
      {showModal && (
        <BaseModal
          isOpen={showModal}
          onClose={handleCloseModal}
        >
          <h2>{editingItem ? 'Lagerbestand bearbeiten' : 'Neuer Lagerbestand'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Artikel *</label>
              <select
                value={formData.articleId}
                onChange={(e) => setFormData({ ...formData, articleId: e.target.value })}
                required
                disabled={!!editingItem}
              >
                <option value="">-- Artikel auswählen --</option>
                {editingItem ? (
                  <option value={editingItem.articleId}>
                    {editingItem.article.articleNumber} - {editingItem.article.name}
                  </option>
                ) : (
                  availableArticles.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.articleNumber} - {article.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Aktueller Bestand *</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label>Mindestbestand</label>
              <input
                type="number"
                step="0.01"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label>Lagerort</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="z.B. Regal A3, Lager 1"
              />
            </div>

            <div className="form-group">
              <label>Notizen</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optionale Notizen"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                Abbrechen
              </button>
              <button type="submit" className="btn btn-primary">
                {editingItem ? 'Aktualisieren' : 'Erstellen'}
              </button>
            </div>
          </form>
        </BaseModal>
      )}

      {/* Modal für Bewegung erfassen */}
      {showMovementModal && selectedItem && (
        <BaseModal
          isOpen={showMovementModal}
          onClose={handleCloseMovementModal}
        >
          <h2>Bewegung erfassen</h2>
          <p style={{ marginBottom: '15px' }}>
            <strong>Artikel:</strong> {selectedItem.article.name}<br />
            <strong>Aktueller Bestand:</strong> {selectedItem.quantity} {selectedItem.article.unit}
          </p>
          
          <form onSubmit={handleMovementSubmit}>
            <div className="form-group">
              <label>Bewegungsart *</label>
              <select
                value={movementData.type}
                onChange={(e) => setMovementData({ ...movementData, type: e.target.value as any })}
                required
              >
                <option value="IN">Eingang (Zugang)</option>
                <option value="OUT">Ausgang (Entnahme)</option>
                <option value="ADJUSTMENT">Korrektur</option>
              </select>
            </div>

            <div className="form-group">
              <label>Menge *</label>
              <input
                type="number"
                step="0.01"
                value={movementData.quantity}
                onChange={(e) => setMovementData({ ...movementData, quantity: parseFloat(e.target.value) || 0 })}
                required
                min="0"
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                {movementData.type === 'IN' && `Neuer Bestand: ${selectedItem.quantity + movementData.quantity} ${selectedItem.article.unit}`}
                {movementData.type === 'OUT' && `Neuer Bestand: ${selectedItem.quantity - movementData.quantity} ${selectedItem.article.unit}`}
                {movementData.type === 'ADJUSTMENT' && `Neuer Bestand: ${movementData.quantity} ${selectedItem.article.unit}`}
              </small>
            </div>

            <div className="form-group">
              <label>Grund</label>
              <textarea
                value={movementData.reason}
                onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                placeholder="z.B. Nachbestellung, Verbrauch, Inventur"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCloseMovementModal} className="btn btn-secondary">
                Abbrechen
              </button>
              <button type="submit" className="btn btn-primary">
                Bewegung erfassen
              </button>
            </div>
          </form>
        </BaseModal>
      )}
    </div>
  );
};

export default InventoryTab;
