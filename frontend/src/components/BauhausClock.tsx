import React, { useEffect, useRef, useState } from 'react';
import './BauhausClock.css';

interface BauhausClockProps {
  size?: number;
}

const BauhausClock: React.FC<BauhausClockProps> = ({ size = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Background circle
    ctx.fillStyle = '#f5f5f0';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Outer ring
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Hour markers (geometric shapes)
    const markers = [
      { hour: 12, color: '#e02020', shape: 'square' },
      { hour: 3, color: '#ffd500', shape: 'circle' },
      { hour: 6, color: '#0066b3', shape: 'triangle' },
      { hour: 9, color: '#000', shape: 'square' }
    ];

    markers.forEach(({ hour, color, shape }) => {
      const angle = ((hour - 3) * Math.PI) / 6;
      const markerRadius = radius * 0.85;
      const x = centerX + markerRadius * Math.cos(angle);
      const y = centerY + markerRadius * Math.sin(angle);

      ctx.fillStyle = color;

      if (shape === 'square') {
        const squareSize = 8;
        ctx.fillRect(x - squareSize / 2, y - squareSize / 2, squareSize, squareSize);
      } else if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      } else if (shape === 'triangle') {
        const triSize = 8;
        ctx.beginPath();
        ctx.moveTo(x, y - triSize / 2);
        ctx.lineTo(x - triSize / 2, y + triSize / 2);
        ctx.lineTo(x + triSize / 2, y + triSize / 2);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Thin hour markers
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const x1 = centerX + (radius - 15) * Math.cos(angle);
      const y1 = centerY + (radius - 15) * Math.sin(angle);
      const x2 = centerX + (radius - 5) * Math.cos(angle);
      const y2 = centerY + (radius - 5) * Math.sin(angle);

      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Center dot
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Hour hand (red)
    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const hourAngle = ((hours + minutes / 60) * Math.PI) / 6 - Math.PI / 2;
    const hourLength = radius * 0.5;

    ctx.strokeStyle = '#e02020';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + hourLength * Math.cos(hourAngle),
      centerY + hourLength * Math.sin(hourAngle)
    );
    ctx.stroke();

    // Minute hand (blue)
    const seconds = time.getSeconds();
    const minuteAngle = ((minutes + seconds / 60) * Math.PI) / 30 - Math.PI / 2;
    const minuteLength = radius * 0.7;

    ctx.strokeStyle = '#0066b3';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + minuteLength * Math.cos(minuteAngle),
      centerY + minuteLength * Math.sin(minuteAngle)
    );
    ctx.stroke();

    // Second hand (yellow)
    const secondAngle = (seconds * Math.PI) / 30 - Math.PI / 2;
    const secondLength = radius * 0.8;

    ctx.strokeStyle = '#ffd500';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + secondLength * Math.cos(secondAngle),
      centerY + secondLength * Math.sin(secondAngle)
    );
    ctx.stroke();

    // Center dot overlay
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();

  }, [time, size]);

  return (
    <div className="bauhaus-clock">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="bauhaus-clock-canvas"
      />
    </div>
  );
};

export default BauhausClock;
