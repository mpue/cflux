import React, { useRef, useEffect, useState } from 'react';
import BauhausClock from '../BauhausClock';
import './DashboardWidgets.css';

interface BauhausClockWidgetProps {
  onRemove?: () => void;
  onSettings?: () => void;
}

const BauhausClockWidget: React.FC<BauhausClockWidgetProps> = ({ onRemove, onSettings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clockSize, setClockSize] = useState(180);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        const size = Math.min(width, height) - 40;
        setClockSize(Math.max(100, size));
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Beobachte auch Größenänderungen des Containers
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="dashboard-widget bauhaus-clock-widget"
      style={{ height: '100%', width: '100%' }}
    >
      <div className="widget-content" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%',
        width: '100%',
        padding: 0
      }}>
        <BauhausClock size={clockSize} />
      </div>
    </div>
  );
};

export default BauhausClockWidget;
