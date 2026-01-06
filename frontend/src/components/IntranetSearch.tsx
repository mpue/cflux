import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  CircularProgress,
  Divider,
  Breadcrumbs,
  Link,
  ToggleButtonGroup,
  ToggleButton,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  NavigateNext as NavigateNextIcon,
  Article as ArticleIcon,
  Folder as FolderIcon,
  AttachFile as AttachFileIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import documentNodeSearchService, {
  SearchResult,
  SearchSuggestion,
} from '../services/documentNodeSearch.service';

interface IntranetSearchProps {
  onResultClick: (nodeId: string) => void;
}

const IntranetSearch: React.FC<IntranetSearchProps> = ({ onResultClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'node' | 'attachment' | 'version'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setSuggestions([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const type = searchType === 'all' ? undefined : searchType;
      const response = await documentNodeSearchService.search(searchQuery, 50, type);

      setResults(response.results);
      setTotalResults(response.total);
      setShowResults(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler bei der Suche');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSuggestions([]);
    setShowResults(false);
  };

  const handleTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'all' | 'node' | 'attachment' | 'version' | null
  ) => {
    if (newType !== null) {
      setSearchType(newType);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result.nodeId);
    setShowResults(false);
    setSearchQuery('');
  };

  const renderHighlightedText = (text: string) => {
    const html = documentNodeSearchService.highlightText(text);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <Box sx={{ mb: 3, position: 'relative' }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* Search Input */}
        <TextField
          fullWidth
          placeholder="Durchsuche Intranet, Dokumente, Anhänge..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {loading ? <CircularProgress size={20} /> : <SearchIcon />}
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& mark': {
              backgroundColor: '#ffeb3b',
              fontWeight: 'bold',
              padding: '0 2px',
            },
          }}
        />

        {/* Type Filter */}
        <ToggleButtonGroup
          value={searchType}
          exclusive
          onChange={handleTypeChange}
          size="small"
        >
          <ToggleButton value="all">
            Alle
          </ToggleButton>
          <ToggleButton value="node">
            Dokumente
          </ToggleButton>
          <ToggleButton value="attachment">
            Anhänge
          </ToggleButton>
          <ToggleButton value="version">
            Versionen
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Results */}
      <Collapse in={showResults && searchQuery.length >= 2}>
        <Paper
          sx={{
            mt: 1,
            maxHeight: '500px',
            overflow: 'auto',
            position: 'absolute',
            width: '100%',
            zIndex: 1000,
          }}
          elevation={3}
        >
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          {!error && results.length === 0 && !loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Keine Ergebnisse für "{searchQuery}"
              </Typography>
            </Box>
          )}

          {!error && results.length > 0 && (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {totalResults} Ergebnis{totalResults !== 1 ? 'se' : ''} gefunden
                </Typography>
              </Box>

              <List>
                {results.map((result, index) => (
                  <React.Fragment key={`${result.type}-${result.id}`}>
                    {index > 0 && <Divider />}
                    <ListItem
                      button
                      onClick={() => handleResultClick(result)}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      {/* Title and Icon */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="h6" component="span">
                          {documentNodeSearchService.getResultIcon(result)}
                        </Typography>
                        <Typography variant="body1" sx={{ flexGrow: 1 }}>
                          {renderHighlightedText(result.title)}
                        </Typography>
                        <Chip
                          label={documentNodeSearchService.getTypeLabel(result)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {/* Breadcrumb Path */}
                      {result.path.length > 0 && (
                        <Breadcrumbs
                          separator={<NavigateNextIcon fontSize="small" />}
                          sx={{ mt: 0.5, fontSize: '0.875rem' }}
                        >
                          {result.path.map((pathItem, idx) => (
                            <Typography
                              key={idx}
                              variant="caption"
                              color="text.secondary"
                            >
                              {pathItem}
                            </Typography>
                          ))}
                        </Breadcrumbs>
                      )}

                      {/* Snippet */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 1,
                          '& mark': {
                            backgroundColor: '#ffeb3b',
                            fontWeight: 'bold',
                            padding: '0 2px',
                          },
                        }}
                      >
                        {renderHighlightedText(result.snippet)}
                      </Typography>

                      {/* Metadata */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {result.metadata.createdBy.firstName}{' '}
                          {result.metadata.createdBy.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(result.metadata.createdAt).toLocaleDateString('de-CH')}
                        </Typography>
                        {result.metadata.fileSize && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {documentNodeSearchService.formatFileSize(result.metadata.fileSize)}
                            </Typography>
                          </>
                        )}
                        {result.metadata.version && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Version {result.metadata.version}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

export default IntranetSearch;
