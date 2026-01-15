import React, { useState, useEffect } from 'react';
import {
  Dialog,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface ImageViewerProps {
  open: boolean;
  onClose: () => void;
  images: Array<{
    url: string;
    filename: string;
    description?: string;
  }>;
  initialIndex?: number;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  open,
  onClose,
  images,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, open]);

  useEffect(() => {
    // Reset zoom and position when changing images
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        onClose();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        handleResetZoom();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, currentIndex, zoom]);

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          margin: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 2,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
          zIndex: 1,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ color: 'white' }}>
            {currentImage.filename}
          </Typography>
          {currentImage.description && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {currentImage.description}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Bild {currentIndex + 1} von {images.length}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Image Container */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={currentImage.url}
          alt={currentImage.filename}
          style={{
            maxWidth: zoom === 1 ? '90%' : 'none',
            maxHeight: zoom === 1 ? '90%' : 'none',
            width: zoom > 1 ? `${zoom * 100}%` : 'auto',
            height: zoom > 1 ? 'auto' : 'auto',
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* Left Navigation */}
      {currentIndex > 0 && (
        <IconButton
          onClick={handlePrevious}
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.7)',
            },
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 40 }} />
        </IconButton>
      )}

      {/* Right Navigation */}
      {currentIndex < images.length - 1 && (
        <IconButton
          onClick={handleNext}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.7)',
            },
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 40 }} />
        </IconButton>
      )}

      {/* Bottom Controls */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
          gap: 1,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}
      >
        <IconButton onClick={handleZoomOut} sx={{ color: 'white' }} disabled={zoom <= 0.25}>
          <ZoomOutIcon />
        </IconButton>
        <Typography sx={{ color: 'white', minWidth: '60px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </Typography>
        <IconButton onClick={handleZoomIn} sx={{ color: 'white' }} disabled={zoom >= 5}>
          <ZoomInIcon />
        </IconButton>
        <IconButton onClick={handleResetZoom} sx={{ color: 'white' }}>
          <RefreshIcon />
        </IconButton>
      </Box>
    </Dialog>
  );
};

export default ImageViewer;
