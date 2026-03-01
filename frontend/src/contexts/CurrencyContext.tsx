import React, { createContext, useContext, useState, useEffect } from 'react';
import { systemSettingsService } from '../services/systemSettings.service';

interface CurrencyContextType {
  currency: string;
  formatAmount: (amount: number, decimals?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>(() => {
    // Try to load from localStorage cache first for instant rendering
    return localStorage.getItem('systemCurrency') || 'CHF';
  });

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const settings = await systemSettingsService.getPublicSettings();
        if (settings.currency) {
          setCurrency(settings.currency);
          localStorage.setItem('systemCurrency', settings.currency);
        }
      } catch (err) {
        // If public settings fail, try authenticated endpoint
        try {
          const settings = await systemSettingsService.getSettings();
          if (settings.currency) {
            setCurrency(settings.currency);
            localStorage.setItem('systemCurrency', settings.currency);
          }
        } catch {
          // Keep default from localStorage or 'CHF'
        }
      }
    };
    loadCurrency();
  }, []);

  const formatAmount = (amount: number, decimals: number = 2) => {
    return `${currency} ${amount.toFixed(decimals)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
