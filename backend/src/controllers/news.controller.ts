import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import newsService from '../services/news.service';

class NewsController {
  // ===== NEWS SOURCES =====
  
  async getAllSources(req: AuthRequest, res: Response) {
    try {
      const sources = await newsService.getAllSources(req.user!.id);
      res.json(sources);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSourceById(req: AuthRequest, res: Response) {
    try {
      const source = await newsService.getSourceById(req.params.id);
      if (!source) {
        return res.status(404).json({ error: 'News source not found' });
      }
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createSource(req: AuthRequest, res: Response) {
    try {
      const source = await newsService.createSource({
        ...req.body,
        createdById: req.user!.id,
      });
      res.status(201).json(source);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateSource(req: AuthRequest, res: Response) {
    try {
      const source = await newsService.updateSource(req.params.id, req.body);
      res.json(source);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteSource(req: AuthRequest, res: Response) {
    try {
      await newsService.deleteSource(req.params.id);
      res.json({ message: 'News source deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async toggleSourceVisibility(req: AuthRequest, res: Response) {
    try {
      const source = await newsService.toggleSourceVisibility(req.params.id);
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ===== NEWS ITEMS =====

  async getDashboardNews(req: AuthRequest, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const news = await newsService.getDashboardNews(req.user!.id, limit);
      res.json(news);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getItemsBySource(req: AuthRequest, res: Response) {
    try {
      const items = await newsService.getItemsBySource(req.params.sourceId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getItemById(req: AuthRequest, res: Response) {
    try {
      const item = await newsService.getItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'News item not found' });
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createItem(req: AuthRequest, res: Response) {
    try {
      const item = await newsService.createItem({
        ...req.body,
        createdById: req.user!.id,
      });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateItem(req: AuthRequest, res: Response) {
    try {
      const item = await newsService.updateItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteItem(req: AuthRequest, res: Response) {
    try {
      await newsService.deleteItem(req.params.id);
      res.json({ message: 'News item deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      await newsService.markAsRead(req.params.id, req.user!.id);
      res.json({ message: 'News item marked as read' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async togglePin(req: AuthRequest, res: Response) {
    try {
      const item = await newsService.togglePin(req.params.id);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ===== RSS FEED REFRESH =====

  async refreshRssFeeds(req: AuthRequest, res: Response) {
    try {
      const sourceId = req.query.sourceId as string | undefined;
      const result = await newsService.refreshRssFeeds(sourceId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new NewsController();
