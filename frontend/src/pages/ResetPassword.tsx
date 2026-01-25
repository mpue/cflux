import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';
import '../App.css';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from URL query parameter
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('token');
  };

  const token = getTokenFromUrl();

  useEffect(() => {
    document.title = 'CFlux - Passwort zurücksetzen';
    
    // Verify token on component mount
    const verifyToken = async () => {
      if (!token) {
        setError('Kein gültiger Token gefunden. Bitte fordern Sie einen neuen Reset-Link an.');
        setVerifying(false);
        return;
      }

      try {
        const response = await api.post('/auth/verify-reset-token', { token });
        setTokenValid(true);
        setEmail(response.data.email);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Token ist ungültig oder abgelaufen');
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (newPassword.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      
      setSuccess(true);
      setMessage('Ihr Passwort wurde erfolgreich zurückgesetzt!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Zurücksetzen des Passworts');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while verifying token
  if (verifying) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #d1fae5 100%)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Token wird überprüft...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #d1fae5 100%)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img 
              src={logo} 
              alt="Logo" 
              style={{ height: '56px', margin: '0 auto 12px' }}
            />
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
              Ungültiger Token
            </h1>
          </div>

          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>

          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', textAlign: 'center' }}>
            Der Link ist möglicherweise abgelaufen oder wurde bereits verwendet.
          </p>

          <Link 
            to="/forgot-password" 
            style={{ 
              display: 'block',
              textAlign: 'center',
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              color: 'white',
              fontWeight: '500',
              fontSize: '15px',
              background: 'linear-gradient(to right, #10b981, #0ea5e9)',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            Neuen Reset-Link anfordern →
          </Link>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link 
              to="/login" 
              style={{ 
                color: '#10b981', 
                fontWeight: '500',
                textDecoration: 'none',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              ← Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #d1fae5 100%)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✓</div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
            Erfolgreich!
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            {message}
          </p>
          <p style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>
            Sie werden automatisch weitergeleitet...
          </p>
        </div>
      </div>
    );
  }

  // Show password reset form
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #d1fae5 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '40px'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ height: '56px', margin: '0 auto 12px' }}
          />
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
            Neues Passwort setzen
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            für {email}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="newPassword" style={{ 
              display: 'block',
              fontSize: '14px', 
              color: '#4b5563',
              marginBottom: '4px'
            }}>
              Neues Passwort
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Mindestens 6 Zeichen"
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="confirmPassword" style={{ 
              display: 'block',
              fontSize: '14px', 
              color: '#4b5563',
              marginBottom: '4px'
            }}>
              Passwort bestätigen
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Passwort wiederholen"
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              color: 'white',
              fontWeight: '500',
              fontSize: '15px',
              background: loading ? '#9ca3af' : 'linear-gradient(to right, #10b981, #0ea5e9)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Wird gespeichert...' : 'Passwort zurücksetzen →'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <Link 
            to="/login" 
            style={{ 
              color: '#10b981', 
              fontWeight: '500',
              textDecoration: 'none',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            ← Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
