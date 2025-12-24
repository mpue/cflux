import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Apps as AppsIcon,
} from '@mui/icons-material';
import moduleService, { Module, CreateModuleData, UpdateModuleData } from '../services/module.service';

const ModulesPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState<CreateModuleData>({
    name: '',
    key: '',
    description: '',
    icon: '',
    route: '',
    sortOrder: 0,
  });

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await moduleService.getAllModules(true);
      setModules(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Module');
      console.error('Error loading modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setFormData({
        name: module.name,
        key: module.key,
        description: module.description || '',
        icon: module.icon || '',
        route: module.route || '',
        sortOrder: module.sortOrder,
      });
    } else {
      setEditingModule(null);
      setFormData({
        name: '',
        key: '',
        description: '',
        icon: '',
        route: '',
        sortOrder: modules.length,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingModule(null);
    setFormData({
      name: '',
      key: '',
      description: '',
      icon: '',
      route: '',
      sortOrder: 0,
    });
  };

  const handleSave = async () => {
    try {
      if (editingModule) {
        await moduleService.updateModule(editingModule.id, formData as UpdateModuleData);
      } else {
        await moduleService.createModule(formData);
      }
      await loadModules();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Speichern des Moduls');
      console.error('Error saving module:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie dieses Modul wirklich löschen?')) {
      return;
    }

    try {
      await moduleService.deleteModule(id);
      await loadModules();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Löschen des Moduls');
      console.error('Error deleting module:', err);
    }
  };

  const handleToggleActive = async (module: Module) => {
    try {
      await moduleService.updateModule(module.id, { isActive: !module.isActive });
      await loadModules();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Aktualisieren des Moduls');
      console.error('Error updating module:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Lade Module...</Typography>
      </Box>
    );
  }

  const content = (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AppsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Module
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Neues Modul
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Reihenfolge</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {module.name}
                  </Typography>
                  {module.description && (
                    <Typography variant="caption" color="text.secondary">
                      {module.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={module.key} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{module.icon}</TableCell>
                <TableCell>{module.route}</TableCell>
                <TableCell>{module.sortOrder}</TableCell>
                <TableCell>
                  <Switch
                    checked={module.isActive}
                    onChange={() => handleToggleActive(module)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(module)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(module.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingModule ? 'Modul bearbeiten' : 'Neues Modul erstellen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              fullWidth
              required
              helperText="Eindeutiger Schlüssel für das Modul (z.B. 'time_tracking')"
            />
            <TextField
              label="Beschreibung"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              fullWidth
              helperText="Material-UI Icon Name"
            />
            <TextField
              label="Route"
              value={formData.route}
              onChange={(e) => setFormData({ ...formData, route: e.target.value })}
              fullWidth
              helperText="Frontend-Route (z.B. '/time')"
            />
            <TextField
              label="Reihenfolge"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.key}
          >
            {editingModule ? 'Speichern' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  return embedded ? content : <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>{content}</Container>;
};

export default ModulesPage;
