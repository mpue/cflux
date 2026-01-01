import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

// Mock services
jest.mock('../services/auth.service');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const MockedLogin = () => (
  <BrowserRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form', () => {
    render(<MockedLogin />);
    
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/passwort/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument();
  });

  it('submits form with valid credentials', async () => {
    const mockUser = { 
      id: '1', 
      email: 'test@example.com', 
      firstName: 'Test',
      lastName: 'User',
      role: 'USER' as const,
      requiresPasswordChange: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      vacationDays: 30
    };
    
    (authService.login as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: 'fake-token'
    });

    render(<MockedLogin />);
    
    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/passwort/i);
    const submitButton = screen.getByRole('button', { name: /anmelden/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on failed login', async () => {
    (authService.login as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });

    render(<MockedLogin />);
    
    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/passwort/i);
    const submitButton = screen.getByRole('button', { name: /anmelden/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
