import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import {
  Box,
  Paper,
  IconButton,
  Divider,
  Tooltip,
  ButtonGroup,
  CircularProgress,
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  Code as CodeIcon,
  FormatQuote as QuoteIcon,
  HorizontalRule as HRIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Link as LinkIcon,
  TableChart as TableIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import api, { getBackendURL } from '../../services/api';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, editable = true }) => {
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('URL eingeben:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Das Bild darf maximal 10MB groß sein');
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/elearning/upload/content-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.url;
      const fullImageUrl = `${getBackendURL()}${imageUrl}`;

      // Insert image into editor
      editor.chain().focus().setImage({ src: fullImageUrl }).run();
    } catch (err: any) {
      console.error('Error uploading image:', err);
      alert(err.response?.data?.error || 'Fehler beim Hochladen des Bildes');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addImageFromUrl = () => {
    const url = window.prompt('Bild-URL eingeben:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <Paper sx={{ border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {editable && (
        <>
          <Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
            {/* Text Formatting */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Fett">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  color={editor.isActive('bold') ? 'primary' : 'default'}
                >
                  <BoldIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Kursiv">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  color={editor.isActive('italic') ? 'primary' : 'default'}
                >
                  <ItalicIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Code">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  color={editor.isActive('code') ? 'primary' : 'default'}
                >
                  <CodeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Lists */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Aufzählungsliste">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  color={editor.isActive('bulletList') ? 'primary' : 'default'}
                >
                  <BulletListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Nummerierte Liste">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  color={editor.isActive('orderedList') ? 'primary' : 'default'}
                >
                  <NumberListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Special Elements */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Zitat">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  color={editor.isActive('blockquote') ? 'primary' : 'default'}
                >
                  <QuoteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Horizontale Linie">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                  <HRIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Link and Table */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Link einfügen">
                <IconButton
                  size="small"
                  onClick={addLink}
                  color={editor.isActive('link') ? 'primary' : 'default'}
                >
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Tabelle einfügen">
                <IconButton size="small" onClick={addTable}>
                  <TableIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Image Upload */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Bild hochladen">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  color={uploadingImage ? 'primary' : 'default'}
                >
                  {uploadingImage ? <CircularProgress size={16} /> : <ImageIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Undo/Redo */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Rückgängig">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Wiederholen">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                >
                  <RedoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          </Box>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </>
      )}

      {/* Editor Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          minHeight: 200,
          '& .ProseMirror': {
            padding: 2,
            outline: 'none',
            minHeight: '100%',
            '& > * + *': {
              marginTop: 2,
            },
            '& p': {
              marginBottom: 1,
            },
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 1,
              cursor: 'pointer',
            },
            '& table': {
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              width: '100%',
              margin: 0,
              overflow: 'hidden',
              '& td, & th': {
                minWidth: '1em',
                border: '2px solid #ced4da',
                padding: '3px 5px',
                verticalAlign: 'top',
                boxSizing: 'border-box',
                position: 'relative',
                '& > *': {
                  marginBottom: 0,
                },
              },
              '& th': {
                fontWeight: 'bold',
                textAlign: 'left',
                backgroundColor: '#f1f3f5',
              },
            },
            '& blockquote': {
              paddingLeft: 1.5,
              borderLeft: '3px solid',
              borderColor: 'divider',
            },
            '& code': {
              backgroundColor: 'grey.100',
              borderRadius: 0.5,
              padding: '0.2em 0.4em',
              fontSize: '0.9em',
            },
            '& pre': {
              backgroundColor: 'grey.100',
              borderRadius: 1,
              padding: 2,
              overflow: 'auto',
              '& code': {
                backgroundColor: 'transparent',
                padding: 0,
              },
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
};

export default RichTextEditor;
