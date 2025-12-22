import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerModal } from '../components/CustomerModal';

describe('CustomerModal Component', () => {
  const mockCustomer = {
    id: '1',
    name: 'Test Company',
    email: 'contact@testcompany.com',
    phone: '+41 44 123 45 67',
    address: 'Test Street 1',
    city: 'Zurich',
    postalCode: '8000',
    zipCode: '8000',
    country: 'Switzerland',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders customer modal for editing', () => {
    render(
      <CustomerModal
        customer={mockCustomer}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
  });

  it('renders customer modal for creating', () => {
    render(
      <CustomerModal
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
