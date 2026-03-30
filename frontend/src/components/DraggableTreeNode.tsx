import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Box, IconButton, Typography } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  FolderOpen as FolderOpenIcon,
  Folder as FolderClosedIcon,
  Description as DocumentIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { DocumentNode } from '../services/documentNode.service';

interface DraggableTreeNodeProps {
  node: DocumentNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  isDraggedOver: boolean;
  onToggleFolder: (e: React.MouseEvent) => void;
  onNodeClick: () => void;
  onMenuClick: (e: React.MouseEvent<HTMLElement>) => void;
  onFileDrop?: (file: File, targetNode: DocumentNode) => void;
  canEdit: boolean;
}

const DraggableTreeNode: React.FC<DraggableTreeNodeProps> = ({
  node,
  level,
  isExpanded,
  isSelected,
  isDraggedOver,
  onToggleFolder,
  onNodeClick,
  onMenuClick,
  onFileDrop,
  canEdit,
}) => {
  const isFolder = node.type === 'FOLDER';
  const hasChildren = node.children && node.children.length > 0;
  const [fileHover, setFileHover] = useState(false);

  // Setup draggable
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: node.id,
    data: { node },
    disabled: !canEdit,
  });

  // Setup droppable (only folders can be drop targets)
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: { node },
    disabled: !canEdit || (!isFolder && !node.parentId), // Documents can't be drop targets, but can be indicators for "drop next to"
  });

  // Combine refs
  const setRefs = (element: HTMLDivElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };

  // Native file drop handlers (for OS file drag & drop)
  const handleNativeDragOver = (e: React.DragEvent) => {
    if (!canEdit || !onFileDrop) return;
    // Only react to files from the OS (not internal dnd-kit drags)
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setFileHover(true);
    }
  };

  const handleNativeDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setFileHover(false);
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    if (!canEdit || !onFileDrop) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setFileHover(false);
      const file = e.dataTransfer.files[0];
      onFileDrop(file, node);
    }
  };

  return (
    <Box
      ref={setRefs}
      sx={{
        ml: level * 2,
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          cursor: canEdit ? 'grab' : 'pointer',
          borderRadius: 1,
          '&:hover': {
            bgcolor: 'action.hover',
          },
          bgcolor: isSelected
            ? 'action.selected'
            : fileHover
            ? 'success.light'
            : isOver || isDraggedOver
            ? 'primary.light'
            : 'transparent',
          border: fileHover ? '2px dashed' : isOver || isDraggedOver ? '2px dashed' : '2px solid transparent',
          borderColor: fileHover ? 'success.main' : isOver || isDraggedOver ? 'primary.main' : 'transparent',
          transition: 'all 0.2s',
          position: 'relative',
        }}
        {...(canEdit ? listeners : {})}
        {...(canEdit ? attributes : {})}
      >
        {/* Expand/Collapse Icon for folders with children */}
        {isFolder && hasChildren ? (
          <IconButton
            size="small"
            onClick={onToggleFolder}
            sx={{ mr: 0.5, padding: 0.5, cursor: 'pointer' }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking expand
          >
            {isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </IconButton>
        ) : (
          <Box sx={{ width: 28, mr: 0.5 }} /> // Spacer for alignment
        )}

        {/* Folder or Document Icon */}
        <Box
          onClick={onNodeClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            cursor: 'pointer',
          }}
          onPointerDown={(e) => canEdit && e.stopPropagation()} // Allow click without triggering drag
        >
          {isFolder ? (
            isExpanded ? (
              <FolderOpenIcon sx={{ mr: 1, color: 'warning.main' }} />
            ) : (
              <FolderClosedIcon sx={{ mr: 1, color: 'warning.main' }} />
            )
          ) : (
            <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
          )}
          <Typography sx={{ flexGrow: 1, userSelect: 'none' }}>{node.title}</Typography>
        </Box>

        {/* Menu Icon */}
        <IconButton
          size="small"
          onClick={onMenuClick}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking menu
          sx={{ cursor: 'pointer' }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default DraggableTreeNode;
