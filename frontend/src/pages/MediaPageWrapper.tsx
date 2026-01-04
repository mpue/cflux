import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Media, mediaService } from '../services/media.service';
import { MediaPage } from './MediaPage';
import AppNavbar from '../components/AppNavbar';

export const MediaPageWrapper: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMedia = async () => {
    try {
      const data = await mediaService.getAllMedia();
      setMedia(data);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <>
        <AppNavbar title="Medien" onLogout={handleLogout} />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Lade Medien...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNavbar title="Medien" onLogout={handleLogout} />
      <div style={{ padding: '20px' }}>
        <MediaPage
          media={media}
          isAdmin={user?.role === 'ADMIN'}
          onUpdate={loadMedia}
        />
      </div>
    </>
  );
};
