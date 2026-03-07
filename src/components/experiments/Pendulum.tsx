'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function Pendulum() {
  const [length, setLength] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const supabase = createClient();

  const g = 9.81;
  const timePeriod = 2 * Math.PI * Math.sqrt(length / g);
  const frequency = 1 / timePeriod;
  const initialAngle = 30;
  const initialAngleRad = (initialAngle * Math.PI) / 180;

  // Graph: T vs L
  const tVsL = useMemo(() => {
    const pts = [];
    for (let l = 0.1; l <= 3.0; l += 0.05) {
      pts.push({ x: l, y: 2 * Math.PI * Math.sqrt(l / g) });
    }
    return pts;
  }, [g]);

  // Graph: f vs L
  const fVsL = useMemo(() => {
    const pts = [];
    for (let l = 0.1; l <= 3.0; l += 0.05) {
      pts.push({ x: l, y: 1 / (2 * Math.PI * Math.sqrt(l / g)) });
    }
    return pts;
  }, [g]);

  // Graph: T² vs L (linear)
  const t2VsL = useMemo(() => {
    const pts = [];
    for (let l = 0.1; l <= 3.0; l += 0.05) {
      const T = 2 * Math.PI * Math.sqrt(l / g);
      pts.push({ x: l, y: T * T });
    }
    return pts;
  }, [g]);

  const drawPendulum = useCallback((t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width; const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; ctx.fillRect(0, 0, w, h);

    const pivotX = w / 2; const pivotY = 60;
    const scale = Math.min(200, (h - 140) / 1.5);
    const rodLength = length * scale;
    const omega = (2 * Math.PI) / timePeriod;
    const angle = isRunning ? initialAngleRad * Math.cos(omega * t) * Math.exp(-0.005 * t) : initialAngleRad;
    const bobX = pivotX + rodLength * Math.sin(angle);
    const bobY = pivotY + rodLength * Math.cos(angle);

    // Ghost trail
    if (isRunning) {
      ctx.globalAlpha = 0.05;
      for (let i = 1; i <= 8; i++) {
        const trailT = t - i * 0.05; if (trailT < 0) continue;
        const trailAngle = initialAngleRad * Math.cos(omega * trailT) * Math.exp(-0.005 * trailT);
        const tx = pivotX + rodLength * Math.sin(trailAngle);
        const ty = pivotY + rodLength * Math.cos(trailAngle);
        ctx.beginPath(); ctx.arc(tx, ty, 16, 0, Math.PI * 2); ctx.fillStyle = '#8b5cf6'; ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Support beam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fillRect(w / 2 - 80, 40, 160, 8);
    ctx.beginPath(); ctx.arc(pivotX, 44, 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.fill();

    // Vertical equilibrium line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(pivotX, pivotY + rodLength + 30); ctx.stroke(); ctx.setLineDash([]);

    // Angle arc
    if (Math.abs(angle) > 0.01) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; ctx.lineWidth = 2;
      ctx.beginPath();
      if (angle > 0) ctx.arc(pivotX, pivotY, 40, Math.PI / 2 - Math.abs(angle), Math.PI / 2);
      else ctx.arc(pivotX, pivotY, 40, Math.PI / 2, Math.PI / 2 + Math.abs(angle));
      ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = angle > 0 ? 'right' : 'left';
      ctx.fillText(`${(Math.abs(angle) * 180 / Math.PI).toFixed(1)}°`, angle > 0 ? pivotX - 48 : pivotX + 48, pivotY + 30);
    }

    // Rod
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY); ctx.stroke();

    // Bob shadow
    ctx.beginPath(); ctx.ellipse(bobX + 5, h - 40, 12, 4, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fill();

    // Bob
    const bobGrad = ctx.createRadialGradient(bobX - 4, bobY - 4, 0, bobX, bobY, 20);
    bobGrad.addColorStop(0, '#a78bfa'); bobGrad.addColorStop(0.5, '#8b5cf6'); bobGrad.addColorStop(1, '#6d28d9');
    ctx.beginPath(); ctx.arc(bobX, bobY, 20, 0, Math.PI * 2); ctx.fillStyle = bobGrad; ctx.fill();
    ctx.beginPath(); ctx.arc(bobX - 6, bobY - 6, 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(bobX, bobY, 32, 0, Math.PI * 2); ctx.fillStyle = 'rgba(139, 92, 246, 0.1)'; ctx.fill();

    ctx.fillStyle = 'rgba(6, 182, 212, 0.7)'; ctx.font = '12px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`L = ${length.toFixed(2)} m`, (pivotX + bobX) / 2 + 15, (pivotY + bobY) / 2);
    ctx.beginPath(); ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.fill();
  }, [length, isRunning, initialAngleRad, timePeriod]);

  useEffect(() => {
    if (activeTab !== 'simulation') return;
    if (!isRunning) { drawPendulum(0); return; }
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      drawPendulum((timestamp - startTime) / 1000);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, drawPendulum, activeTab]);

  useEffect(() => { if (!isRunning && activeTab === 'simulation') drawPendulum(0); }, [length, isRunning, drawPendulum, activeTab]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Please sign in to save results'); setSaving(false); return; }
    const { data: experiments } = await supabase.from('experiments').select('id').eq('slug', 'pendulum').single();
    if (experiments) {
      await supabase.from('experiment_results').insert({
        user_id: user.id, experiment_id: experiments.id,
        input_params: { length, initial_angle: initialAngle },
        output_data: { time_period: parseFloat(timePeriod.toFixed(4)), frequency: parseFloat(frequency.toFixed(4)) },
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const tabs = [
    { key: 'simulation' as const, label: '🕐 Simulation' },
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
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Pendulum Animation</h3>
            <div className="canvas-container"><canvas ref={canvasRef} width={500} height={400} style={{ width: '100%', height: 'auto' }} /></div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => setIsRunning(!isRunning)} className="btn-primary" style={{ flex: 1, padding: '12px' }}>{isRunning ? '⏸ Pause' : '▶ Start'}</button>
              <button onClick={() => setIsRunning(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Reset</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Controls</h3>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>String Length</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>{length.toFixed(2)} m</span>
                </div>
                <input type="range" min={0.1} max={3.0} step={0.05} value={length} onChange={(e) => { setLength(Number(e.target.value)); setIsRunning(false); }} />
              </div>
              <div style={{ marginTop: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>📐 Initial angle: {initialAngle}° &nbsp;|&nbsp; g = {g} m/s²</p>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Results</h3>
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
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>T = 2π√(L/g) = 2π√({length.toFixed(2)}/{g}) = {timePeriod.toFixed(3)} s</span>
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
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>String Length</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#06b6d4' }}>{length.toFixed(2)} m</span>
                </div>
                <input type="range" min={0.1} max={3.0} step={0.05} value={length} onChange={(e) => { setLength(Number(e.target.value)); setIsRunning(false); }} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Period T</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{timePeriod.toFixed(3)} s</div>
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Frequency</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{frequency.toFixed(3)} Hz</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Time Period vs Length</h3>
              <Graph data={tVsL} xLabel="Length (m)" yLabel="Period T (s)" title="T = 2π√(L/g)" color="#8b5cf6" highlightX={length} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 T increases with √L — a longer pendulum swings slower.</p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Frequency vs Length</h3>
              <Graph data={fVsL} xLabel="Length (m)" yLabel="Frequency (Hz)" title="f = 1 / T" color="#10b981" highlightX={length} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📉 Shorter pendulums oscillate faster (higher frequency).</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>T² vs L (Linear verification)</h3>
            <Graph data={t2VsL} xLabel="Length (m)" yLabel="T² (s²)" title="T² = 4π²L/g (linear)" color="#f59e0b" highlightX={length} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 T² vs L is a straight line — confirming T ∝ √L. Slope = 4π²/g ≈ {(4 * Math.PI * Math.PI / g).toFixed(3)} s²/m.</p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator
            title="Pendulum Period Calculator"
            formula="T = 2π√(L/g)"
            formulaDescription="Calculate time period, length, or g from the other two"
            variables={[
              { name: 'T', label: 'Period', unit: 's', color: '#8b5cf6' },
              { name: 'L', label: 'Length', unit: 'm', color: '#06b6d4' },
              { name: 'g', label: 'Gravity', unit: 'm/s²', color: '#f59e0b' },
            ]}
            calculate={(vals) => {
              const T = vals.T, L = vals.L, gv = vals.g;
              if (L !== null && gv !== null) {
                const Tc = 2 * Math.PI * Math.sqrt(L / gv);
                const f = 1 / Tc;
                return { results: { T: Tc }, steps: [`Given: L = ${L} m, g = ${gv} m/s²`, `T = 2π√(L/g) = 2π√(${L}/${gv})`, `T = 2π × ${Math.sqrt(L / gv).toFixed(4)}`, `T = ${Tc.toFixed(4)} s`, `Frequency f = 1/T = ${f.toFixed(4)} Hz`] };
              } else if (T !== null && gv !== null) {
                const Lc = gv * (T / (2 * Math.PI)) ** 2;
                return { results: { L: Lc }, steps: [`Given: T = ${T} s, g = ${gv} m/s²`, `From T = 2π√(L/g), L = g(T/2π)²`, `L = ${gv} × (${T}/(2π))²`, `L = ${Lc.toFixed(4)} m`] };
              } else if (T !== null && L !== null) {
                const gc = (4 * Math.PI * Math.PI * L) / (T * T);
                return { results: { g: gc }, steps: [`Given: T = ${T} s, L = ${L} m`, `From T = 2π√(L/g), g = 4π²L/T²`, `g = 4π² × ${L} / ${T}²`, `g = ${gc.toFixed(4)} m/s²`] };
              }
              throw new Error('Enter at least two values');
            }}
          />
          <FormulaCalculator
            title="Frequency Calculator"
            formula="f = 1/(2π) × √(g/L)"
            formulaDescription="Calculate frequency from length and gravity"
            variables={[
              { name: 'f', label: 'Frequency', unit: 'Hz', color: '#10b981' },
              { name: 'L', label: 'Length', unit: 'm', color: '#06b6d4' },
              { name: 'g', label: 'Gravity', unit: 'm/s²', color: '#f59e0b' },
            ]}
            calculate={(vals) => {
              const f = vals.f, L = vals.L, gv = vals.g;
              if (L !== null && gv !== null) {
                const fc = (1 / (2 * Math.PI)) * Math.sqrt(gv / L);
                return { results: { f: fc }, steps: [`Given: L = ${L} m, g = ${gv} m/s²`, `f = (1/2π)√(g/L) = (1/2π)√(${gv}/${L})`, `f = ${fc.toFixed(4)} Hz`, `Period T = ${(1 / fc).toFixed(4)} s`] };
              } else if (f !== null && gv !== null) {
                const Lc = gv / ((2 * Math.PI * f) ** 2);
                return { results: { L: Lc }, steps: [`Given: f = ${f} Hz, g = ${gv} m/s²`, `L = g / (2πf)²`, `L = ${gv} / (2π × ${f})²`, `L = ${Lc.toFixed(4)} m`] };
              }
              throw new Error('Enter at least two values');
            }}
          />
        </div>
      )}
    </div>
  );
}
