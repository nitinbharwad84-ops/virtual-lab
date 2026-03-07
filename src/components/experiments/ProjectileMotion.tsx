'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function ProjectileMotion() {
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(30);
  const [isLaunched, setIsLaunched] = useState(false);
  const [animTime, setAnimTime] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const supabase = createClient();

  const g = 9.81;
  const rad = (angle * Math.PI) / 180;
  const vx = velocity * Math.cos(rad);
  const vy = velocity * Math.sin(rad);
  const totalTime = (2 * vy) / g;
  const maxHeight = (vy * vy) / (2 * g);
  const range = vx * totalTime;

  // Graph: Range vs Angle (fixed velocity)
  const rangeVsAngle = useMemo(() => {
    const pts = [];
    for (let a = 0; a <= 90; a += 1) {
      const r = (a * Math.PI) / 180;
      const R = (velocity * velocity * Math.sin(2 * r)) / g;
      pts.push({ x: a, y: R });
    }
    return pts;
  }, [velocity, g]);

  // Graph: Height vs Angle (fixed velocity)
  const heightVsAngle = useMemo(() => {
    const pts = [];
    for (let a = 0; a <= 90; a += 1) {
      const r = (a * Math.PI) / 180;
      const vyy = velocity * Math.sin(r);
      pts.push({ x: a, y: (vyy * vyy) / (2 * g) });
    }
    return pts;
  }, [velocity, g]);

  // Graph: Trajectory y vs x
  const trajectoryData = useMemo(() => {
    const pts = [];
    for (let t = 0; t <= totalTime; t += totalTime / 100) {
      pts.push({ x: vx * t, y: vy * t - 0.5 * g * t * t });
    }
    return pts;
  }, [vx, vy, totalTime, g]);

  const drawScene = useCallback((t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width; const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; ctx.fillRect(0, 0, w, h);

    const groundY = h - 50;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; ctx.lineWidth = 1;
    for (let i = 50; i < w; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, groundY); ctx.stroke(); }
    for (let i = 50; i < groundY; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

    const originX = 80; const originY = groundY;
    const scaleX = (w - 160) / Math.max(range, 1);
    const scaleY = (h - 120) / Math.max(maxHeight, 1);
    const scale = Math.min(scaleX, scaleY, 4);

    // Dashed trajectory path
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const tt = (i / 100) * totalTime;
      const px = originX + vx * tt * scale;
      const py = originY - (vy * tt - 0.5 * g * tt * tt) * scale;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.setLineDash([]);

    // Cannon
    ctx.save(); ctx.translate(originX, originY); ctx.rotate(-rad);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.6)'; ctx.fillRect(0, -6, 40, 12);
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fillStyle = 'rgba(139, 92, 246, 0.8)'; ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(originX, originY, 30, -rad, 0); ctx.stroke();
    ctx.fillStyle = '#f59e0b'; ctx.font = '12px Inter, sans-serif'; ctx.fillText(`${angle}°`, originX + 35, originY - 8);

    // Animated projectile
    if (isLaunched && t <= totalTime) {
      const px = originX + vx * t * scale;
      const py = originY - (vy * t - 0.5 * g * t * t) * scale;
      for (let i = 0; i < 20; i++) {
        const tt = t - (i * 0.03); if (tt < 0) continue;
        const tx = originX + vx * tt * scale;
        const ty = originY - (vy * tt - 0.5 * g * tt * tt) * scale;
        ctx.beginPath(); ctx.arc(tx, ty, 3 - i * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 72, 153, ${0.5 - i * 0.025})`; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, 8);
      gradient.addColorStop(0, 'rgba(236, 72, 153, 1)'); gradient.addColorStop(1, 'rgba(139, 92, 246, 0.8)');
      ctx.fillStyle = gradient; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2); ctx.fillStyle = 'rgba(236, 72, 153, 0.15)'; ctx.fill();
    }

    if (isLaunched && t >= totalTime) {
      const landX = originX + range * scale;
      ctx.beginPath(); ctx.arc(landX, groundY, 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(16, 185, 129, 0.6)'; ctx.fill();
      ctx.fillStyle = '#10b981'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${range.toFixed(1)}m`, landX, groundY + 20);
    }
    if (isLaunched) {
      const maxHX = originX + (range / 2) * scale; const maxHY = originY - maxHeight * scale;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(maxHX, maxHY); ctx.lineTo(maxHX, groundY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`H: ${maxHeight.toFixed(1)}m`, maxHX, maxHY - 10);
    }
  }, [angle, velocity, isLaunched, vx, vy, totalTime, maxHeight, range, g, rad]);

  useEffect(() => {
    if (activeTab !== 'simulation') return;
    if (!isLaunched) { drawScene(0); return; }
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      setAnimTime(elapsed); drawScene(elapsed);
      if (elapsed < totalTime + 0.5) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isLaunched, drawScene, totalTime, activeTab]);

  useEffect(() => { if (!isLaunched && activeTab === 'simulation') drawScene(0); }, [angle, velocity, isLaunched, drawScene, activeTab]);

  const handleLaunch = () => { setIsLaunched(false); setAnimTime(0); setTimeout(() => setIsLaunched(true), 50); };
  const handleReset = () => { setIsLaunched(false); setAnimTime(0); cancelAnimationFrame(animRef.current); };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Please sign in to save results'); setSaving(false); return; }
    const { data: experiments } = await supabase.from('experiments').select('id').eq('slug', 'projectile-motion').single();
    if (experiments) {
      await supabase.from('experiment_results').insert({
        user_id: user.id, experiment_id: experiments.id,
        input_params: { angle, velocity },
        output_data: { range: parseFloat(range.toFixed(2)), max_height: parseFloat(maxHeight.toFixed(2)), time_of_flight: parseFloat(totalTime.toFixed(2)) },
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const tabs = [
    { key: 'simulation' as const, label: '🎯 Simulation' },
    { key: 'graph' as const, label: '📊 Graphs' },
    { key: 'calculator' as const, label: '🧮 Calculator' },
  ];

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none',
            background: activeTab === tab.key ? 'var(--gradient-primary)' : 'transparent',
            color: activeTab === tab.key ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.3s ease', fontFamily: "'Inter', sans-serif",
          }}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'simulation' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Trajectory Visualization</h3>
            <div className="canvas-container"><canvas ref={canvasRef} width={600} height={380} style={{ width: '100%', height: 'auto' }} /></div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={handleLaunch} className="btn-primary" style={{ flex: 1, padding: '12px' }}>🚀 Launch</button>
              <button onClick={handleReset} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Reset</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Controls</h3>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Launch Angle</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{angle}°</span>
                </div>
                <input type="range" min={5} max={85} step={1} value={angle} onChange={(e) => { setAngle(Number(e.target.value)); handleReset(); }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Initial Velocity</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6' }}>{velocity} m/s</span>
                </div>
                <input type="range" min={5} max={60} step={1} value={velocity} onChange={(e) => { setVelocity(Number(e.target.value)); handleReset(); }} />
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Range</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{range.toFixed(2)} m</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Max Height</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>{maxHeight.toFixed(2)} m</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Flight Time</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{totalTime.toFixed(2)} s</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Time Elapsed</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#06b6d4', fontFamily: "'Outfit', sans-serif" }}>{Math.min(animTime, totalTime).toFixed(2)} s</div>
                </div>
              </div>
            </div>
            <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ width: '100%', padding: '14px', opacity: saving ? 0.7 : 1 }}>
              {saved ? '✓ Result Saved!' : saving ? 'Saving...' : '💾 Save Result to Dashboard'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'graph' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Inline Controls for Graph Tab */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>🎛️</span>
              <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)', margin: 0 }}>
                Adjust Values — Graphs update in real-time
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Launch Angle</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{angle}°</span>
                </div>
                <input type="range" min={5} max={85} step={1} value={angle} onChange={(e) => { setAngle(Number(e.target.value)); handleReset(); }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Initial Velocity</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#8b5cf6' }}>{velocity} m/s</span>
                </div>
                <input type="range" min={5} max={60} step={1} value={velocity} onChange={(e) => { setVelocity(Number(e.target.value)); handleReset(); }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Range</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{range.toFixed(1)} m</div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Height</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>{maxHeight.toFixed(1)} m</div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Time</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{totalTime.toFixed(2)} s</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
                Range vs Angle (v = {velocity} m/s)
              </h3>
              <Graph data={rangeVsAngle} xLabel="Angle (°)" yLabel="Range (m)" title="R = v²sin(2θ)/g" color="#10b981" highlightX={angle} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 Maximum range occurs at 45°. Symmetric about this angle.</p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
                Max Height vs Angle (v = {velocity} m/s)
              </h3>
              <Graph data={heightVsAngle} xLabel="Angle (°)" yLabel="Height (m)" title="H = v²sin²(θ)/2g" color="#f59e0b" highlightX={angle} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 Max height increases monotonically with angle, peaking at 90°.</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
              Trajectory (y vs x) — θ = {angle}°, v = {velocity} m/s
            </h3>
            <Graph data={trajectoryData} xLabel="Horizontal Distance (m)" yLabel="Height (m)" title="Parabolic Trajectory" color="#8b5cf6" showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 The projectile follows a parabolic path described by y = x·tan(θ) − gx²/(2v²cos²θ).</p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator
            title="Projectile Range Calculator"
            formula="R = v² × sin(2θ) / g"
            formulaDescription="Calculate horizontal range from velocity and angle"
            variables={[
              { name: 'v', label: 'Velocity', unit: 'm/s', color: '#8b5cf6' },
              { name: 'theta', label: 'Angle', unit: '°', color: '#f59e0b' },
              { name: 'R', label: 'Range', unit: 'm', color: '#10b981' },
            ]}
            calculate={(vals) => {
              const v = vals.v, th = vals.theta, R = vals.R;
              if (v !== null && th !== null) {
                const rr = (v * v * Math.sin(2 * th * Math.PI / 180)) / 9.81;
                const H = (v * v * Math.sin(th * Math.PI / 180) ** 2) / (2 * 9.81);
                const T = (2 * v * Math.sin(th * Math.PI / 180)) / 9.81;
                return { results: { R: rr }, steps: [`Given: v = ${v} m/s, θ = ${th}°`, `R = v²sin(2θ)/g = ${v}² × sin(${2 * th}°) / 9.81`, `R = ${rr.toFixed(4)} m`, `Max Height H = v²sin²(θ)/2g = ${H.toFixed(4)} m`, `Time of Flight T = 2v·sin(θ)/g = ${T.toFixed(4)} s`] };
              } else if (v !== null && R !== null) {
                const sinVal = (R * 9.81) / (v * v);
                if (Math.abs(sinVal) > 1) throw new Error('Invalid');
                const th2 = Math.asin(sinVal) * 180 / Math.PI / 2;
                return { results: { theta: th2 }, steps: [`Given: v = ${v} m/s, R = ${R} m`, `sin(2θ) = Rg/v² = ${R}×9.81/${v}² = ${sinVal.toFixed(4)}`, `2θ = arcsin(${sinVal.toFixed(4)}) = ${(th2 * 2).toFixed(2)}°`, `θ = ${th2.toFixed(4)}°`] };
              }
              throw new Error('Enter at least two values');
            }}
          />
          <FormulaCalculator
            title="Max Height Calculator"
            formula="H = v² × sin²(θ) / (2g)"
            formulaDescription="Calculate maximum height from velocity and angle"
            variables={[
              { name: 'v', label: 'Velocity', unit: 'm/s', color: '#8b5cf6' },
              { name: 'theta', label: 'Angle', unit: '°', color: '#f59e0b' },
              { name: 'H', label: 'Max Height', unit: 'm', color: '#ec4899' },
            ]}
            calculate={(vals) => {
              const v = vals.v, th = vals.theta;
              if (v !== null && th !== null) {
                const H = (v * v * Math.sin(th * Math.PI / 180) ** 2) / (2 * 9.81);
                return { results: { H }, steps: [`Given: v = ${v} m/s, θ = ${th}°`, `H = v²sin²(θ)/2g`, `H = ${v}² × sin²(${th}°) / (2 × 9.81)`, `H = ${H.toFixed(4)} m`] };
              }
              throw new Error('Enter velocity and angle');
            }}
          />
        </div>
      )}
    </div>
  );
}
