import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import logo from '../assets/logo.png';
import '../App.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const { login, user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'CFlux - Anmelden';
  }, []);

  // Countdown timer for lockout
  React.useEffect(() => {
    if (lockedSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockedSeconds(prev => {
        if (prev <= 1) {
          setError('');
          setAttemptsLeft(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedSeconds > 0) return;
    setError('');
    setAttemptsLeft(null);

    try {
      await login(email, password);
      setLockedSeconds(0);
      setAttemptsLeft(null);
      setTimeout(() => {}, 100);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.throttled && data?.lockedUntil) {
        setLockedSeconds(data.lockedUntil);
        setAttemptsLeft(0);
      } else if (data?.attemptsLeft !== undefined) {
        setAttemptsLeft(data.attemptsLeft);
      }
      setError(data?.error || 'Login fehlgeschlagen');
    }
  };

  // Check if password change is required after login
  React.useEffect(() => {
    if (user && user.requiresPasswordChange) {
      setShowPasswordChangeModal(true);
    } else if (user && !user.requiresPasswordChange) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handlePasswordChanged = async () => {
    // Refresh user data to clear the requiresPasswordChange flag
    await refreshUser();
    setShowPasswordChangeModal(false);
    navigate('/dashboard');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #0a0f1e 0%, #0a1a12 100%)'
        : 'linear-gradient(135deg, #e0f2fe 0%, #d1fae5 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: isDark ? '#1e1e1e' : 'white',
        borderRadius: '16px',
        boxShadow: isDark
          ? '0 20px 25px -5px rgba(0,0,0,0.6), 0 10px 10px -5px rgba(0,0,0,0.4)'
          : '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        padding: '40px'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ height: '56px', margin: '0 auto 12px' }}
          />
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: isDark ? '#f5f5f5' : '#1f2937' }}>
            CFlux
          </h1>
          <p style={{ fontSize: '14px', color: isDark ? '#b0b0b0' : '#6b7280' }}>
            Manage your data flow efficiently
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: lockedSeconds > 0
              ? (isDark ? '#3d2c00' : '#fef3c7')
              : (isDark ? '#3b1a1a' : '#fef2f2'),
            border: `1px solid ${lockedSeconds > 0 ? (isDark ? '#a16207' : '#fcd34d') : (isDark ? '#b91c1c' : '#fecaca')}`,
            color: lockedSeconds > 0
              ? (isDark ? '#fde68a' : '#92400e')
              : (isDark ? '#fca5a5' : '#dc2626'),
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            <div>{error}</div>
            {lockedSeconds > 0 && (
              <div style={{ marginTop: '8px', fontWeight: 600 }}>
                ⏱️ Entsperrt in {Math.floor(lockedSeconds / 60)}:{String(lockedSeconds % 60).padStart(2, '0')}
              </div>
            )}
            {attemptsLeft !== null && attemptsLeft > 0 && (
              <div style={{ marginTop: '6px', fontSize: '13px', opacity: 0.85 }}>
                Noch {attemptsLeft} Versuch{attemptsLeft > 1 ? 'e' : ''} übrig
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ 
              display: 'block',
              fontSize: '14px', 
              color: isDark ? '#d1d5db' : '#4b5563',
              marginBottom: '4px'
            }}>
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 16px',
                border: `1px solid ${isDark ? '#4a4a4a' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
                color: isDark ? '#f5f5f5' : '#1f2937'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.boxShadow = `0 0 0 3px rgba(16, 185, 129, ${isDark ? '0.2' : '0.1'})`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDark ? '#4a4a4a' : '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="password" style={{ 
              display: 'block',
              fontSize: '14px', 
              color: isDark ? '#d1d5db' : '#4b5563',
              marginBottom: '4px'
            }}>
              Passwort
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 16px',
                  border: `1px solid ${isDark ? '#4a4a4a' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
                  color: isDark ? '#f5f5f5' : '#1f2937'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = `0 0 0 3px rgba(16, 185, 129, ${isDark ? '0.2' : '0.1'})`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark ? '#4a4a4a' : '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
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
                  lineHeight: 1,
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={lockedSeconds > 0}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              color: 'white',
              fontWeight: '500',
              fontSize: '15px',
              background: lockedSeconds > 0 ? '#9ca3af' : 'linear-gradient(to right, #10b981, #0ea5e9)',
              cursor: lockedSeconds > 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: lockedSeconds > 0 ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Anmelden →
          </button>
        </form>

        <p style={{ 
          textAlign: 'center', 
          fontSize: '14px', 
          color: isDark ? '#9ca3af' : '#6b7280',
          marginTop: '24px'
        }}>
          <Link 
            to="/forgot-password" 
            style={{ 
              color: '#10b981', 
              fontWeight: '500',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Passwort vergessen?
          </Link>
        </p>
      </div>

      {showPasswordChangeModal && user && (
        <ChangePasswordModal
          isFirstLogin={true}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
    </div>
  );
};

export default Login;
