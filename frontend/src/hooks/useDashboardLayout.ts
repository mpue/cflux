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
      
      // Merge with DEFAULT_WIDGETS to ensure all widgets are present
      const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
        const savedWidget = parsed.widgets.find(w => w.id === defaultWidget.id);
        return savedWidget || defaultWidget;
      });
      
      return {
        widgets: mergedWidgets,
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
            // Merge with DEFAULT_WIDGETS to ensure all widgets are present
            const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
              const savedWidget = backendLayout.widgets.find(w => w.id === defaultWidget.id);
              return savedWidget || defaultWidget;
            });
            
            // Only update if different from current state
            const layoutChanged = JSON.stringify(backendLayout.layouts) !== JSON.stringify(layouts);
            const widgetsChanged = JSON.stringify(mergedWidgets) !== JSON.stringify(widgets);
            
            if (layoutChanged || widgetsChanged) {
              setWidgets(mergedWidgets);
              setLayouts(backendLayout.layouts);
              // Also update localStorage
              localStorage.setItem(STORAGE_KEY, JSON.stringify({
                widgets: mergedWidgets,
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

  // Add a new widget
  const addWidget = useCallback((widgetId: string) => {
    const template = DEFAULT_WIDGETS.find(w => w.id === widgetId);
    if (!template) return;

    // For multi-instance widgets, always create a new instance with a unique ID
    const instanceId = template.multiInstance
      ? `${widgetId}-${Date.now()}`
      : widgetId;

    const widgetToAdd = { ...template, id: instanceId };

    let newWidgets: DashboardWidget[];
    const existingWidget = widgets.find(w => w.id === instanceId);

    if (existingWidget) {
      // Widget exists, just make it visible
      newWidgets = widgets.map(w =>
        w.id === instanceId ? { ...w, isVisible: true } : w
      );
    } else {
      // Widget doesn't exist yet, add it to the list
      newWidgets = [...widgets, { ...widgetToAdd, isVisible: true }];
    }

    // Calculate position for the new widget without disrupting existing ones
    const currentLayouts = { ...layouts };
    const visibleWidgets = newWidgets.filter(w => w.isVisible);
    
    // Find maximum Y position for each breakpoint
    const maxYLg = currentLayouts.lg.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    const maxYMd = currentLayouts.md.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    const maxYSm = currentLayouts.sm.reduce((max, item) => Math.max(max, item.y + item.h), 0);

    // Add layout for new widget if it doesn't exist
    if (!currentLayouts.lg.find(l => l.i === instanceId)) {
      currentLayouts.lg.push({
        i: instanceId,
        x: 0,
        y: maxYLg,
        w: widgetToAdd.defaultW || 6,
        h: widgetToAdd.defaultH || 2,
        minW: widgetToAdd.minW || 2,
        minH: widgetToAdd.minH || 1,
      });
    }

    if (!currentLayouts.md.find(l => l.i === instanceId)) {
      currentLayouts.md.push({
        i: instanceId,
        x: 0,
        y: maxYMd,
        w: Math.min(widgetToAdd.defaultW || 5, 10),
        h: widgetToAdd.defaultH || 2,
        minW: widgetToAdd.minW || 2,
        minH: widgetToAdd.minH || 1,
      });
    }

    if (!currentLayouts.sm.find(l => l.i === instanceId)) {
      currentLayouts.sm.push({
        i: instanceId,
        x: 0,
        y: maxYSm,
        w: 6,
        h: widgetToAdd.defaultH || 2,
        minW: widgetToAdd.minW || 2,
        minH: widgetToAdd.minH || 1,
      });
    }

    saveLayout(currentLayouts, newWidgets);
  }, [widgets, layouts, saveLayout]);

  // Remove a widget
  const removeWidget = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    let newWidgets: DashboardWidget[];

    if (widget?.multiInstance) {
      // Multi-instance: fully remove so the list doesn't grow forever
      newWidgets = widgets.filter(w => w.id !== widgetId);
    } else {
      // Single-instance: just hide so it can be re-added via the modal
      newWidgets = widgets.map(w =>
        w.id === widgetId ? { ...w, isVisible: false } : w
      );
    }

    const newLayouts = generateDefaultLayouts(newWidgets);
    saveLayout(newLayouts, newWidgets);
  }, [widgets, saveLayout]);

  // Update widget config (e.g. EHS KPI settings)
  const updateWidgetConfig = useCallback((widgetId: string, config: Record<string, any>) => {
    const newWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w
    );
    saveLayout(layouts, newWidgets);
  }, [widgets, layouts, saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(async () => {
    try {
      const defaultWidgets = DEFAULT_WIDGETS.map(w => ({ ...w, isVisible: false }));
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
      const defaultWidgets = DEFAULT_WIDGETS.map(w => ({ ...w, isVisible: false }));
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
    addWidget,
    removeWidget,
    updateWidgetConfig,
    resetLayout,
  };
};
