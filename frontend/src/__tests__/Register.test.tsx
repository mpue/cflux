import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { AuthProvider } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

jest.mock('../services/auth.service');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const MockedRegister = () => (
  <BrowserRouter>
    <AuthProvider>
      <Register />
    </AuthProvider>
  </BrowserRouter>
);

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders register form', () => {
    render(<MockedRegister />);
    
    expect(screen.getByLabelText(/vorname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nachname/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    (authService.register as jest.Mock).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      token: 'test-token',
    });
    
    render(<MockedRegister />);
    
    const vorname = screen.getByLabelText(/vorname/i);
    const nachname = screen.getByLabelText(/nachname/i);
    const email = screen.getByLabelText(/e-mail/i);
    const password = screen.getAllByLabelText(/passwort/i)[0];
    
    fireEvent.change(vorname, { target: { value: 'John' } });
    fireEvent.change(nachname, { target: { value: 'Doe' } });
    fireEvent.change(email, { target: { value: 'john@example.com' } });
    fireEvent.change(password, { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /registrieren/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
    });
  });
});
