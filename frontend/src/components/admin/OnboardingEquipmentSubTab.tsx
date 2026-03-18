import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, IconButton, Tooltip, LinearProgress, Autocomplete, MenuItem, Select,
  FormControl, InputLabel, Alert,
} from '@mui/material';
import { Add, Edit, Refresh } from '@mui/icons-material';
import { equipmentService } from '../../services/onboardingService';
import { onboardingService } from '../../services/onboardingService';
import { Equipment, EquipmentFormData, Employee } from '../../types/onboarding';

interface OnboardingEquipmentSubTabProps {
  onUpdate?: () => void;
}

const EQUIPMENT_CATEGORIES = [
  'LAPTOP',
  'PHONE',
  'MONITOR',
  'HEADSET',
  'ACCESS_CARD',
  'KEYS',
  'FURNITURE',
  'OTHER',
];

const categoryLabels: Record<string, string> = {
  LAPTOP: 'Laptop',
  PHONE: 'Telefon',
  MONITOR: 'Monitor',
  HEADSET: 'Headset',
  ACCESS_CARD: 'Zugangskarte',
  KEYS: 'Schlüssel',
  FURNITURE: 'Möbel',
  OTHER: 'Sonstiges',
};

const OnboardingEquipmentSubTab: React.FC<OnboardingEquipmentSubTabProps> = ({ onUpdate }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [form, setForm] = useState<EquipmentFormData>({
    name: '',
    category: 'OTHER',
    description: '',
    inventoryNumber: '',
    serialNumber: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eqData, empData] = await Promise.all([
        equipmentService.getAll(),
        onboardingService.getAllEmployees(),
      ]);
      setEquipment(eqData);
      setEmployees(empData);
    } catch (err: any) {
      console.error('Error loading equipment:', err);
      setError('Fehler beim Laden der Equipment-Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    try {
      const data: EquipmentFormData = { ...form };
      if (!data.description) delete data.description;
      if (!data.inventoryNumber) delete data.inventoryNumber;
      if (!data.serialNumber) delete data.serialNumber;

      await equipmentService.create(data);
      setCreateDialogOpen(false);
      setForm({ name: '', category: 'OTHER', description: '', inventoryNumber: '', serialNumber: '' });
      await loadData();
      onUpdate?.();
    } catch (err: any) {
      console.error('Error creating equipment:', err);
      setError('Fehler beim Erstellen des Equipments');
    }
  };

  const openAssignDialog = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
    setSelectedEmployeeId('');
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    try {
      await equipmentService.assign({
        equipmentId: selectedEquipmentId,
        employeeId: selectedEmployeeId,
      });
      setAssignDialogOpen(false);
      await loadData();
      onUpdate?.();
    } catch (err: any) {
      console.error('Error assigning equipment:', err);
      setError('Fehler beim Zuweisen des Equipments');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
        <Typography sx={{ mt: 1 }}>Lade Equipment...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Equipment-Verwaltung</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={loadData}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setForm({ name: '', category: 'OTHER', description: '', inventoryNumber: '', serialNumber: '' });
              setCreateDialogOpen(true);
            }}
          >
            Neues Equipment
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {equipment.length === 0 ? (
        <Alert severity="info">
          Kein Equipment vorhanden. Erstellen Sie neues Equipment über den Button oben.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Kategorie</TableCell>
                <TableCell>Inventarnummer</TableCell>
                <TableCell>Seriennummer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.map((eq) => (
                <TableRow key={eq.id} hover>
                  <TableCell>
                    <Typography fontWeight="bold">{eq.name}</Typography>
                    {eq.description && (
                      <Typography variant="caption" color="textSecondary">
                        {eq.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={categoryLabels[eq.category] || eq.category}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{eq.inventoryNumber || '–'}</TableCell>
                  <TableCell>{eq.serialNumber || '–'}</TableCell>
                  <TableCell>
                    <Chip
                      label={eq.isActive ? 'Verfügbar' : 'Inaktiv'}
                      size="small"
                      color={eq.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Zuweisen">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openAssignDialog(eq.id)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Equipment Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neues Equipment erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={form.category}
                label="Kategorie"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {categoryLabels[cat] || cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Beschreibung"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Inventarnummer"
              value={form.inventoryNumber}
              onChange={(e) => setForm({ ...form, inventoryNumber: e.target.value })}
              fullWidth
            />
            <TextField
              label="Seriennummer"
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!form.name.trim() || !form.category}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Equipment Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Equipment zuweisen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Autocomplete
              options={employees}
              getOptionLabel={(emp) => `${emp.firstName} ${emp.lastName} (${emp.email})`}
              value={employees.find((e) => e.id === selectedEmployeeId) || null}
              onChange={(_, newValue) => setSelectedEmployeeId(newValue?.id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Mitarbeiter auswählen"
                  required
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={!selectedEmployeeId}
          >
            Zuweisen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnboardingEquipmentSubTab;
