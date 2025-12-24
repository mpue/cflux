import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'CFlux - Anmelden';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login fehlgeschlagen');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <div className="card" style={{ width: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontWeight: 'bold', fontSize: '32px', marginBottom: '20px' }}>CFlux</h1>
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            style={{ maxWidth: '200px', height: 'auto' }}
          />
        </div>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Anmelden</h2>
        
        {error && <div className="error" style={{ marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Anmelden
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Noch kein Konto? <Link to="/register">Registrieren</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
