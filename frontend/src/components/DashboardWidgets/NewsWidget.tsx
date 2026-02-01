import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Button } from 'react-bootstrap';
import newsService, { NewsItem } from '../../services/news.service';
import '../../App.css';

interface NewsWidgetProps {
  widgetId?: string;
  onRemove?: () => void;
  limit?: number;
  showReadMore?: boolean;
}

const NewsWidget: React.FC<NewsWidgetProps> = ({ widgetId, onRemove, limit = 5, showReadMore = true }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNews();
  }, [limit]);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await newsService.getDashboardNews(limit);
      setNews(data);
    } catch (err: any) {
      console.error('Error loading news:', err);
      setError('Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (itemId: string) => {
    try {
      await newsService.markAsRead(itemId);
      setNews(news.map(item =>
        item.id === itemId ? { ...item, isRead: true } : item
      ));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getPriorityBadge = (priority: string) => {
    const variants: { [key: string]: string } = {
      LOW: 'secondary',
      NORMAL: 'info',
      HIGH: 'warning',
      URGENT: 'danger',
    };
    return variants[priority] || 'info';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      LOW: 'Niedrig',
      NORMAL: 'Normal',
      HIGH: 'Hoch',
      URGENT: 'Dringend',
    };
    return labels[priority] || priority;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Vor wenigen Minuten';
    } else if (diffHours < 24) {
      return `Vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
    } else if (diffDays === 1) {
      return 'Gestern';
    } else if (diffDays < 7) {
      return `Vor ${diffDays} Tagen`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  if (loading) {
    return (
      <Card className="news-widget">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-newspaper me-2"></i>
            Nachrichten
          </h5>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="news-widget">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-newspaper me-2"></i>
            Nachrichten
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="alert alert-danger mb-0">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (news.length === 0) {
    return (
      <Card className="news-widget">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-newspaper me-2"></i>
            Nachrichten
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center text-muted py-4">
            <i className="fas fa-inbox fa-3x mb-3"></i>
            <p className="mb-0">Keine Nachrichten verfügbar</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="news-widget">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fas fa-newspaper me-2"></i>
          Nachrichten
        </h5>
        <Button
          variant="link"
          size="sm"
          onClick={loadNews}
          title="Aktualisieren"
        >
          <i className="fas fa-sync-alt"></i>
        </Button>
      </Card.Header>
      <Card.Body style={{ padding: '16px' }}>
        <div className="news-list">
          {news.map((item) => (
            <div
              key={item.id}
              className={`news-item ${item.isRead ? 'read' : 'unread'} ${item.isPinned ? 'pinned' : ''}`}
              onClick={() => !item.isRead && handleMarkAsRead(item.id)}
            >
              {/* Header */}
              <div className="news-item-header">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {item.isPinned && (
                    <i className="fas fa-thumbtack text-primary" style={{ fontSize: '1rem' }} title="Angepinnt"></i>
                  )}
                  {item.source && item.source.icon && (
                    <i
                      className={`${item.source.icon}`}
                      style={{ color: item.source.color || '#007bff', fontSize: '1.1rem' }}
                    ></i>
                  )}
                  <span className="news-source-name" style={{ fontSize: '1rem' }}>{item.source?.name || 'Allgemein'}</span>
                  {item.priority !== 'NORMAL' && (
                    <Badge bg={getPriorityBadge(item.priority)} className="ms-auto" style={{ fontSize: '0.85rem' }}>
                      {getPriorityLabel(item.priority)}
                    </Badge>
                  )}
                  {!item.isRead && (
                    <Badge bg="primary" pill className="ms-1" style={{ fontSize: '0.85rem' }}>
                      Neu
                    </Badge>
                  )}
                </div>
                <small className="text-muted" style={{ fontSize: '0.9rem' }}>{formatDate(item.publishedAt)}</small>
              </div>

              {/* Title */}
              <h6 className="news-item-title mb-2" style={{ fontSize: '1.15rem', fontWeight: '600' }}>{item.title}</h6>

              {/* Image */}
              {item.imageUrl && (
                <div className="news-item-image mb-2">
                  <img src={item.imageUrl} alt={item.title} />
                </div>
              )}

              {/* Content */}
              <div className="news-item-content" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                {expandedItems.has(item.id) ? (
                  <div dangerouslySetInnerHTML={{ __html: item.content }} />
                ) : (
                  <p className="mb-0">{item.excerpt || item.content.substring(0, 150) + '...'}</p>
                )}
              </div>

              {/* Footer */}
              <div className="news-item-footer">
                {item.author && (
                  <small className="text-muted" style={{ fontSize: '0.9rem' }}>
                    <i className="fas fa-user me-1"></i>
                    {item.author}
                  </small>
                )}
                <div className="news-item-actions">
                  {showReadMore && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0"
                      style={{ fontSize: '0.95rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                      }}
                    >
                      {expandedItems.has(item.id) ? 'Weniger anzeigen' : 'Mehr lesen'}
                    </Button>
                  )}
                  {item.externalUrl && (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-link btn-sm p-0"
                      style={{ fontSize: '0.95rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="fas fa-external-link-alt me-1"></i>
                      Original
                    </a>
                  )}
                </div>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="news-item-tags mt-2">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} bg="light" text="dark" className="me-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default NewsWidget;
