import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useModules } from '../../contexts/ModuleContext';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CreateNewFolder as FolderIcon,
  Description as DocumentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  FolderOpen as FolderOpenIcon,
  Folder as FolderClosedIcon,
  NavigateNext as NavigateNextIcon,
  Upload as UploadIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import AppNavbar from '../../components/AppNavbar';
import documentNodeService, { DocumentNode, CreateDocumentNodeData } from '../../services/documentNode.service';
import DocumentEditor from './DocumentEditor';
import DocumentVersionHistory from './DocumentVersionHistory';
import GroupPermissionsDialog from './GroupPermissionsDialog';
import DocumentNodeAttachments from '../../components/DocumentNodeAttachments';
import IntranetSearch from '../../components/IntranetSearch';
import DocumentApprovalPanel from '../../components/intranet/DocumentApprovalPanel';
import DraggableTreeNode from '../../components/DraggableTreeNode';

interface IntranetPageProps {
  embedded?: boolean;
}

const IntranetPage: React.FC<IntranetPageProps> = ({ embedded = false }) => {
  const { user, logout } = useAuth();
  const { canEdit } = useModules();
  const navigate = useNavigate();
  const [tree, setTree] = useState<DocumentNode[]>([]);
  const [currentNode, setCurrentNode] = useState<DocumentNode | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<DocumentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('de-DE'));
  
  // Track expanded/collapsed folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Aktiver Bereich des Inhaltsbereichs
  const [contentTab, setContentTab] = useState<'content' | 'approval' | 'attachments'>('content');
  const [attachmentCount, setAttachmentCount] = useState<number | null>(null);

  // Splitter state
  const [leftWidth, setLeftWidth] = useState(300);
  const [isDragging, setIsDragging] = useState(false);

  // Check if user can edit
  const isAdmin = user?.role === 'ADMIN';
  const canEditIntranet = isAdmin || canEdit('INTRANET');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'FOLDER' | 'DOCUMENT'>('FOLDER');
  const [createTitle, setCreateTitle] = useState('');
  const [createParentId, setCreateParentId] = useState<string | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNode, setEditNode] = useState<DocumentNode | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteNode, setDeleteNode] = useState<DocumentNode | null>(null);

  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionHistoryNode, setVersionHistoryNode] = useState<DocumentNode | null>(null);

  const [groupPermissionsOpen, setGroupPermissionsOpen] = useState(false);
  const [groupPermissionsNode, setGroupPermissionsNode] = useState<DocumentNode | null>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importParentId, setImportParentId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuNode, setMenuNode] = useState<DocumentNode | null>(null);

  // Drag and Drop states
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<DocumentNode | null>(null);

  // Configure sensors for drag and drop (require minimum distance to avoid conflicts with clicks)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum 8px movement to start dragging
      },
    })
  );

  // Load document tree
  const loadTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentNodeService.getTree();
      setTree(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden des Intranet');
      console.error('Load tree error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load breadcrumb for current node
  const loadBreadcrumb = useCallback(async (nodeId: string) => {
    try {
      const data = await documentNodeService.getBreadcrumb(nodeId);
      setBreadcrumb(data);
    } catch (err: any) {
      console.error('Load breadcrumb error:', err);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Handle URL parameter to open specific document
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const nodeId = urlParams.get('node');
    
    if (nodeId && tree.length > 0) {
      // Find and open the node
      const findAndOpenNode = async () => {
        try {
          const node = await documentNodeService.getById(nodeId);
          if (node) {
            setCurrentNode(node);
            // Expand all parent folders
            if (node.parentId) {
              const breadcrumb = await documentNodeService.getBreadcrumb(nodeId);
              const parentIds = breadcrumb.slice(0, -1).map(n => n.id);
              setExpandedFolders(prev => new Set([...prev, ...parentIds]));
            }
          }
        } catch (err) {
          console.error('Failed to load node from URL:', err);
        }
      };
      findAndOpenNode();
    }
  }, [tree]);

  useEffect(() => {
    if (currentNode) {
      loadBreadcrumb(currentNode.id);
    } else {
      setBreadcrumb([]);
    }
  }, [currentNode, loadBreadcrumb]);

  // Beim Wechsel des Knotens wieder mit dem Inhalt starten
  useEffect(() => {
    setContentTab('content');
    setAttachmentCount(null);
  }, [currentNode?.id]);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('de-DE'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Splitter drag handlers
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newWidth = e.clientX - 24; // Account for padding
        if (newWidth >= 200 && newWidth <= 600) {
          setLeftWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle node click
  const handleNodeClick = async (node: DocumentNode) => {
    try {
      // Always fetch the full node data from the server to ensure we have the latest content
      const fullNode = await documentNodeService.getById(node.id);
      setCurrentNode(fullNode);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden des Dokuments');
      console.error('Load node error:', err);
    }
  };

  // Handle create dialog
  const handleOpenCreateDialog = (type: 'FOLDER' | 'DOCUMENT', parentId: string | null = null) => {
    setCreateType(type);
    setCreateParentId(parentId);
    setCreateTitle('');
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!createTitle.trim()) {
      return;
    }

    try {
      const data: CreateDocumentNodeData = {
        title: createTitle.trim(),
        type: createType,
        parentId: createParentId || undefined,
      };

      await documentNodeService.create(data);
      setCreateDialogOpen(false);
      setCreateTitle('');
      await loadTree();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Erstellen');
      console.error('Create error:', err);
    }
  };

  // Handle edit dialog
  const handleOpenEditDialog = (node: DocumentNode) => {
    setEditNode(node);
    setEditTitle(node.title);
    setEditDialogOpen(true);
    handleCloseMenu();
  };

  const handleEdit = async () => {
    if (!editNode || !editTitle.trim()) {
      return;
    }

    try {
      await documentNodeService.update(editNode.id, { title: editTitle.trim() });
      setEditDialogOpen(false);
      setEditNode(null);
      setEditTitle('');
      await loadTree();

      // Refresh current node if it's the one being edited
      if (currentNode?.id === editNode.id) {
        const updated = await documentNodeService.getById(editNode.id);
        setCurrentNode(updated);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Bearbeiten');
      console.error('Edit error:', err);
    }
  };

  // Handle delete dialog
  const handleOpenDeleteDialog = (node: DocumentNode) => {
    setDeleteNode(node);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleDelete = async () => {
    if (!deleteNode) {
      return;
    }

    try {
      await documentNodeService.delete(deleteNode.id);
      setDeleteDialogOpen(false);
      setDeleteNode(null);
      await loadTree();

      // Clear current node if it's the one being deleted
      if (currentNode?.id === deleteNode.id) {
        setCurrentNode(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Löschen');
      console.error('Delete error:', err);
    }
  };

  // Handle version history
  const handleOpenVersionHistory = (node: DocumentNode) => {
    setVersionHistoryNode(node);
    setVersionHistoryOpen(true);
    handleCloseMenu();
  };

  // Handle group permissions
  const handleOpenGroupPermissions = (node: DocumentNode) => {
    setGroupPermissionsNode(node);
    setGroupPermissionsOpen(true);
    handleCloseMenu();
  };

  // Handle import
  const handleOpenImportDialog = (parentId: string | null = null) => {
    setImportParentId(parentId);
    setSelectedFile(null);
    setImportDialogOpen(true);
    handleCloseMenu();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      await documentNodeService.importZip(selectedFile, importParentId || undefined);
      await loadTree();
      setImportDialogOpen(false);
      setSelectedFile(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Importieren der Zip-Datei');
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  // Handle menu
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, node: DocumentNode) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuNode(node);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuNode(null);
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Helper function to find a node in the tree by ID
  const findNodeById = (nodes: DocumentNode[], id: string): DocumentNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const node = findNodeById(tree, active.id as string);
    setDraggedNode(node);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);
    setDraggedNode(null);

    if (!over || active.id === over.id) {
      return;
    }

    const draggedNodeId = active.id as string;
    const targetNodeId = over.id as string;

    const draggedNode = findNodeById(tree, draggedNodeId);
    const targetNode = findNodeById(tree, targetNodeId);

    if (!draggedNode || !targetNode) {
      return;
    }

    // Prevent dropping a folder into itself or its children
    if (draggedNode.type === 'FOLDER') {
      let checkNode: DocumentNode | null = targetNode;
      while (checkNode) {
        if (checkNode.id === draggedNodeId) {
          setError('Ordner kann nicht in sich selbst oder seine Unterordner verschoben werden');
          return;
        }
        checkNode = checkNode.parentId ? findNodeById(tree, checkNode.parentId) : null;
      }
    }

    try {
      // Determine new parent: if target is a folder, move into it; otherwise, move to target's parent
      let newParentId: string | null | undefined;
      
      if (targetNode.type === 'FOLDER') {
        // Drop INTO the folder
        newParentId = targetNodeId;
      } else {
        // Drop next to the document (same parent as target)
        newParentId = targetNode.parentId;
      }

      // Call API to move the node
      await documentNodeService.move(draggedNodeId, {
        newParentId: newParentId === null ? undefined : newParentId,
      });

      // Reload tree to reflect changes
      await loadTree();

      // If the moved node was expanded, keep it expanded
      if (expandedFolders.has(draggedNodeId)) {
        setExpandedFolders((prev) => new Set([...prev, draggedNodeId]));
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Verschieben des Elements');
      console.error('Move error:', err);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setDraggedNode(null);
  };

  // Handle native file drop onto a tree node
  const handleFileDrop = async (file: File, targetNode: DocumentNode) => {
    try {
      setError(null);
      // Determine parent: if target is a folder, drop into it; otherwise use target's parent
      const parentId = targetNode.type === 'FOLDER' ? targetNode.id : (targetNode.parentId || undefined);
      await documentNodeService.dropFile(file, parentId);
      await loadTree();
      // Expand the target folder so the new node is visible
      if (targetNode.type === 'FOLDER') {
        setExpandedFolders((prev) => new Set([...prev, targetNode.id]));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Importieren der Datei');
      console.error('File drop error:', err);
    }
  };

  // Render tree recursively
  const renderTree = (nodes: DocumentNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => {
      const isFolder = node.type === 'FOLDER';
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = currentNode?.id === node.id;
      const isDraggedOver = overId === node.id;

      return (
        <React.Fragment key={node.id}>
          <DraggableTreeNode
            node={node}
            level={level}
            isExpanded={isExpanded}
            isSelected={isSelected}
            isDraggedOver={isDraggedOver}
            onToggleFolder={(e) => toggleFolder(node.id, e)}
            onNodeClick={() => handleNodeClick(node)}
            onMenuClick={(e) => handleOpenMenu(e, node)}
            onFileDrop={handleFileDrop}
            canEdit={canEditIntranet}
          />
          
          {/* Children (only show if folder is expanded) */}
          {isFolder && hasChildren && isExpanded && node.children && renderTree(node.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  // Handle document save
  const handleDocumentSave = async (content: string) => {
    if (!currentNode) return;

    try {
      await documentNodeService.update(currentNode.id, { content });
      // Refresh current node
      const updated = await documentNodeService.getById(currentNode.id);
      setCurrentNode(updated);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Speichern');
      console.error('Save error:', err);
    }
  };

  if (loading) {
    return (
      <>
        {!embedded && (
          <AppNavbar
            title="Dokumente"
            currentTime={currentTime}
            onLogout={handleLogout}
          />
        )}
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      {!embedded && (
        <AppNavbar
          title="Dokumente"
          currentTime={currentTime}
          onLogout={handleLogout}
        />
      )}
      <Box sx={{ p: embedded ? 0 : 2, pb: 0, height: embedded ? '100%' : 'calc(100vh - 64px)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Modern Toolbar */}
        <Paper
          elevation={0}
          sx={{
            mb: 1,
            p: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
            flexWrap: 'wrap',
            borderRadius: 2,
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider'
          }}
        >
          {/* Der Pfad steht in der Toolbar statt ueber dem Dokument - das
              spart im Inhaltsbereich eine komplette Zeile. */}
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            maxItems={4}
            sx={{
              minWidth: 0,
              flexGrow: 1,
              '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' },
              '& .MuiBreadcrumbs-li': { minWidth: 0 },
            }}
          >
            <Link
              component="button"
              variant="body2"
              onClick={() => setCurrentNode(null)}
              sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Dokumente
            </Link>
            {breadcrumb.map((item, index) =>
              index === breadcrumb.length - 1 ? (
                <Typography key={item.id} variant="body2" color="text.primary" noWrap sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
              ) : (
                <Link
                  key={item.id}
                  component="button"
                  variant="body2"
                  onClick={() => handleNodeClick(item)}
                  sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {item.title}
                </Link>
              )
            )}
          </Breadcrumbs>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
            {/* Suche - kompakt, oben rechts */}
            <IntranetSearch
              compact
              onResultClick={(nodeId) => {
                documentNodeService.getById(nodeId).then((node) => {
                  handleNodeClick(node);
                }).catch(() => {
                  setError('Fehler beim Laden des Dokuments');
                });
              }}
            />
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            {canEditIntranet && (
              <>
                <Tooltip title="ZIP-Datei importieren">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenImportDialog(currentNode?.type === 'FOLDER' ? currentNode.id : null)}
                    size="small"
                  >
                    <UploadIcon />
                  </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              </>
            )}
            <Tooltip title="Neuer Ordner">
              <Button
                variant="outlined"
                startIcon={<FolderIcon />}
                onClick={() => handleOpenCreateDialog('FOLDER', currentNode?.type === 'FOLDER' ? currentNode.id : null)}
                size="small"
                sx={{ minWidth: 'auto' }}
              >
                Ordner
              </Button>
            </Tooltip>
            <Tooltip title="Neues Dokument">
              <Button
                variant="contained"
                startIcon={<DocumentIcon />}
                onClick={() => handleOpenCreateDialog('DOCUMENT', currentNode?.type === 'FOLDER' ? currentNode.id : null)}
                size="small"
                disableElevation
              >
                Dokument
              </Button>
            </Tooltip>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 0, flexGrow: 1, position: 'relative', minHeight: 0 }}>
          {/* Tree Navigation with Drag and Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <Paper
              sx={{ width: `${leftWidth}px`, p: 1, overflow: 'auto', flexShrink: 0 }}
              onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); }}
              onDrop={(e) => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); }}
            >
              {canEditIntranet && tree.length > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', px: 1, pb: 0.5, fontSize: '0.7rem' }}
                >
                  Drag &amp; Drop zum Verschieben
                </Typography>
              )}
              {tree.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                  Noch keine Dokumente vorhanden
                </Typography>
              ) : (
                renderTree(tree)
              )}
            </Paper>

            {/* Drag Overlay - shows a preview while dragging */}
            <DragOverlay dropAnimation={null}>
              {activeId && draggedNode ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    boxShadow: 3,
                    cursor: 'grabbing',
                    minWidth: 200,
                  }}
                >
                  {draggedNode.type === 'FOLDER' ? (
                    <FolderClosedIcon sx={{ mr: 1, color: 'warning.main' }} />
                  ) : (
                    <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  )}
                  <Typography>{draggedNode.title}</Typography>
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Resizable Splitter */}
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              width: '6px',
              cursor: 'col-resize',
              bgcolor: isDragging ? 'primary.main' : 'divider',
              transition: isDragging ? 'none' : 'background-color 0.2s',
              flexShrink: 0,
              '&:hover': {
                bgcolor: 'primary.light',
              },
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '2px',
                height: '40px',
                bgcolor: 'background.paper',
                borderRadius: '1px',
              },
            }}
          />

          {/* Content Area - Tabs statt gestapelter Aufklapp-Bereiche, damit der
              aktive Bereich die volle Hoehe bekommt statt einer 300px-Box. */}
          <Paper sx={{ flexGrow: 1, overflow: 'hidden', ml: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {currentNode ? (
              <>
                <Tabs
                  value={contentTab}
                  onChange={(_e, value) => setContentTab(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ minHeight: 40, flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab
                    value="content"
                    sx={{ minHeight: 40 }}
                    label={currentNode.type === 'DOCUMENT' ? 'Inhalt' : 'Ordnerinhalt'}
                  />
                  {currentNode.type === 'DOCUMENT' && (
                    <Tab value="approval" sx={{ minHeight: 40 }} label="Freigabe" />
                  )}
                  <Tab
                    value="attachments"
                    sx={{ minHeight: 40 }}
                    label={attachmentCount === null ? 'Anhänge' : `Anhänge (${attachmentCount})`}
                  />
                </Tabs>

                <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: 2 }}>
                  {contentTab === 'content' && currentNode.type === 'DOCUMENT' && (
                    <DocumentEditor
                      key={currentNode.id}
                      document={currentNode}
                      onSave={handleDocumentSave}
                      canEdit={canEditIntranet}
                    />
                  )}

                  {contentTab === 'content' && currentNode.type === 'FOLDER' && (
                    <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
                      {currentNode.children && currentNode.children.length > 0 ? (
                        <List dense disablePadding>
                          {currentNode.children.map((child) => (
                            <ListItemButton key={child.id} onClick={() => handleNodeClick(child)}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {child.type === 'FOLDER' ? (
                                  <FolderClosedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                                ) : (
                                  <DocumentIcon fontSize="small" sx={{ color: 'primary.main' }} />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={child.title}
                                secondary={child.type === 'FOLDER' ? 'Ordner' : 'Dokument'}
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Dieser Ordner ist leer.
                        </Typography>
                      )}
                    </Box>
                  )}

                  {contentTab === 'approval' && currentNode.type === 'DOCUMENT' && (
                    <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
                      <DocumentApprovalPanel
                        documentId={currentNode.id}
                        currentStatus={currentNode.approvalStatus || 'DRAFT'}
                        submittedAt={currentNode.submittedForApprovalAt}
                        approvedAt={currentNode.approvedAt}
                        approvedBy={currentNode.approvedBy}
                        rejectedAt={currentNode.rejectedAt}
                        rejectedBy={currentNode.rejectedBy}
                        rejectionReason={currentNode.rejectionReason}
                        publishedAt={currentNode.publishedAt}
                        onStatusChange={async () => {
                          // Reload the document to get updated status
                          const updated = await documentNodeService.getById(currentNode.id);
                          setCurrentNode(updated);
                        }}
                        canSubmit={canEditIntranet}
                        canApprove={currentNode.userPermissions?.canAdmin || isAdmin}
                        canPublish={currentNode.userPermissions?.canAdmin || isAdmin}
                      />
                    </Box>
                  )}

                  {/* Bleibt gemountet, damit die Anzahl im Tab-Label auch dann
                      stimmt, wenn der Tab noch nicht geoeffnet wurde. */}
                  <Box
                    sx={{
                      flexGrow: 1,
                      minHeight: 0,
                      overflow: 'auto',
                      display: contentTab === 'attachments' ? 'block' : 'none',
                    }}
                  >
                    <DocumentNodeAttachments
                      key={currentNode.id}
                      nodeId={currentNode.id}
                      canEdit={canEditIntranet}
                      onCountChange={setAttachmentCount}
                    />
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <FolderOpenIcon sx={{ fontSize: 100, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Wählen Sie ein Dokument aus der Navigation
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {createType === 'FOLDER' ? 'Neuer Ordner' : 'Neues Dokument'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Titel"
              fullWidth
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!createTitle.trim()}>
              Erstellen
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Umbenennen</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Titel"
              fullWidth
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEdit();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleEdit} variant="contained" disabled={!editTitle.trim()}>
              Speichern
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Löschen bestätigen</DialogTitle>
          <DialogContent>
            <Typography>
              Möchten Sie "{deleteNode?.title}" wirklich löschen?
              {deleteNode?.type === 'FOLDER' && ' Alle Unterelemente werden ebenfalls gelöscht.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Löschen
            </Button>
          </DialogActions>
        </Dialog>

        {/* Import ZIP Dialog */}
        <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>ZIP-Datei importieren</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Die ZIP-Datei kann eine komplette Ordnerstruktur mit Markdown-Dokumenten enthalten.
                Dateinamen mit Unterstrichen (z.B. BLAH_BLUB.md) werden zu "Blah Blub" formatiert.
              </Alert>

              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<UploadIcon />}
                disabled={importing}
              >
                {selectedFile ? selectedFile.name : 'ZIP-Datei auswählen'}
                <input
                  type="file"
                  hidden
                  accept=".zip,application/zip"
                  onChange={handleFileSelect}
                />
              </Button>

              {selectedFile && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Größe: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportDialogOpen(false)} disabled={importing}>
              Abbrechen
            </Button>
            <Button
              onClick={handleImport}
              variant="contained"
              disabled={!selectedFile || importing}
              startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {importing ? 'Importiere...' : 'Importieren'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Version History Dialog */}
        {versionHistoryNode && (
          <DocumentVersionHistory
            open={versionHistoryOpen}
            onClose={() => {
              setVersionHistoryOpen(false);
              setVersionHistoryNode(null);
            }}
            documentNode={versionHistoryNode}
            onRestore={async () => {
              await loadTree();
              if (currentNode?.id === versionHistoryNode.id) {
                const updated = await documentNodeService.getById(versionHistoryNode.id);
                setCurrentNode(updated);
              }
            }}
          />
        )}

        {/* Group Permissions Dialog */}
        {groupPermissionsNode && (
          <GroupPermissionsDialog
            open={groupPermissionsOpen}
            onClose={() => {
              setGroupPermissionsOpen(false);
              setGroupPermissionsNode(null);
            }}
            nodeId={groupPermissionsNode.id}
            nodeTitle={groupPermissionsNode.title}
            onSaved={() => {
              // Optionally refresh something
            }}
          />
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={() => menuNode && handleOpenEditDialog(menuNode)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Umbenennen
          </MenuItem>
          {menuNode?.type === 'FOLDER' && canEditIntranet && (
            <MenuItem onClick={() => menuNode && handleOpenImportDialog(menuNode.id)}>
              <UploadIcon fontSize="small" sx={{ mr: 1 }} />
              ZIP importieren
            </MenuItem>
          )}
          {menuNode?.type === 'DOCUMENT' && (
            <MenuItem onClick={() => menuNode && handleOpenVersionHistory(menuNode)}>
              <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
              Versionshistorie
            </MenuItem>
          )}
          {canEditIntranet && (
            <MenuItem onClick={() => menuNode && handleOpenGroupPermissions(menuNode)}>
              <GroupIcon fontSize="small" sx={{ mr: 1 }} />
              Gruppen
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={() => menuNode && handleOpenDeleteDialog(menuNode)} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Löschen
          </MenuItem>
        </Menu>
      </Box>
    </>
  );
};

export default IntranetPage;
