import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Box,
  Typography,
  IconButton,
  Button,
  Alert,
  Card,
  CardHeader,
  Chip,
  Stack,
  Link,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Close,
  RssFeed,
  Check,
  Newspaper,
  Add,
  Edit,
  Delete,
  Sync,
  PushPin,
} from '@mui/icons-material';
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

  const typeColor = (type: NewsSource['type']): 'info' | 'default' | 'primary' =>
    type === 'RSS' ? 'info' : type === 'MANUAL' ? 'default' : 'primary';

  const priorityColor = (priority: NewsItem['priority']): 'error' | 'warning' | 'info' | 'default' =>
    priority === 'URGENT' ? 'error' : priority === 'HIGH' ? 'warning' : priority === 'NORMAL' ? 'info' : 'default';

  return (
    <Box className="tab-content-inner">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <ToggleButtonGroup
          value={activeSubTab}
          exclusive
          color="primary"
          size="small"
          onChange={(_e, val) => val && setActiveSubTab(val)}
        >
          <ToggleButton value="sources">
            <RssFeed fontSize="small" sx={{ mr: 1 }} />
            Quellen ({sources.length})
          </ToggleButton>
          <ToggleButton value="items">
            <Newspaper fontSize="small" sx={{ mr: 1 }} />
            Nachrichten ({items.length})
          </ToggleButton>
        </ToggleButtonGroup>

        <Button variant="outlined" color="info" startIcon={<Sync />} onClick={handleRefreshFeeds} disabled={loading}>
          RSS aktualisieren
        </Button>
      </Box>

      {activeSubTab === 'sources' && (
        <Card>
          <CardHeader
            title={<Typography variant="h6">News-Quellen</Typography>}
            action={
              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setEditingSource(null);
                  setShowSourceModal(true);
                }}
              >
                Neue Quelle
              </Button>
            }
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Typ</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Nachrichten</TableCell>
                  <TableCell sx={{ width: 200 }}>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id} hover>
                    <TableCell>
                      {source.icon && <i className={source.icon} style={{ color: source.color, marginRight: 8 }} />}
                      <strong>{source.name}</strong>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={source.type} color={typeColor(source.type)} />
                    </TableCell>
                    <TableCell>
                      {source.url ? (
                        <Link
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          noWrap
                          sx={{ display: 'inline-block', maxWidth: 200, verticalAlign: 'bottom' }}
                        >
                          {source.url}
                        </Link>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={source.isActive ? 'Aktiv' : 'Inaktiv'} color={source.isActive ? 'success' : 'error'} />
                      {source.displayOnDashboard && (
                        <Chip size="small" label="Dashboard" color="info" sx={{ ml: 0.5 }} />
                      )}
                    </TableCell>
                    <TableCell>{source._count?.items || 0}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => {
                            setEditingSource(source);
                            setShowSourceModal(true);
                          }}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteSource(source.id)}
                        >
                          Löschen
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeSubTab === 'items' && (
        <Card>
          <CardHeader
            title={<Typography variant="h6">Nachrichten</Typography>}
            action={
              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setEditingItem(null);
                  setShowItemModal(true);
                }}
              >
                Neue Nachricht
              </Button>
            }
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titel</TableCell>
                  <TableCell>Quelle</TableCell>
                  <TableCell>Priorität</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Veröffentlicht</TableCell>
                  <TableCell sx={{ width: 280 }}>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {item.isPinned && <PushPin color="primary" fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />}
                      <strong>{item.title}</strong>
                    </TableCell>
                    <TableCell>
                      {item.source?.icon && <i className={item.source.icon} style={{ marginRight: 8 }} />}
                      {item.source?.name || 'Unbekannt'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={item.priority} color={priorityColor(item.priority)} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={item.isActive ? 'Aktiv' : 'Inaktiv'} color={item.isActive ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell>{new Date(item.publishedAt).toLocaleDateString('de-DE')}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={item.isPinned ? 'Anpinnen aufheben' : 'Anpinnen'}>
                          <Button
                            variant={item.isPinned ? 'contained' : 'outlined'}
                            color="warning"
                            size="small"
                            onClick={() => handleTogglePin(item.id)}
                            sx={{ minWidth: 0, px: 1 }}
                          >
                            <PushPin fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => {
                            setEditingItem(item);
                            setShowItemModal(true);
                          }}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          Löschen
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
    </Box>
  );
};

