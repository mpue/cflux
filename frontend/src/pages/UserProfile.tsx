import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import { Lock as LockIcon, Person as PersonIcon } from '@mui/icons-material';
import api from '../services/api';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Bitte alle Felder ausfüllen' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Das neue Passwort muss mindestens 6 Zeichen lang sein' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Die neuen Passwörter stimmen nicht überein' });
      return;
    }

    setLoading(true);

    try {
      await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });

      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Fehler beim Ändern des Passworts';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <PersonIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Benutzerprofil
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* User Information */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Persönliche Informationen
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {user?.firstName} {user?.lastName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  E-Mail
                </Typography>
                <Typography variant="body1">
                  {user?.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Rolle
                </Typography>
                <Typography variant="body1">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Benutzer'}
                </Typography>
              </Grid>
              {user?.employeeNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Personalnummer
                  </Typography>
                  <Typography variant="body1">
                    {user.employeeNumber}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Password Change Form */}
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Passwort ändern
              </Typography>
            </Box>

            {message && (
              <Alert severity={message.type} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <form onSubmit={handlePasswordChange}>
              <TextField
                fullWidth
                type="password"
                label="Aktuelles Passwort"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
              />
              <TextField
                fullWidth
                type="password"
                label="Neues Passwort"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="new-password"
                helperText="Mindestens 6 Zeichen"
              />
              <TextField
                fullWidth
                type="password"
                label="Neues Passwort bestätigen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="new-password"
              />
              <Box mt={3}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Wird gespeichert...' : 'Passwort ändern'}
                </Button>
              </Box>
            </form>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default UserProfile;
