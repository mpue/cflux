import api from './api';
import { ArticleGroup } from '../types';

export const getAllArticleGroups = async (isActive?: boolean): Promise<ArticleGroup[]> => {
  const params = new URLSearchParams();
  if (isActive !== undefined) params.append('isActive', isActive.toString());
  
  const response = await api.get(`/article-groups?${params.toString()}`);
  return response.data;
};

export const getArticleGroupById = async (id: string): Promise<ArticleGroup> => {
  const response = await api.get(`/article-groups/${id}`);
  return response.data;
};

export const createArticleGroup = async (data: Partial<ArticleGroup>): Promise<ArticleGroup> => {
  const response = await api.post('/article-groups', data);
  return response.data;
};

export const updateArticleGroup = async (id: string, data: Partial<ArticleGroup>): Promise<ArticleGroup> => {
  const response = await api.put(`/article-groups/${id}`, data);
  return response.data;
};

export const deleteArticleGroup = async (id: string): Promise<void> => {
  await api.delete(`/article-groups/${id}`);
};
