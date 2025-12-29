import React, { useEffect, ReactNode } from 'react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  maxWidth?: string;
}

/**
 * Wiederverwendbare Modal-Basiskomponente mit automatischer Escape-Taste-Unterstützung
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  maxWidth = '600px',
}) => {
  useEffect(() => {
    if (isOpen && closeOnEscape) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div 
        className={`modal ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
};
