import React, { useRef, useEffect, useState } from 'react';
import BauhausClock from '../BauhausClock';
import WidgetHeader from './WidgetHeader';
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
        // Padding (5px * 2 = 10px) + etwas Puffer (10px) = 20px
        const size = Math.min(width, height) - 120;
        setClockSize(Math.max(100, size));
      }
    };

    // Verzögere die erste Berechnung leicht, damit das Layout gerendert ist
    const timer = setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    
    // Beobachte auch Größenänderungen des Containers
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <WidgetHeader 
        title="Bauhaus Uhr" 
        icon="🎨"
        onRemove={onRemove}
        onSettings={onSettings}
      />
      <div 
        ref={containerRef}
        className="widget-content"
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          width: '100%',
          padding: '5px',
          overflow: 'hidden'
        }}
      >
        <BauhausClock size={clockSize} />
      </div>
    </>
  );
};

export default BauhausClockWidget;
