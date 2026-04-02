import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { workflowService } from '../services/workflow.service';
import { WorkflowMessageDialog } from '../components/workflow/WorkflowMessageDialog';

interface WorkflowMessageContextType {
  checkForDialogs: () => void;
}

const WorkflowMessageContext = createContext<WorkflowMessageContextType | undefined>(undefined);

export const useWorkflowMessages = () => {
  const context = useContext(WorkflowMessageContext);
  if (!context) {
    throw new Error('useWorkflowMessages must be used within WorkflowMessageProvider');
  }
  return context;
};

interface PendingDialog {
  instanceStepId: string;
  title: string;
  message: string;
  buttonText: string;
  workflowName: string;
}

export const WorkflowMessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [dialogs, setDialogs] = useState<PendingDialog[]>([]);
  const [currentDialog, setCurrentDialog] = useState<PendingDialog | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDialogs = useCallback(async () => {
    if (!user) return;
    try {
      const pending = await workflowService.getMyMessageDialogs();
      if (pending.length > 0) {
        setDialogs(pending);
        if (!currentDialog) {
          setCurrentDialog(pending[0]);
        }
      }
    } catch {
      // Silently ignore - user might not have workflow permissions
    }
  }, [user, currentDialog]);

  useEffect(() => {
    if (!user) {
      setDialogs([]);
      setCurrentDialog(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    fetchDialogs();

    // Poll every 15 seconds
    intervalRef.current = setInterval(fetchDialogs, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, fetchDialogs]);

  const handleAcknowledge = async () => {
    if (!currentDialog) return;
    try {
      await workflowService.acknowledgeMessageDialog(currentDialog.instanceStepId);
    } catch {
      // ignore
    }
    const remaining = dialogs.filter((d) => d.instanceStepId !== currentDialog.instanceStepId);
    setDialogs(remaining);
    setCurrentDialog(remaining.length > 0 ? remaining[0] : null);
  };

  const checkForDialogs = useCallback(() => {
    fetchDialogs();
  }, [fetchDialogs]);

  return (
    <WorkflowMessageContext.Provider value={{ checkForDialogs }}>
      {children}
      {currentDialog && (
        <WorkflowMessageDialog
          isOpen={true}
          title={currentDialog.title}
          message={currentDialog.message}
          buttonText={currentDialog.buttonText}
          onClose={handleAcknowledge}
        />
      )}
    </WorkflowMessageContext.Provider>
  );
};
