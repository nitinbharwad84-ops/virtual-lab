'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Pendulum() {
  const [length, setLength] = useState(1.0); // meters
  const [isRunning, setIsRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const supabase = createClient();

  const g = 9.81;
  const timePeriod = 2 * Math.PI * Math.sqrt(length / g);
  const frequency = 1 / timePeriod;
  const initialAngle = 30; // degrees
  const initialAngleRad = (initialAngle * Math.PI) / 180;

  const drawPendulum = useCallback((t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);

    const pivotX = w / 2;
    const pivotY = 60;
    const scale = Math.min(200, (h - 140) / 1.5);
    const rodLength = length * scale;

    // Current angle
    const omega = (2 * Math.PI) / timePeriod;
    const angle = isRunning
      ? initialAngleRad * Math.cos(omega * t) * Math.exp(-0.005 * t)
      : initialAngleRad;

    const bobX = pivotX + rodLength * Math.sin(angle);
    const bobY = pivotY + rodLength * Math.cos(angle);

    // Trail (ghost positions)
    if (isRunning) {
      ctx.globalAlpha = 0.05;
      for (let i = 1; i <= 8; i++) {
        const trailT = t - i * 0.05;
        if (trailT < 0) continue;
        const trailAngle = initialAngleRad * Math.cos(omega * trailT) * Math.exp(-0.005 * trailT);
        const tx = pivotX + rodLength * Math.sin(trailAngle);
        const ty = pivotY + rodLength * Math.cos(trailAngle);
        ctx.beginPath();
        ctx.arc(tx, ty, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Support beam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(w / 2 - 80, 40, 160, 8);
    ctx.beginPath();
    ctx.arc(pivotX, 44, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    // Vertical equilibrium line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + rodLength + 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Angle arc
    if (Math.abs(angle) > 0.01) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      const arcRadius = 40;
      const startAngle = Math.PI / 2 - Math.abs(angle);
      const endAngle = Math.PI / 2;
      ctx.beginPath();
      if (angle > 0) {
        ctx.arc(pivotX, pivotY, arcRadius, startAngle, endAngle);
      } else {
        ctx.arc(pivotX, pivotY, arcRadius, endAngle, Math.PI - startAngle);
      }
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = angle > 0 ? 'right' : 'left';
      ctx.fillText(
        `${(Math.abs(angle) * 180 / Math.PI).toFixed(1)}°`,
        angle > 0 ? pivotX - arcRadius - 8 : pivotX + arcRadius + 8,
        pivotY + 30
      );
    }

    // Rod / String
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Bob shadow
    ctx.beginPath();
    ctx.ellipse(bobX + 5, h - 40, 12, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();

    // Bob
    const bobGrad = ctx.createRadialGradient(bobX - 4, bobY - 4, 0, bobX, bobY, 20);
    bobGrad.addColorStop(0, '#a78bfa');
    bobGrad.addColorStop(0.5, '#8b5cf6');
    bobGrad.addColorStop(1, '#6d28d9');
    ctx.beginPath();
    ctx.arc(bobX, bobY, 20, 0, Math.PI * 2);
    ctx.fillStyle = bobGrad;
    ctx.fill();

    // Bob highlight
    ctx.beginPath();
    ctx.arc(bobX - 6, bobY - 6, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    // Glow
    ctx.beginPath();
    ctx.arc(bobX, bobY, 32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
    ctx.fill();

    // Length label
    ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    const labelX = (pivotX + bobX) / 2 + 15;
    const labelY = (pivotY + bobY) / 2;
    ctx.fillText(`L = ${length.toFixed(2)} m`, labelX, labelY);

    // Pivot
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
  }, [length, isRunning, initialAngleRad, timePeriod, g]);

  useEffect(() => {
    if (!isRunning) {
      timeRef.current = 0;
      drawPendulum(0);
      return;
    }

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      timeRef.current = elapsed;
      drawPendulum(elapsed);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, drawPendulum]);

  useEffect(() => {
    if (!isRunning) drawPendulum(0);
  }, [length, isRunning, drawPendulum]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to save results');
      setSaving(false);
      return;
    }

    const { data: experiments } = await supabase
      .from('experiments')
      .select('id')
      .eq('slug', 'pendulum')
      .single();

    if (experiments) {
      await supabase.from('experiment_results').insert({
        user_id: user.id,
        experiment_id: experiments.id,
        input_params: { length, initial_angle: initialAngle },
        output_data: {
          time_period: parseFloat(timePeriod.toFixed(4)),
          frequency: parseFloat(frequency.toFixed(4)),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="animate-slide-up">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
      }}>
        {/* Canvas */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
            Pendulum Animation
          </h3>
          <div className="canvas-container">
            <canvas ref={canvasRef} width={500} height={400} style={{ width: '100%', height: 'auto' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button onClick={() => setIsRunning(!isRunning)} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
              {isRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button onClick={() => { setIsRunning(false); }} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
              Reset
            </button>
          </div>
        </div>

        {/* Controls & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
              Controls
            </h3>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>String Length</label>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>{length.toFixed(2)} m</span>
              </div>
              <input type="range" min={0.1} max={3.0} step={0.05} value={length}
                onChange={(e) => { setLength(Number(e.target.value)); setIsRunning(false); }} />
            </div>

            <div style={{
              marginTop: '20px', padding: '12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)',
            }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                📐 Initial angle: {initialAngle}° &nbsp;|&nbsp; g = {g} m/s²
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
              Results
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Time Period (T)</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{timePeriod.toFixed(3)} s</div>
              </div>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Frequency (f)</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{frequency.toFixed(3)} Hz</div>
              </div>
            </div>

            <div style={{
              marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.1)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                T = 2π√(L/g) = 2π√({length.toFixed(2)}/{g}) = {timePeriod.toFixed(3)} s
              </span>
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary" disabled={saving}
            style={{ width: '100%', padding: '14px', opacity: saving ? 0.7 : 1 }}>
            {saved ? '✓ Result Saved!' : saving ? 'Saving...' : '💾 Save Result to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
