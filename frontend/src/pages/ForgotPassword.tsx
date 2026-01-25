import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';
import '../App.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    document.title = 'CFlux - Passwort vergessen';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/request-password-reset', { email });
      setMessage(response.data.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
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
            Passwort vergessen
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {submitted 
              ? 'Prüfen Sie Ihr E-Mail-Postfach' 
              : 'Geben Sie Ihre E-Mail-Adresse ein'}
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

        {message && (
          <div style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #6ee7b7',
            color: '#047857',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            <strong>✓ E-Mail versendet!</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              {message}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Der Link ist 1 Stunde gültig.
            </p>
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="email" style={{ 
                display: 'block',
                fontSize: '14px', 
                color: '#4b5563',
                marginBottom: '4px'
              }}>
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="ihre.email@beispiel.ch"
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
              {loading ? 'Wird gesendet...' : 'Reset-Link senden →'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              📧
            </div>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              Falls ein Konto mit der E-Mail-Adresse <strong>{email}</strong> existiert, 
              haben wir Ihnen einen Link zum Zurücksetzen des Passworts geschickt.
            </p>
          </div>
        )}

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

export default ForgotPassword;
