import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Box,
  Paper,
  IconButton,
  Divider,
  Tooltip,
  ButtonGroup,
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  Code as CodeIcon,
  FormatQuote as QuoteIcon,
  HorizontalRule as HRIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Link as LinkIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ content, onChange, editable = true }) => {
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
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

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

  return (
    <Paper sx={{ border: 1, borderColor: 'divider' }}>
      {editable && (
        <>
          <Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: 1, borderColor: 'divider' }}>
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

            {/* Headings */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Überschrift 1">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  color={editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'}
                  sx={{ fontWeight: 'bold', fontSize: '16px' }}
                >
                  H1
                </IconButton>
              </Tooltip>
              <Tooltip title="Überschrift 2">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  color={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
                  sx={{ fontWeight: 'bold', fontSize: '14px' }}
                >
                  H2
                </IconButton>
              </Tooltip>
              <Tooltip title="Überschrift 3">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  color={editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'}
                  sx={{ fontWeight: 'bold', fontSize: '12px' }}
                >
                  H3
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Lists */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Aufzählung">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  color={editor.isActive('bulletList') ? 'primary' : 'default'}
                >
                  <BulletListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Nummerierung">
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

            {/* Blocks */}
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
              <Tooltip title="Code Block">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  color={editor.isActive('codeBlock') ? 'primary' : 'default'}
                >
                  <CodeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Trennlinie">
                <IconButton
                  size="small"
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                  <HRIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" flexItem />

            {/* Link & Table */}
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
                <IconButton
                  size="small"
                  onClick={addTable}
                >
                  <TableIcon fontSize="small" />
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
        </>
      )}
      <Box
        sx={{
          p: 2,
          minHeight: '400px',
          maxHeight: '600px',
          overflow: 'auto',
          '& .ProseMirror': {
            outline: 'none',
            '& > * + *': {
              marginTop: '0.75em',
            },
            '& h1': {
              fontSize: '2em',
              fontWeight: 'bold',
              marginTop: '0.67em',
              marginBottom: '0.67em',
            },
            '& h2': {
              fontSize: '1.5em',
              fontWeight: 'bold',
              marginTop: '0.83em',
              marginBottom: '0.83em',
            },
            '& h3': {
              fontSize: '1.17em',
              fontWeight: 'bold',
              marginTop: '1em',
              marginBottom: '1em',
            },
            '& ul, & ol': {
              paddingLeft: '2em',
            },
            '& code': {
              backgroundColor: '#f5f5f5',
              padding: '0.2em 0.4em',
              borderRadius: '3px',
              fontSize: '0.9em',
              fontFamily: 'monospace',
            },
            '& pre': {
              backgroundColor: '#f5f5f5',
              padding: '1em',
              borderRadius: '5px',
              overflow: 'auto',
              '& code': {
                backgroundColor: 'transparent',
                padding: 0,
              },
            },
            '& blockquote': {
              borderLeft: '3px solid #ccc',
              paddingLeft: '1em',
              marginLeft: 0,
              fontStyle: 'italic',
            },
            '& hr': {
              margin: '1em 0',
              border: 'none',
              borderTop: '2px solid #ccc',
            },
            '& a': {
              color: '#1976d2',
              textDecoration: 'underline',
              cursor: 'pointer',
            },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              margin: '1em 0',
              '& td, & th': {
                border: '1px solid #ddd',
                padding: '0.5em',
                textAlign: 'left',
              },
              '& th': {
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
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

export default TipTapEditor;
