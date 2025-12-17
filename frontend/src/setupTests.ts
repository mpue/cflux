import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Setup für Testing Library
beforeEach(() => {
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock window.alert
  global.alert = jest.fn();
  
  // Mock window.confirm
  global.confirm = jest.fn(() => true);
});

afterEach(() => {
  jest.clearAllMocks();
});
