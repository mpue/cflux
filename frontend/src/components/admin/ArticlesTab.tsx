import React, { useState } from 'react';
import { Article, ArticleGroup } from '../../types';
import * as articleService from '../../services/articleService';

interface ArticlesTabProps {
  articles: Article[];
  articleGroups: ArticleGroup[];
  onUpdate: () => void;
}

const ArticlesTab: React.FC<ArticlesTabProps> = ({ articles, articleGroups, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string>('');

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchTerm || 
      article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.articleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = showInactive || article.isActive;
    const matchesGroup = !filterGroupId || article.articleGroupId === filterGroupId;
    
    return matchesSearch && matchesActive && matchesGroup;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Artikelverwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingArticle(null);
            setShowModal(true);
          }}
        >
          Neuer Artikel
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Suche nach Name, Artikelnummer oder Beschreibung..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <select
          value={filterGroupId}
          onChange={(e) => setFilterGroupId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Alle Gruppen</option>
          {articleGroups.filter(g => g.isActive).map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
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
            <th>Artikelnummer</th>
            <th>Name</th>
            <th>Gruppe</th>
            <th>Preis</th>
            <th>Einheit</th>
            <th>MwSt</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredArticles.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Artikel gefunden
              </td>
            </tr>
          ) : (
            filteredArticles.map((article) => (
              <tr key={article.id}>
                <td><strong>{article.articleNumber}</strong></td>
                <td>
                  <div>{article.name}</div>
                  {article.description && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {article.description}
                    </div>
                  )}
                </td>
                <td>{article.articleGroup?.name || '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  CHF {article.price.toFixed(2)}
                </td>
                <td>{article.unit}</td>
                <td style={{ textAlign: 'right' }}>{article.vatRate}%</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: article.isActive ? '#d4edda' : '#f8d7da',
                    color: article.isActive ? '#155724' : '#721c24'
                  }}>
                    {article.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setEditingArticle(article);
                      setShowModal(true);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={async () => {
                      if (window.confirm('Artikel wirklich löschen?')) {
                        try {
                          await articleService.deleteArticle(article.id);
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
        <ArticleModal
          article={editingArticle}
          articleGroups={articleGroups}
          onClose={() => {
            setShowModal(false);
            setEditingArticle(null);
          }}
          onSave={async (data) => {
            if (editingArticle) {
              await articleService.updateArticle(editingArticle.id, data);
            } else {
              await articleService.createArticle(data);
            }
            setShowModal(false);
            setEditingArticle(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

const ArticleModal: React.FC<{
  article: Article | null;
  articleGroups: ArticleGroup[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ article, articleGroups, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    articleNumber: article?.articleNumber || '',
    name: article?.name || '',
    description: article?.description || '',
    articleGroupId: article?.articleGroupId || '',
    price: article?.price || 0,
    unit: article?.unit || 'Stück',
    vatRate: article?.vatRate || 7.7,
    notes: article?.notes || '',
    isActive: article?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.articleNumber.trim()) {
      alert('Bitte Artikelnummer eingeben');
      return;
    }
    if (!formData.name.trim()) {
      alert('Bitte Artikelname eingeben');
      return;
    }
    if (!formData.articleGroupId) {
      alert('Bitte Artikelgruppe auswählen');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2>{article ? 'Artikel bearbeiten' : 'Neuer Artikel'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Artikelnummer *</label>
            <input
              type="text"
              value={formData.articleNumber}
              onChange={(e) => setFormData({ ...formData, articleNumber: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Artikelname *</label>
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
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Artikelgruppe *</label>
            <select
              value={formData.articleGroupId}
              onChange={(e) => setFormData({ ...formData, articleGroupId: e.target.value })}
              required
            >
              <option value="">Bitte wählen...</option>
              {articleGroups.filter(g => g.isActive).map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Preis (CHF) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label>Einheit *</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="z.B. Stück, Std, kg"
                required
              />
            </div>

            <div className="form-group">
              <label>MwSt-Satz (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

export default ArticlesTab;
