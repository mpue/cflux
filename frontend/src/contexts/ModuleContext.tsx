import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import moduleService, { Module } from '../services/module.service';
import { useAuth } from './AuthContext';

interface ModuleContextType {
  modules: Module[];
  loading: boolean;
  error: string | null;
  hasModuleAccess: (moduleKey: string) => boolean;
  canCreate: (moduleKey: string) => boolean;
  canEdit: (moduleKey: string) => boolean;
  canDelete: (moduleKey: string) => boolean;
  refreshModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadModules = async () => {
    if (!user) {
      setModules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await moduleService.getModulesForCurrentUser();
      setModules(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Module');
      console.error('Error loading modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, [user]);

  const hasModuleAccess = (moduleKey: string): boolean => {
    // Admins have access to everything
    if (user?.role === 'ADMIN') {
      return true;
    }

    const module = modules.find((m) => m.key === moduleKey);
    return module?.permissions?.canView || false;
  };

  const canCreate = (moduleKey: string): boolean => {
    if (user?.role === 'ADMIN') {
      return true;
    }

    const module = modules.find((m) => m.key === moduleKey);
    return module?.permissions?.canCreate || false;
  };

  const canEdit = (moduleKey: string): boolean => {
    if (user?.role === 'ADMIN') {
      return true;
    }

    const module = modules.find((m) => m.key === moduleKey);
    return module?.permissions?.canEdit || false;
  };

  const canDelete = (moduleKey: string): boolean => {
    if (user?.role === 'ADMIN') {
      return true;
    }

    const module = modules.find((m) => m.key === moduleKey);
    return module?.permissions?.canDelete || false;
  };

  const refreshModules = async () => {
    await loadModules();
  };

  return (
    <ModuleContext.Provider
      value={{
        modules,
        loading,
        error,
        hasModuleAccess,
        canCreate,
        canEdit,
        canDelete,
        refreshModules,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = (): ModuleContextType => {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
};
