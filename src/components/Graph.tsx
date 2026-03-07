'use client';

import { useRef, useEffect, useCallback } from 'react';

interface DataPoint {
  x: number;
  y: number;
}

interface GraphProps {
  data: DataPoint[];
  xLabel: string;
  yLabel: string;
  title: string;
  color?: string;
  highlightX?: number;
  width?: number;
  height?: number;
  showArea?: boolean;
  secondaryData?: DataPoint[];
  secondaryColor?: string;
  secondaryLabel?: string;
}

export default function Graph({
  data,
  xLabel,
  yLabel,
  title,
  color = '#8b5cf6',
  highlightX,
  width = 500,
  height = 280,
  showArea = false,
  secondaryData,
  secondaryColor = '#06b6d4',
  secondaryLabel,
}: GraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, w, h);

    const padding = { top: 35, right: 25, bottom: 50, left: 60 };
    const graphW = w - padding.left - padding.right;
    const graphH = h - padding.top - padding.bottom;

    // Compute ranges including secondary data
    const allData = secondaryData ? [...data, ...secondaryData] : data;
    const xMin = Math.min(...allData.map((d) => d.x));
    const xMax = Math.max(...allData.map((d) => d.x));
    const yMin = Math.min(...allData.map((d) => d.y), 0);
    const yMax = Math.max(...allData.map((d) => d.y)) * 1.1;
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const toCanvasX = (x: number) => padding.left + ((x - xMin) / xRange) * graphW;
    const toCanvasY = (y: number) => padding.top + graphH - ((y - yMin) / yRange) * graphH;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridLinesY = 5;
    for (let i = 0; i <= gridLinesY; i++) {
      const y = padding.top + (i / gridLinesY) * graphH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      const val = yMax - (i / gridLinesY) * yRange;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(val >= 100 ? 0 : val >= 1 ? 1 : 2), padding.left - 8, y + 4);
    }

    const gridLinesX = 5;
    for (let i = 0; i <= gridLinesX; i++) {
      const x = padding.left + (i / gridLinesX) * graphW;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + graphH);
      ctx.stroke();

      const val = xMin + (i / gridLinesX) * xRange;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val.toFixed(val >= 100 ? 0 : val >= 1 ? 1 : 2), x, h - padding.bottom + 16);
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + graphH);
    ctx.lineTo(w - padding.right, padding.top + graphH);
    ctx.stroke();

    // Area fill for primary data
    const drawDataset = (points: DataPoint[], lineColor: string, fill: boolean) => {
      if (points.length < 2) return;

      if (fill) {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(points[0].x), toCanvasY(0));
        points.forEach((d) => ctx.lineTo(toCanvasX(d.x), toCanvasY(d.y)));
        ctx.lineTo(toCanvasX(points[points.length - 1].x), toCanvasY(0));
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphH);
        grad.addColorStop(0, lineColor + '25');
        grad.addColorStop(1, lineColor + '02');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Line
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      points.forEach((d, i) => {
        const cx = toCanvasX(d.x);
        const cy = toCanvasY(d.y);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      // Dots at data points (sparse if too many)
      const step = Math.max(1, Math.floor(points.length / 20));
      points.forEach((d, i) => {
        if (i % step !== 0 && i !== points.length - 1) return;
        const cx = toCanvasX(d.x);
        const cy = toCanvasY(d.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
      });
    };

    drawDataset(data, color, showArea);
    if (secondaryData && secondaryData.length > 1) {
      drawDataset(secondaryData, secondaryColor, false);
    }

    // Highlight current X
    if (highlightX !== undefined) {
      const hx = toCanvasX(highlightX);
      const closest = data.reduce((prev, curr) =>
        Math.abs(curr.x - highlightX) < Math.abs(prev.x - highlightX) ? curr : prev
      );
      const hy = toCanvasY(closest.y);

      // Vertical line
      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, padding.top);
      ctx.lineTo(hx, padding.top + graphH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Highlighted dot
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx, hy, 12, 0, Math.PI * 2);
      ctx.fillStyle = color + '20';
      ctx.fill();

      // Value label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `(${closest.x.toFixed(1)}, ${closest.y.toFixed(2)})`,
        hx,
        hy - 16
      );
    }

    // Title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, padding.left + 4, padding.top - 12);

    // Axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, padding.left + graphW / 2, h - 6);

    ctx.save();
    ctx.translate(14, padding.top + graphH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    // Legend
    if (secondaryData && secondaryLabel) {
      const legendX = w - padding.right - 120;
      const legendY = padding.top + 8;
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY, 12, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(yLabel, legendX + 16, legendY + 4);

      ctx.fillStyle = secondaryColor;
      ctx.fillRect(legendX, legendY + 14, 12, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(secondaryLabel, legendX + 16, legendY + 18);
    }
  }, [data, xLabel, yLabel, title, color, highlightX, showArea, secondaryData, secondaryColor, secondaryLabel]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="canvas-container" style={{ borderRadius: 'var(--radius-md)' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  );
}
