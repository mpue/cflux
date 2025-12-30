import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TravelExpense, travelExpenseService } from '../services/travelExpense.service';
import { TravelExpensesPage } from './TravelExpensesPage';

export const TravelExpensesPageWrapper: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<TravelExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = async () => {
    try {
      const data = await travelExpenseService.getAllTravelExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Error loading travel expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div>
        <nav className="navbar">
          <h1 className="navbar-title">Time Tracking System</h1>
          <div className="navbar-right">
            <span className="navbar-user">{user?.firstName} {user?.lastName}</span>
          </div>
        </nav>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Lade Reisekosten...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <h1 className="navbar-title">Time Tracking System</h1>
        <div className="navbar-right">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Zurück zum Dashboard
          </button>
          <span className="navbar-user">{user?.firstName} {user?.lastName}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Abmelden
          </button>
        </div>
      </nav>
      <div style={{ padding: '20px' }}>
        <TravelExpensesPage
          expenses={expenses}
          isAdmin={user?.role === 'ADMIN'}
          onUpdate={loadExpenses}
        />
      </div>
    </div>
  );
};
