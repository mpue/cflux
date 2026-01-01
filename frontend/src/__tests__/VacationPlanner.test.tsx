import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VacationPlanner from '../pages/VacationPlanner';
import { absenceService } from '../services/absence.service';
import { userService } from '../services/user.service';

jest.mock('../services/absence.service');
jest.mock('../services/user.service');

const mockUser = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'USER' as const,
  vacationDays: 30,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

const MockedVacationPlanner = () => (
  <BrowserRouter>
    <VacationPlanner />
  </BrowserRouter>
);

describe('VacationPlanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userService.getAllUsers as jest.Mock).mockResolvedValue([mockUser]);
    (absenceService.getAllAbsenceRequests as jest.Mock).mockResolvedValue([]);
  });

  it('renders vacation planner', async () => {
    render(<MockedVacationPlanner />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /urlaubsplaner/i })).toBeInTheDocument();
    });
  });

  it('displays available vacation days', async () => {
    render(<MockedVacationPlanner />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/30/).length).toBeGreaterThan(0);
    });
  });
});
