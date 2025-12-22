import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserDetailModal } from '../components/UserDetailModal';

describe('UserDetailModal Component', () => {
  const mockUser = {
    id: '1',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as const,
    isActive: true,
    vacationDays: 30,
    hourlyWage: 50,
    weeklyHours: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user detail modal', () => {
    render(
      <UserDetailModal
        user={mockUser}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
  });

  it('closes modal on close button click', () => {
    render(
      <UserDetailModal
        user={mockUser}
        isOpen={true}
        onClose={mockOnClose}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /schließen|abbrechen/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('updates user details', async () => {
    mockOnSave.mockResolvedValue(undefined);
    
    render(
      <UserDetailModal
        user={mockUser}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    
    const saveButton = screen.getByRole('button', { name: /speichern/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'Jane',
      }));
    });
  });

  it('validates required fields', async () => {
    const mockOnSaveLocal = jest.fn();
    render(
      <UserDetailModal
        user={mockUser}
        onClose={mockOnClose}
        onSave={mockOnSaveLocal}
      />
    );
    
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: '' } });
    
    const saveButton = screen.getByRole('button', { name: /speichern/i });
    fireEvent.click(saveButton);
    
    // Form should not submit with empty required field
    expect(mockOnSaveLocal).not.toHaveBeenCalled();
  });
});
