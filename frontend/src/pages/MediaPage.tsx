import React, { useState, useEffect } from 'react';
import { mediaService, Media, MediaType } from '../services/media.service';

interface MediaPageProps {
  media: Media[];
  isAdmin: boolean;
  onUpdate: () => void;
}

export const MediaPage: React.FC<MediaPageProps> = ({ media: initialMedia, isAdmin, onUpdate }) => {
  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [filterType, setFilterType] = useState<MediaType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    description: '',
    tags: '',
    isPublic: false
  });
  const [statistics, setStatistics] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const mediaTypes = [
    { value: '', label: 'Alle Medien' },
    { value: 'IMAGE', label: '🖼️ Bilder' },
    { value: 'PDF', label: '📄 PDF' },
    { value: 'DOCUMENT', label: '📝 Dokumente' },
    { value: 'VIDEO', label: '🎥 Videos' },
    { value: 'AUDIO', label: '🎵 Audio' },
    { value: 'ARCHIVE', label: '📦 Archive' },
    { value: 'EXECUTABLE', label: '⚙️ Programme' },
    { value: 'OTHER', label: '📋 Andere' }
  ];

  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  useEffect(() => {
    loadMedia();
    loadStatistics();
  }, [filterType, searchQuery]);

  const loadMedia = async () => {
    try {
      const filters: any = {};
      if (filterType) filters.mediaType = filterType;
      if (searchQuery) filters.search = searchQuery;
      
      const data = await mediaService.getAllMedia(filters);
      setMedia(data);
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await mediaService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      await mediaService.uploadMedia(uploadFile, {
        description: uploadData.description,
        tags: uploadData.tags,
        isPublic: uploadData.isPublic
      });

      setIsModalOpen(false);
      setUploadFile(null);
      setUploadData({ description: '', tags: '', isPublic: false });
      onUpdate();
      loadStatistics();
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Fehler beim Hochladen der Datei');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Datei wirklich löschen?')) return;

    try {
      await mediaService.deleteMedia(id);
      onUpdate();
      loadStatistics();
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Fehler beim Löschen der Datei');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await mediaService.downloadMedia(id);
    } catch (error) {
      console.error('Error downloading media:', error);
      alert('Fehler beim Herunterladen der Datei');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getMediaIcon = (type: MediaType): string => {
    const icons: Record<MediaType, string> = {
      IMAGE: '🖼️',
      PDF: '📄',
      DOCUMENT: '📝',
      VIDEO: '🎥',
      AUDIO: '🎵',
      ARCHIVE: '📦',
      EXECUTABLE: '⚙️',
      OTHER: '📋'
    };
    return icons[type] || '📋';
  };

  const renderMediaPreview = (item: Media) => {
    if (item.mediaType === 'IMAGE') {
      return (
        <img
          src={`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/${item.path}`}
          alt={item.originalFilename}
          style={{ 
            width: '100%', 
            height: '200px', 
            objectFit: 'cover' 
          }}
        />
      );
    }
    return (
      <div style={{ 
        width: '100%', 
        height: '200px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <span style={{ fontSize: '4em' }}>{getMediaIcon(item.mediaType)}</span>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📁 Medien-Verwaltung</h2>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Datei hochladen
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          gap: '30px'
        }}>
          <div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Gesamt</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#0369a1' }}>
              {statistics.total}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Speicherplatz</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#059669' }}>
              {formatFileSize(statistics.totalSize)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Öffentlich</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#10b981' }}>
              {statistics.public}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Privat</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#f59e0b' }}>
              {statistics.private}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as MediaType | '')}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {mediaTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Dateiname oder Beschreibung..."
          style={{ 
            flex: 1, 
            padding: '8px', 
            borderRadius: '4px', 
            border: '1px solid #ccc' 
          }}
        />
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'btn btn-primary' : 'btn'}
            style={{ padding: '8px 16px' }}
          >
            🔲 Raster
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'btn btn-primary' : 'btn'}
            style={{ padding: '8px 16px' }}
          >
            📋 Liste
          </button>
        </div>
      </div>

      {/* Media Grid/List */}
      {viewMode === 'grid' ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '20px' 
        }}>
          {media.map((item) => (
            <div key={item.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div 
                style={{ cursor: 'pointer' }} 
                onClick={() => setSelectedMedia(item)}
              >
                {renderMediaPreview(item)}
              </div>
              <div style={{ padding: '16px' }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }} title={item.originalFilename}>
                  {item.originalFilename}
                </h3>
                <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '8px' }}>
                  {formatFileSize(item.fileSize)}
                </p>
                {item.description && (
                  <p style={{ 
                    fontSize: '0.85em', 
                    color: '#666', 
                    marginBottom: '12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.description}
                  </p>
                )}
                {item.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          fontSize: '0.75em',
                          borderRadius: '12px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDownload(item.id)}
                    className="btn btn-success"
                    style={{ flex: 1, padding: '6px', fontSize: '0.85em' }}
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-danger"
                    style={{ flex: 1, padding: '6px', fontSize: '0.85em' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Typ</th>
              <th>Dateiname</th>
              <th>Größe</th>
              <th>Hochgeladen</th>
              <th>Von</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {media.map((item) => (
              <tr key={item.id}>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5em' }}>{getMediaIcon(item.mediaType)}</span>
                </td>
                <td>
                  <div style={{ fontWeight: '500' }}>
                    {item.originalFilename}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {item.description}
                    </div>
                  )}
                </td>
                <td>{formatFileSize(item.fileSize)}</td>
                <td>{new Date(item.createdAt).toLocaleDateString('de-CH')}</td>
                <td>{item.uploadedBy.firstName} {item.uploadedBy.lastName}</td>
                <td>
                  <button
                    onClick={() => handleDownload(item.id)}
                    className="btn btn-success"
                    style={{ marginRight: '8px', padding: '4px 12px', fontSize: '0.85em' }}
                  >
                    ⬇️ Download
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-danger"
                    style={{ padding: '4px 12px', fontSize: '0.85em' }}
                  >
                    🗑️ Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {media.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#999',
          fontSize: '1.1em'
        }}>
          Keine Medien gefunden
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.5em', fontWeight: 'bold' }}>
              Datei hochladen
            </h2>
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Datei *
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                {uploadFile && (
                  <p style={{ marginTop: '8px', fontSize: '0.85em', color: '#666' }}>
                    Ausgewählt: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Beschreibung
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ccc', 
                    borderRadius: '4px',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Beschreiben Sie die Datei..."
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Tags (durch Komma getrennt)
                </label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  placeholder="z.B. logo, marketing, 2025"
                />
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadData.isPublic}
                  onChange={(e) => setUploadData({ ...uploadData, isPublic: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="isPublic" style={{ cursor: 'pointer' }}>
                  Öffentlich zugänglich
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setUploadFile(null);
                    setUploadData({ description: '', tags: '', isPublic: false });
                  }}
                  className="btn"
                  disabled={isUploading}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="btn btn-primary"
                >
                  {isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                {selectedMedia.originalFilename}
              </h2>
              <button
                onClick={() => setSelectedMedia(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1.5em', 
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            {selectedMedia.mediaType === 'IMAGE' && (
              <img
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/${selectedMedia.path}`}
                alt={selectedMedia.originalFilename}
                style={{ 
                  width: '100%', 
                  maxHeight: '400px', 
                  objectFit: 'contain', 
                  marginBottom: '20px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px'
                }}
              />
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontWeight: '600' }}>Typ:</span>
                <span style={{ marginLeft: '10px' }}>
                  {getMediaIcon(selectedMedia.mediaType)} {selectedMedia.mediaType}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontWeight: '600' }}>Größe:</span>
                <span style={{ marginLeft: '10px' }}>
                  {formatFileSize(selectedMedia.fileSize)}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontWeight: '600' }}>MIME-Type:</span>
                <span style={{ marginLeft: '10px' }}>{selectedMedia.mimeType}</span>
              </div>
              {selectedMedia.description && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600' }}>Beschreibung:</span>
                  <p style={{ marginTop: '4px', color: '#666' }}>{selectedMedia.description}</p>
                </div>
              )}
              {selectedMedia.tags.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600' }}>Tags:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {selectedMedia.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          fontSize: '0.85em',
                          borderRadius: '12px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontWeight: '600' }}>Hochgeladen:</span>
                <span style={{ marginLeft: '10px' }}>
                  {new Date(selectedMedia.createdAt).toLocaleString('de-CH')} von{' '}
                  {selectedMedia.uploadedBy.firstName} {selectedMedia.uploadedBy.lastName}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '600' }}>Status:</span>
                <span style={{ 
                  marginLeft: '10px',
                  color: selectedMedia.isPublic ? '#059669' : '#f59e0b'
                }}>
                  {selectedMedia.isPublic ? '🌐 Öffentlich' : '🔒 Privat'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleDownload(selectedMedia.id)}
                className="btn btn-success"
                style={{ flex: 1 }}
              >
                ⬇️ Herunterladen
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedMedia.id);
                  setSelectedMedia(null);
                }}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                🗑️ Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