// Source Modal Component (MUI)
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
    <Dialog open={show} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RssFeed color="primary" />
          {source ? 'Quelle bearbeiten' : 'Neue Quelle'}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Name"
                required
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Unternehmensnews"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Typ"
                required
                fullWidth
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <MenuItem value="MANUAL">Manuell</MenuItem>
                <MenuItem value="RSS">RSS Feed</MenuItem>
                <MenuItem value="INTERNAL">Intern</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {formData.type === 'RSS' && (
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, mt: 2 }}>
              <TextField
                label="Feed URL"
                type="url"
                required
                fullWidth
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/feed.xml"
                helperText="Vollständige URL zum RSS/Atom Feed"
              />
              <TextField
                label="Aktualisierungsintervall"
                type="number"
                fullWidth
                sx={{ mt: 2 }}
                value={formData.refreshInterval}
                onChange={(e) => setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })}
                helperText="In Sekunden (Standard: 3600 = 1 Stunde)"
              />
            </Box>
          )}

          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Icon"
                fullWidth
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="z.B. fas fa-newspaper"
                helperText="Font Awesome Icon-Klasse"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Farbe"
                type="color"
                fullWidth
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Priorität"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            helperText="Höhere Werte werden zuerst angezeigt"
          />

          <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 2, pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label={<Typography fontWeight="bold">Aktiv</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.displayOnDashboard}
                  onChange={(e) => setFormData({ ...formData, displayOnDashboard: e.target.checked })}
                />
              }
              label={<Typography fontWeight="bold">Auf Dashboard anzeigen</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" startIcon={<Close />}>
            Abbrechen
          </Button>
          <Button type="submit" variant="contained" startIcon={<Check />}>
            Speichern
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

// Item Modal Component (MUI)
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
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    onSave(data);
  };

  if (sources.length === 0) {
    return (
      <Dialog open={show} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Keine Quellen verfügbar</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning">
            Bitte erstellen Sie zuerst eine News-Quelle, bevor Sie Nachrichten hinzufügen.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={show} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Newspaper color="primary" />
          {item ? 'Nachricht bearbeiten' : 'Neue Nachricht'}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Titel"
                required
                fullWidth
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Aussagekräftiger Titel"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Quelle"
                required
                fullWidth
                value={formData.sourceId}
                onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              >
                {sources.map((source) => (
                  <MenuItem key={source.id} value={source.id}>
                    {source.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            label="Inhalt"
            required
            fullWidth
            multiline
            minRows={8}
            sx={{ mt: 2 }}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Vollständiger Nachrichtentext..."
          />

          <TextField
            label="Kurzbeschreibung"
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Kurze Zusammenfassung für die Vorschau..."
            helperText="Wird in der Übersicht angezeigt, wenn vorhanden"
          />

          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Externer Link"
                type="url"
                fullWidth
                value={formData.externalUrl}
                onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                placeholder="https://..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Bild-URL"
                type="url"
                fullWidth
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Autor"
                fullWidth
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Verfasser"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Priorität"
                fullWidth
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <MenuItem value="LOW">Niedrig</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="HIGH">Hoch</MenuItem>
                <MenuItem value="URGENT">Dringend</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Veröffentlichungsdatum"
                type="datetime-local"
                fullWidth
                value={formData.publishedAt}
                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Tags"
            fullWidth
            sx={{ mt: 2 }}
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="z.B. Wichtig, Update, Release"
            helperText="Mehrere Tags mit Komma trennen"
          />

          <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 2, pt: 2 }}>
            <Grid container>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    />
                  }
                  label={<Typography fontWeight="bold">📌 Angepinnt (oben fixieren)</Typography>}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label={<Typography fontWeight="bold">✓ Aktiv (sichtbar)</Typography>}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" startIcon={<Close />}>
            Abbrechen
          </Button>
          <Button type="submit" variant="contained" startIcon={<Check />}>
            Speichern
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default NewsTab;
