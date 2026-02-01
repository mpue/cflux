import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Table, Badge, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import AppNavbar from '../components/AppNavbar';
import newsService, { NewsSource, NewsItem } from '../services/news.service';

const NewsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'items'>('sources');
  
  // Modals
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sourcesData, itemsData] = await Promise.all([
        newsService.getAllSources(),
        newsService.getDashboardNews(100),
      ]);
      setSources(sourcesData);
      setItems(itemsData);
    } catch (err: any) {
      console.error('Error loading news:', err);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!window.confirm('Quelle wirklich löschen? Alle zugehörigen Nachrichten werden ebenfalls gelöscht!')) {
      return;
    }
    try {
      await newsService.deleteSource(id);
      await loadData();
    } catch (err: any) {
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Nachricht wirklich löschen?')) {
      return;
    }
    try {
      await newsService.deleteItem(id);
      await loadData();
    } catch (err: any) {
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await newsService.togglePin(id);
      await loadData();
    } catch (err: any) {
      alert('Fehler: ' + err.message);
    }
  };

  const handleRefreshFeeds = async () => {
    try {
      const result = await newsService.refreshRssFeeds();
      alert(`RSS-Feeds aktualisiert:\n${result.map((r: any) => 
        `${r.sourceName}: ${r.success ? r.newItemsCount + ' neue Nachrichten' : 'Fehler - ' + r.error}`
      ).join('\n')}`);
      await loadData();
    } catch (err: any) {
      alert('Fehler beim Aktualisieren: ' + err.message);
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar title="News-Verwaltung" onLogout={() => navigate('/login')} />
        <div className="container text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppNavbar title="News-Verwaltung" onLogout={() => navigate('/login')} />
      <div className="container mt-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i className="fas fa-newspaper me-2"></i>
            News-Verwaltung
          </h2>
          <div className="d-flex gap-2">
            <Button variant="info" onClick={handleRefreshFeeds}>
              <i className="fas fa-sync-alt me-2"></i>
              RSS aktualisieren
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin')}>
              <i className="fas fa-arrow-left me-2"></i>
              Zurück
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs mb-4">
          <button
            className={`dashboard-tab ${activeTab === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveTab('sources')}
          >
            <i className="fas fa-rss me-2"></i>
            Quellen ({sources.length})
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <i className="fas fa-newspaper me-2"></i>
            Nachrichten ({items.length})
          </button>
        </div>

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">News-Quellen</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingSource(null);
                  setShowSourceModal(true);
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Neue Quelle
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Typ</th>
                    <th>URL</th>
                    <th>Priorität</th>
                    <th>Status</th>
                    <th>Nachrichten</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.id}>
                      <td>
                        {source.icon && <i className={`${source.icon} me-2`} style={{ color: source.color }}></i>}
                        <strong>{source.name}</strong>
                      </td>
                      <td>
                        <Badge bg={source.type === 'RSS' ? 'info' : source.type === 'MANUAL' ? 'secondary' : 'primary'}>
                          {source.type}
                        </Badge>
                      </td>
                      <td>
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            {source.url.substring(0, 40)}...
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{source.priority}</td>
                      <td>
                        <Badge bg={source.isActive ? 'success' : 'danger'}>
                          {source.isActive ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                        {source.displayOnDashboard && (
                          <Badge bg="info" className="ms-1">Dashboard</Badge>
                        )}
                      </td>
                      <td>{source._count?.items || 0}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="primary"
                            onClick={() => {
                              setEditingSource(source);
                              setShowSourceModal(true);
                            }}
                            title="Bearbeiten"
                          >
                            <i className="fas fa-edit"></i> Bearbeiten
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteSource(source.id)}
                            title="Löschen"
                          >
                            <i className="fas fa-trash"></i> Löschen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Nachrichten</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setShowItemModal(true);
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Neue Nachricht
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Titel</th>
                    <th>Quelle</th>
                    <th>Priorität</th>
                    <th>Status</th>
                    <th>Veröffentlicht</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.isPinned && <i className="fas fa-thumbtack text-primary me-2"></i>}
                        <strong>{item.title}</strong>
                      </td>
                      <td>
                        {item.source?.icon && <i className={`${item.source.icon} me-2`}></i>}
                        {item.source?.name || 'Unbekannt'}
                      </td>
                      <td>
                        <Badge
                          bg={
                            item.priority === 'URGENT' ? 'danger' :
                            item.priority === 'HIGH' ? 'warning' :
                            item.priority === 'NORMAL' ? 'info' : 'secondary'
                          }
                        >
                          {item.priority}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.isActive ? 'success' : 'danger'}>
                          {item.isActive ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </td>
                      <td>{new Date(item.publishedAt).toLocaleDateString('de-DE')}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant={item.isPinned ? 'warning' : 'outline-warning'}
                            onClick={() => handleTogglePin(item.id)}
                            title={item.isPinned ? 'Anpinnen aufheben' : 'Anpinnen'}
                          >
                            <i className="fas fa-thumbtack"></i>
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => {
                              setEditingItem(item);
                              setShowItemModal(true);
                            }}
                            title="Bearbeiten"
                          >
                            <i className="fas fa-edit"></i> Bearbeiten
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Löschen"
                          >
                            <i className="fas fa-trash"></i> Löschen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Source Modal */}
      <SourceModal
        show={showSourceModal}
        source={editingSource}
        onClose={() => {
          setShowSourceModal(false);
          setEditingSource(null);
        }}
        onSave={async (data) => {
          try {
            if (editingSource) {
              await newsService.updateSource(editingSource.id, data);
            } else {
              await newsService.createSource(data);
            }
            await loadData();
            setShowSourceModal(false);
            setEditingSource(null);
          } catch (err: any) {
            alert('Fehler beim Speichern: ' + err.message);
          }
        }}
      />

      {/* Item Modal */}
      <ItemModal
        show={showItemModal}
        item={editingItem}
        sources={sources}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSave={async (data) => {
          try {
            if (editingItem) {
              await newsService.updateItem(editingItem.id, data);
            } else {
              await newsService.createItem(data);
            }
            await loadData();
            setShowItemModal(false);
            setEditingItem(null);
          } catch (err: any) {
            alert('Fehler beim Speichern: ' + err.message);
          }
        }}
      />
    </>
  );
};

// Source Modal Component
const SourceModal: React.FC<{
  show: boolean;
  source: NewsSource | null;
  onClose: () => void;
  onSave: (data: any) => void;
}> = ({ show, source, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'MANUAL' as 'RSS' | 'MANUAL' | 'INTERNAL',
    url: '',
    refreshInterval: 3600,
    isActive: true,
    displayOnDashboard: true,
    priority: 0,
    icon: 'fas fa-newspaper',
    color: '#3b82f6',
  });

  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        type: source.type,
        url: source.url || '',
        refreshInterval: source.refreshInterval,
        isActive: source.isActive,
        displayOnDashboard: source.displayOnDashboard,
        priority: source.priority,
        icon: source.icon || 'fas fa-newspaper',
        color: source.color || '#3b82f6',
      });
    }
  }, [source]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{source ? 'Quelle bearbeiten' : 'Neue Quelle'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Typ *</Form.Label>
            <Form.Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="MANUAL">Manuell</option>
              <option value="RSS">RSS Feed</option>
              <option value="INTERNAL">Intern</option>
            </Form.Select>
          </Form.Group>

          {formData.type === 'RSS' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Feed URL *</Form.Label>
                <Form.Control
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required={formData.type === 'RSS'}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Aktualisierungsintervall (Sekunden)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.refreshInterval}
                  onChange={(e) => setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })}
                />
              </Form.Group>
            </>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Icon (Font Awesome)</Form.Label>
            <Form.Control
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="z.B. fas fa-newspaper"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Farbe</Form.Label>
            <Form.Control
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Priorität (Sortierung)</Form.Label>
            <Form.Control
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Aktiv"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Auf Dashboard anzeigen"
              checked={formData.displayOnDashboard}
              onChange={(e) => setFormData({ ...formData, displayOnDashboard: e.target.checked })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" type="submit">
            Speichern
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Item Modal Component
const ItemModal: React.FC<{
  show: boolean;
  item: NewsItem | null;
  sources: NewsSource[];
  onClose: () => void;
  onSave: (data: any) => void;
}> = ({ show, item, sources, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sourceId: '',
    title: '',
    content: '',
    excerpt: '',
    externalUrl: '',
    imageUrl: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    isPinned: false,
    isActive: true,
    publishedAt: new Date().toISOString().slice(0, 16),
    author: '',
    tags: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        sourceId: item.sourceId,
        title: item.title,
        content: item.content,
        excerpt: item.excerpt || '',
        externalUrl: item.externalUrl || '',
        imageUrl: item.imageUrl || '',
        priority: item.priority,
        isPinned: item.isPinned,
        isActive: item.isActive,
        publishedAt: new Date(item.publishedAt).toISOString().slice(0, 16),
        author: item.author || '',
        tags: item.tags?.join(', ') || '',
      });
    } else if (sources.length > 0) {
      setFormData(prev => ({ ...prev, sourceId: sources[0].id }));
    }
  }, [item, sources]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    onSave(data);
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{item ? 'Nachricht bearbeiten' : 'Neue Nachricht'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Quelle *</Form.Label>
            <Form.Select
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              required
            >
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Titel *</Form.Label>
            <Form.Control
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Inhalt *</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Kurzbeschreibung</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Externer Link</Form.Label>
            <Form.Control
              type="url"
              value={formData.externalUrl}
              onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Bild-URL</Form.Label>
            <Form.Control
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Autor</Form.Label>
            <Form.Control
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tags (kommagetrennt)</Form.Label>
            <Form.Control
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="z.B. Wichtig, Update, Release"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Priorität</Form.Label>
            <Form.Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <option value="LOW">Niedrig</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Hoch</option>
              <option value="URGENT">Dringend</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Veröffentlichungsdatum</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.publishedAt}
              onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Angepinnt"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Aktiv"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" type="submit">
            Speichern
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NewsManagement;
