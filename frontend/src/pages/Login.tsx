import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import logo from '../assets/logo.png';
import '../App.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const { login, user, refreshUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'CFlux - Anmelden';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      // Login successful, now check if we're in the auth context
      // We need to wait a bit for the user state to update
      setTimeout(() => {
        // Check will happen in useEffect
      }, 100);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login fehlgeschlagen');
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
            CFlux
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Manage your data flow efficiently
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
            <label htmlFor="email" style={{ 
              display: 'block',
              fontSize: '14px', 
              color: '#4b5563',
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
            <label htmlFor="password" style={{ 
              display: 'block',
              fontSize: '14px', 
              color: '#4b5563',
              marginBottom: '4px'
            }}>
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              color: 'white',
              fontWeight: '500',
              fontSize: '15px',
              background: 'linear-gradient(to right, #10b981, #0ea5e9)',
              cursor: 'pointer',
              transition: 'all 0.2s'
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
          color: '#6b7280',
          marginTop: '24px'
        }}>
          Noch kein Konto?{' '}
          <Link 
            to="/register" 
            style={{ 
              color: '#10b981', 
              fontWeight: '500',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Registrieren
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
