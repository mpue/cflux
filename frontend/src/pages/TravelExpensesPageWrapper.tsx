import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TravelExpense, travelExpenseService } from '../services/travelExpense.service';
import { TravelExpensesPage } from './TravelExpensesPage';
import AppNavbar from '../components/AppNavbar';

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
      <>
        <AppNavbar title="Reisekosten" onLogout={handleLogout} />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Lade Reisekosten...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNavbar title="Reisekosten" onLogout={handleLogout} />
      <div style={{ padding: '20px' }}>
        <TravelExpensesPage
          expenses={expenses}
          isAdmin={user?.role === 'ADMIN'}
          onUpdate={loadExpenses}
        />
      </div>
    </>
  );
};
