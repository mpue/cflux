import { useState, useEffect, useCallback } from 'react';
import { DashboardWidget, DEFAULT_WIDGETS, UserDashboardLayout, WidgetLayout, Layouts } from '../components/DashboardWidgets/types';
import { dashboardLayoutService } from '../services/dashboardLayout.service';

const STORAGE_KEY = 'cflux-dashboard-layout';

// Generate default layouts for different breakpoints
const generateDefaultLayouts = (widgets: DashboardWidget[]): Layouts => {
  const visibleWidgets = widgets.filter(w => w.isVisible);
  
  const lgLayout: WidgetLayout[] = [];
  const mdLayout: WidgetLayout[] = [];
  const smLayout: WidgetLayout[] = [];
  
  let yOffset = 0;
  
  visibleWidgets.forEach((widget, index) => {
    // Large screens (12 columns)
    lgLayout.push({
      i: widget.id,
      x: (index % 2) * 6,
      y: yOffset + Math.floor(index / 2) * (widget.defaultH || 2),
      w: widget.defaultW || 6,
      h: widget.defaultH || 2,
      minW: widget.minW || 2,
      minH: widget.minH || 1,
    });
    
    // Medium screens (10 columns)
    mdLayout.push({
      i: widget.id,
      x: (index % 2) * 5,
      y: yOffset + Math.floor(index / 2) * (widget.defaultH || 2),
      w: Math.min(widget.defaultW || 5, 10),
      h: widget.defaultH || 2,
      minW: widget.minW || 2,
      minH: widget.minH || 1,
    });
    
    // Small screens (6 columns) - stack vertically
    smLayout.push({
      i: widget.id,
      x: 0,
      y: yOffset,
      w: 6,
      h: widget.defaultH || 2,
      minW: widget.minW || 2,
      minH: widget.minH || 1,
    });
    
    yOffset += widget.defaultH || 2;
  });
  
  return { lg: lgLayout, md: mdLayout, sm: smLayout };
};

// Load initial state synchronously from localStorage to prevent flickering
const loadInitialState = (): { widgets: DashboardWidget[], layouts: Layouts } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: UserDashboardLayout = JSON.parse(stored);
      return {
        widgets: parsed.widgets,
        layouts: parsed.layouts
      };
    }
  } catch (error) {
    console.error('Error loading initial layout from localStorage:', error);
  }
  
  // Return defaults if nothing in localStorage
  return {
    widgets: DEFAULT_WIDGETS,
    layouts: generateDefaultLayouts(DEFAULT_WIDGETS)
  };
};

export const useDashboardLayout = (userId: string | undefined) => {
  // Initialize state synchronously from localStorage to prevent flicker
  const initialState = loadInitialState();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialState.widgets);
  const [layouts, setLayouts] = useState<Layouts>(initialState.layouts);
  const [isLoading, setIsLoading] = useState(true);

  // Load layout from backend (sync with localStorage)
  useEffect(() => {
    const loadLayout = async () => {
      try {
        // Try to load from backend
        if (userId) {
          const backendLayout = await dashboardLayoutService.getMyLayout();
          if (backendLayout) {
            // Only update if different from current state
            const layoutChanged = JSON.stringify(backendLayout.layouts) !== JSON.stringify(layouts);
            const widgetsChanged = JSON.stringify(backendLayout.widgets) !== JSON.stringify(widgets);
            
            if (layoutChanged || widgetsChanged) {
              setWidgets(backendLayout.widgets);
              setLayouts(backendLayout.layouts);
              // Also update localStorage
              localStorage.setItem(STORAGE_KEY, JSON.stringify({
                widgets: backendLayout.widgets,
                layouts: backendLayout.layouts
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading dashboard layout from backend:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Save layout to backend and localStorage
  const saveLayout = useCallback(async (newLayouts: Layouts, newWidgets?: DashboardWidget[]) => {
    const layoutToSave: UserDashboardLayout = {
      userId: userId || 'guest',
      widgets: newWidgets || widgets,
      layouts: newLayouts,
      lastModified: new Date().toISOString(),
    };

    try {
      // Save to localStorage immediately for offline support
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutToSave));
      
      // Save to backend if user is authenticated
      if (userId) {
        await dashboardLayoutService.saveMyLayout(layoutToSave);
      }
      
      setLayouts(newLayouts);
      if (newWidgets) {
        setWidgets(newWidgets);
      }
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      // Layout is still saved locally, so this is non-critical
    }
  }, [userId, widgets]);

  // Handle layout change from grid
  const handleLayoutChange = useCallback((_currentLayout: any, allLayouts: any) => {
    saveLayout(allLayouts);
  }, [saveLayout]);

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: string) => {
    const newWidgets = widgets.map(w => 
      w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
    );
    const newLayouts = generateDefaultLayouts(newWidgets);
    saveLayout(newLayouts, newWidgets);
  }, [widgets, saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(async () => {
    try {
      const defaultWidgets = DEFAULT_WIDGETS.map(w => ({ ...w, isVisible: true }));
      const defaultLayouts = generateDefaultLayouts(defaultWidgets);
      
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
      
      // Delete from backend if user is authenticated
      if (userId) {
        await dashboardLayoutService.resetMyLayout();
      }
      
      setWidgets(defaultWidgets);
      setLayouts(defaultLayouts);
    } catch (error) {
      console.error('Error resetting dashboard layout:', error);
      // Still update locally even if backend fails
      const defaultWidgets = DEFAULT_WIDGETS.map(w => ({ ...w, isVisible: true }));
      const defaultLayouts = generateDefaultLayouts(defaultWidgets);
      setWidgets(defaultWidgets);
      setLayouts(defaultLayouts);
    }
  }, [userId]);

  return {
    widgets,
    layouts,
    isLoading,
    handleLayoutChange,
    toggleWidget,
    resetLayout,
  };
};
