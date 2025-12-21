import api from './api';
import { Article } from '../types';

export const getAllArticles = async (search?: string, isActive?: boolean, articleGroupId?: string): Promise<Article[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (isActive !== undefined) params.append('isActive', isActive.toString());
  if (articleGroupId) params.append('articleGroupId', articleGroupId);
  
  const response = await api.get(`/articles?${params.toString()}`);
  return response.data;
};

export const getArticleById = async (id: string): Promise<Article> => {
  const response = await api.get(`/articles/${id}`);
  return response.data;
};

export const createArticle = async (data: Partial<Article>): Promise<Article> => {
  const response = await api.post('/articles', data);
  return response.data;
};

export const updateArticle = async (id: string, data: Partial<Article>): Promise<Article> => {
  const response = await api.put(`/articles/${id}`, data);
  return response.data;
};

export const deleteArticle = async (id: string): Promise<void> => {
  await api.delete(`/articles/${id}`);
};
