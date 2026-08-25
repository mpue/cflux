import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ChangePasswordModalProps {
  isFirstLogin: boolean;
  onPasswordChanged: () => void;
  onCancel?: () => void;
}

/** Akzentfarben der Login-Seite. */
const ACCENT = '#10b981';
const ACCENT_GRADIENT = 'linear-gradient(to right, #10b981, #0ea5e9)';

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isFirstLogin,
  onPasswordChanged,
  onCancel
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel && !isFirstLogin) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel, isFirstLogin]);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  // ---- Styles in der Bildsprache der Login-Seite ----

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    color: isDark ? '#d1d5db' : '#4b5563',
    marginBottom: '4px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 40px 10px 16px',
    border: `1px solid ${isDark ? '#4a4a4a' : '#d1d5db'}`,
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
    color: isDark ? '#f5f5f5' : '#1f2937'
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = ACCENT;
    e.target.style.boxShadow = `0 0 0 3px rgba(16, 185, 129, ${isDark ? '0.2' : '0.1'})`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = isDark ? '#4a4a4a' : '#d1d5db';
    e.target.style.boxShadow = 'none';
  };

  const noticeStyle = (tone: 'error' | 'success' | 'info'): React.CSSProperties => {
    const palette = {
      error: {
        bg: isDark ? '#3b1a1a' : '#fef2f2',
        border: isDark ? '#b91c1c' : '#fecaca',
        color: isDark ? '#fca5a5' : '#dc2626'
      },
      success: {
        bg: isDark ? '#0f2e21' : '#ecfdf5',
        border: isDark ? '#15803d' : '#a7f3d0',
        color: isDark ? '#6ee7b7' : '#047857'
      },
      info: {
        bg: isDark ? '#3d2c00' : '#fef3c7',
        border: isDark ? '#a16207' : '#fcd34d',
        color: isDark ? '#fde68a' : '#92400e'
      }
    }[tone];

    return {
      backgroundColor: palette.bg,
      border: `1px solid ${palette.border}`,
      color: palette.color,
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px'
    };
  };

  const toggleButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: isDark ? '#9ca3af' : '#6b7280',
    fontSize: '18px',
    lineHeight: 1
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    if (newPassword.length < 6) {
      setError('Das neue Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Das neue Passwort muss sich vom aktuellen unterscheiden');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Ändern des Passworts');
      }

      // Kurze Bestätigung im Dialog statt eines nativen alert()
      setSuccess(true);
      successTimer.current = setTimeout(onPasswordChanged, 1200);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern des Passworts');
      setLoading(false);
    }
  };

  const renderPasswordField = (
    id: string,
    label: React.ReactNode,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    toggleVisible: () => void,
    autoComplete: string,
    hint?: string
  ) => (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={autoComplete === 'new-password' ? 6 : undefined}
          autoComplete={autoComplete}
          disabled={loading || success}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <button
          type="button"
          onClick={toggleVisible}
          style={toggleButtonStyle}
          tabIndex={-1}
          aria-label={visible ? 'Passwort verbergen' : 'Passwort anzeigen'}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
      {hint && (
        <small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280' }}>
          {hint}
        </small>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 10000
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        style={{
          width: '100%',
          maxWidth: '450px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          borderRadius: '16px',
          boxShadow: isDark
            ? '0 20px 25px -5px rgba(0,0,0,0.6), 0 10px 10px -5px rgba(0,0,0,0.4)'
            : '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          padding: '32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
          <h2
            id="change-password-title"
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: isDark ? '#f5f5f5' : '#1f2937'
            }}
          >
            {isFirstLogin ? 'Passwort ändern erforderlich' : 'Passwort ändern'}
          </h2>
          {!isFirstLogin && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Schließen"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '22px',
                lineHeight: 1,
                padding: '2px 6px',
                color: isDark ? '#9ca3af' : '#6b7280'
              }}
            >
              ×
            </button>
          )}
        </div>

        {isFirstLogin && !success && (
          <div style={noticeStyle('info')}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              Dies ist Ihre erste Anmeldung.
            </div>
            <div>
              Aus Sicherheitsgründen müssen Sie Ihr Passwort ändern, bevor Sie fortfahren können.
            </div>
          </div>
        )}

        {error && <div style={noticeStyle('error')}>{error}</div>}

        {success ? (
          <div style={noticeStyle('success')}>
            <div style={{ fontWeight: 600 }}>Passwort erfolgreich geändert</div>
            <div style={{ marginTop: '4px' }}>Sie werden weitergeleitet …</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {renderPasswordField(
              'currentPassword',
              'Aktuelles Passwort',
              currentPassword,
              setCurrentPassword,
              showCurrentPassword,
              () => setShowCurrentPassword(!showCurrentPassword),
              'current-password'
            )}

            {renderPasswordField(
              'newPassword',
              'Neues Passwort',
              newPassword,
              setNewPassword,
              showNewPassword,
              () => setShowNewPassword(!showNewPassword),
              'new-password',
              'Mindestens 6 Zeichen'
            )}

            {renderPasswordField(
              'confirmPassword',
              'Neues Passwort bestätigen',
              confirmPassword,
              setConfirmPassword,
              showConfirmPassword,
              () => setShowConfirmPassword(!showConfirmPassword),
              'new-password'
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                color: 'white',
                fontWeight: 500,
                fontSize: '15px',
                background: loading ? '#9ca3af' : ACCENT_GRADIENT,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (loading) return;
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Wird geändert …' : 'Passwort ändern'}
            </button>

            {!isFirstLogin && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#4a4a4a' : '#d1d5db'}`,
                  background: 'transparent',
                  color: isDark ? '#d1d5db' : '#4b5563',
                  fontWeight: 500,
                  fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Abbrechen
              </button>
            )}
          </form>
        )}

        {isFirstLogin && !success && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: `1px solid ${isDark ? '#333333' : '#e5e7eb'}`,
              fontSize: '13px',
              color: isDark ? '#9ca3af' : '#6b7280'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '8px', color: isDark ? '#d1d5db' : '#4b5563' }}>
              Tipps für ein sicheres Passwort
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
              <li>Mindestens 8 Zeichen</li>
              <li>Gross- und Kleinbuchstaben kombinieren</li>
              <li>Zahlen und Sonderzeichen ergänzen</li>
              <li>Kein Passwort, das Sie bereits woanders nutzen</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
