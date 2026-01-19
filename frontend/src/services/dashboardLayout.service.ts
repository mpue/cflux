import api from './api';
import { UserDashboardLayout } from '../components/DashboardWidgets/types';

export const dashboardLayoutService = {
  // Get current user's dashboard layout
  async getMyLayout(): Promise<UserDashboardLayout | null> {
    try {
      const response = await api.get('/dashboard-layout/my-layout');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No layout saved yet
      }
      throw error;
    }
  },

  // Save current user's dashboard layout
  async saveMyLayout(layout: UserDashboardLayout): Promise<void> {
    await api.put('/dashboard-layout/my-layout', layout);
  },

  // Reset current user's dashboard layout to default
  async resetMyLayout(): Promise<void> {
    await api.delete('/dashboard-layout/my-layout');
  },
};
