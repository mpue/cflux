import React from 'react';
import { BaseModal } from '../common/BaseModal';
import './WorkflowMessageDialog.css';

interface WorkflowMessageDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export const WorkflowMessageDialog: React.FC<WorkflowMessageDialogProps> = ({
  isOpen,
  title,
  message,
  buttonText = 'OK',
  onClose,
}) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="600px">
      <div className="workflow-message-dialog">
        <h2 className="dialog-title">{title}</h2>
        <div 
          className="dialog-content"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <div className="dialog-actions">
          <button 
            className="btn btn-primary"
            onClick={onClose}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
