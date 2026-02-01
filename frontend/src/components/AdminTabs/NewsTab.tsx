import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import newsService, { NewsSource, NewsItem } from '../../services/news.service';

interface NewsTabProps {
  onUpdate?: () => void;
}

const NewsTab: React.FC<NewsTabProps> = ({ onUpdate }) => {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'sources' | 'items'>('sources');
  
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
      setLoading(true);
      const result = await newsService.refreshRssFeeds();
      const message = result.map((r: any) => 
        `${r.sourceName}: ${r.success ? r.newItemsCount + ' neue Nachrichten' : 'Fehler - ' + r.error}`
      ).join('\n');
      alert(`RSS-Feeds aktualisiert:\n${message}`);
      await loadData();
    } catch (err: any) {
      alert('Fehler beim Aktualisieren: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content-inner">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${activeSubTab === 'sources' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveSubTab('sources')}
          >
            <i className="fas fa-rss me-2"></i>
            Quellen ({sources.length})
          </button>
          <button
            type="button"
            className={`btn ${activeSubTab === 'items' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveSubTab('items')}
          >
            <i className="fas fa-newspaper me-2"></i>
            Nachrichten ({items.length})
          </button>
        </div>
        <Button variant="info" onClick={handleRefreshFeeds} disabled={loading}>
          <i className="fas fa-sync-alt me-2"></i>
          RSS aktualisieren
        </Button>
      </div>

      {activeSubTab === 'sources' && (
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
            <Table striped hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Typ</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Nachrichten</th>
                  <th style={{ width: '200px' }}>Aktionen</th>
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
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                          {source.url}
                        </a>
                      ) : '-'}
                    </td>
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
                          size="sm"
                          onClick={() => {
                            setEditingSource(source);
                            setShowSourceModal(true);
                          }}
                        >
                          <i className="fas fa-edit"></i> Bearbeiten
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteSource(source.id)}
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

      {activeSubTab === 'items' && (
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
            <Table striped hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Quelle</th>
                  <th>Priorität</th>
                  <th>Status</th>
                  <th>Veröffentlicht</th>
                  <th style={{ width: '280px' }}>Aktionen</th>
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
                          size="sm"
                          onClick={() => handleTogglePin(item.id)}
                          title={item.isPinned ? 'Anpinnen aufheben' : 'Anpinnen'}
                        >
                          <i className="fas fa-thumbtack"></i>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setShowItemModal(true);
                          }}
                        >
                          <i className="fas fa-edit"></i> Bearbeiten
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
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
    </div>
  );
};

// Verbesserte Source Modal Component
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
    } else {
      setFormData({
        name: '',
        type: 'MANUAL',
        url: '',
        refreshInterval: 3600,
        isActive: true,
        displayOnDashboard: true,
        priority: 0,
        icon: 'fas fa-newspaper',
        color: '#3b82f6',
      });
    }
  }, [source, show]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <i className="fas fa-rss me-2"></i>
          {source ? 'Quelle bearbeiten' : 'Neue Quelle'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Name *</strong></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Unternehmensnews"
                  required
                  size="lg"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Typ *</strong></Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  size="lg"
                >
                  <option value="MANUAL">Manuell</option>
                  <option value="RSS">RSS Feed</option>
                  <option value="INTERNAL">Intern</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {formData.type === 'RSS' && (
            <div className="bg-light p-3 rounded mb-3">
              <Form.Group className="mb-3">
                <Form.Label><strong>Feed URL *</strong></Form.Label>
                <Form.Control
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/feed.xml"
                  required={formData.type === 'RSS'}
                  size="lg"
                />
                <Form.Text className="text-muted">
                  Vollständige URL zum RSS/Atom Feed
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-0">
                <Form.Label><strong>Aktualisierungsintervall</strong></Form.Label>
                <Form.Control
                  type="number"
                  value={formData.refreshInterval}
                  onChange={(e) => setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })}
                  size="lg"
                />
                <Form.Text className="text-muted">
                  In Sekunden (Standard: 3600 = 1 Stunde)
                </Form.Text>
              </Form.Group>
            </div>
          )}

          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Icon</strong></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="z.B. fas fa-newspaper"
                  size="lg"
                />
                <Form.Text className="text-muted">
                  Font Awesome Icon-Klasse
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Farbe</strong></Form.Label>
                <Form.Control
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  size="lg"
                  style={{ height: '48px' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label><strong>Priorität</strong></Form.Label>
            <Form.Control
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              size="lg"
            />
            <Form.Text className="text-muted">
              Höhere Werte werden zuerst angezeigt
            </Form.Text>
          </Form.Group>

          <div className="border-top pt-3">
            <Form.Group className="mb-2">
              <Form.Check
                type="switch"
                id="isActive"
                label={<strong>Aktiv</strong>}
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Check
                type="switch"
                id="displayOnDashboard"
                label={<strong>Auf Dashboard anzeigen</strong>}
                checked={formData.displayOnDashboard}
                onChange={(e) => setFormData({ ...formData, displayOnDashboard: e.target.checked })}
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onClose} size="lg">
            <i className="fas fa-times me-2"></i>
            Abbrechen
          </Button>
          <Button variant="primary" type="submit" size="lg">
            <i className="fas fa-check me-2"></i>
            Speichern
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Verbesserte Item Modal Component
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
      setFormData({
        sourceId: sources[0].id,
        title: '',
        content: '',
        excerpt: '',
        externalUrl: '',
        imageUrl: '',
        priority: 'NORMAL',
        isPinned: false,
        isActive: true,
        publishedAt: new Date().toISOString().slice(0, 16),
        author: '',
        tags: '',
      });
    }
  }, [item, sources, show]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    onSave(data);
  };

  if (sources.length === 0) {
    return (
      <Modal show={show} onHide={onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Keine Quellen verfügbar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            Bitte erstellen Sie zuerst eine News-Quelle, bevor Sie Nachrichten hinzufügen.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Schließen
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <i className="fas fa-newspaper me-2"></i>
          {item ? 'Nachricht bearbeiten' : 'Neue Nachricht'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Titel *</strong></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Aussagekräftiger Titel"
                  required
                  size="lg"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Quelle *</strong></Form.Label>
                <Form.Select
                  value={formData.sourceId}
                  onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                  required
                  size="lg"
                >
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label><strong>Inhalt *</strong></Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Vollständiger Nachrichtentext..."
              required
              style={{ fontSize: '1rem' }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label><strong>Kurzbeschreibung</strong></Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Kurze Zusammenfassung für die Vorschau..."
              style={{ fontSize: '1rem' }}
            />
            <Form.Text className="text-muted">
              Wird in der Übersicht angezeigt, wenn vorhanden
            </Form.Text>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Externer Link</strong></Form.Label>
                <Form.Control
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  placeholder="https://..."
                  size="lg"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Bild-URL</strong></Form.Label>
                <Form.Control
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  size="lg"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Autor</strong></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Verfasser"
                  size="lg"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Priorität</strong></Form.Label>
                <Form.Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  size="lg"
                >
                  <option value="LOW">Niedrig</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Hoch</option>
                  <option value="URGENT">Dringend</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Veröffentlichungsdatum</strong></Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  size="lg"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label><strong>Tags</strong></Form.Label>
            <Form.Control
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="z.B. Wichtig, Update, Release"
              size="lg"
            />
            <Form.Text className="text-muted">
              Mehrere Tags mit Komma trennen
            </Form.Text>
          </Form.Group>

          <div className="border-top pt-3">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Check
                    type="switch"
                    id="isPinned"
                    label={<strong>📌 Angepinnt (oben fixieren)</strong>}
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-0">
                  <Form.Check
                    type="switch"
                    id="isActiveItem"
                    label={<strong>✓ Aktiv (sichtbar)</strong>}
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onClose} size="lg">
            <i className="fas fa-times me-2"></i>
            Abbrechen
          </Button>
          <Button variant="primary" type="submit" size="lg">
            <i className="fas fa-check me-2"></i>
            Speichern
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NewsTab;
