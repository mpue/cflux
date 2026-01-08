import React, { useRef, useState } from 'react';
import '../styles/LogoUpload.css';

interface LogoUploadProps {
  currentLogo?: string;
  onLogoChange: (logoUrl: string) => void;
  onLogoRemove: () => void;
}

const LogoUpload: React.FC<LogoUploadProps> = ({ currentLogo, onLogoChange, onLogoRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Nur PNG, JPG und SVG Dateien sind erlaubt');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Die Datei darf maximal 5MB groß sein');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const token = localStorage.getItem('token');

      const response = await fetch('/api/uploads/logo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload fehlgeschlagen' }));
        throw new Error(errorData.error || 'Upload fehlgeschlagen');
      }

      const data = await response.json();
      onLogoChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Hochladen des Logos');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = () => {
    onLogoRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="logo-upload">
      {currentLogo ? (
        <div className="logo-preview">
          <img src={currentLogo} alt="Logo" />
          <div className="logo-actions">
            <button
              type="button"
              className="btn-change"
              onClick={() => fileInputRef.current?.click()}
            >
              Ändern
            </button>
            <button type="button" className="btn-remove" onClick={handleRemove}>
              Entfernen
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`logo-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="uploading">
              <div className="spinner"></div>
              <span>Hochladen...</span>
            </div>
          ) : (
            <>
              <svg
                className="upload-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="upload-text">
                Logo hochladen oder hier ablegen
              </span>
              <span className="upload-hint">PNG, JPG oder SVG (max. 5MB)</span>
            </>
          )}
        </div>
      )}

      {error && <div className="upload-error">{error}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default LogoUpload;
