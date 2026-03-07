'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function BoylesLaw() {
  const [pressure, setPressure] = useState(101.325);
  const [volume, setVolume] = useState(5);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  const k = pressure * volume;
  const computedPressure = k / volume;
  const computedVolume = k / pressure;

  const pVsV = useMemo(() => {
    const pts = [];
    for (let v = 1; v <= 15; v += 0.2) pts.push({ x: parseFloat(v.toFixed(1)), y: k / v });
    return pts;
  }, [k]);

  const pvProduct = useMemo(() => {
    const pts = [];
    for (let v = 1; v <= 15; v += 0.2) pts.push({ x: parseFloat(v.toFixed(1)), y: k });
    return pts;
  }, [k]);

  const pVs1V = useMemo(() => {
    const pts = [];
    for (let v = 1; v <= 15; v += 0.2) pts.push({ x: parseFloat((1 / v).toFixed(4)), y: k / v });
    return pts;
  }, [k]);

  const drawPiston = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    const cylX = 80, cylY = 50, cylW = 300, cylH = 200;
    const volFrac = volume / 15;
    const gasWidth = volFrac * (cylW - 20);
    const pistonX = cylX + gasWidth + 10;

    // Cylinder
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cylX, cylY, cylW, cylH, 8);
    ctx.stroke();

    // Left wall (closed)
    ctx.fillStyle = '#475569';
    ctx.fillRect(cylX, cylY, 10, cylH);

    // Gas region
    const gasGrad = ctx.createLinearGradient(cylX + 10, cylY, pistonX, cylY);
    const pressureIntensity = Math.min(1, pressure / 300);
    gasGrad.addColorStop(0, `rgba(6, 182, 212, ${0.1 + pressureIntensity * 0.3})`);
    gasGrad.addColorStop(1, `rgba(139, 92, 246, ${0.1 + pressureIntensity * 0.3})`);
    ctx.fillStyle = gasGrad;
    ctx.fillRect(cylX + 10, cylY + 3, gasWidth, cylH - 6);

    // Gas molecules
    const moleculeCount = Math.min(40, Math.floor(pressure / 5));
    ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
    for (let i = 0; i < moleculeCount; i++) {
      const mx = cylX + 15 + ((i * 7 + Math.sin(i * 2.3) * 15) % (gasWidth - 10));
      const my = cylY + 15 + ((i * 11 + Math.cos(i * 1.7) * 20) % (cylH - 30));
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Piston
    const pistonGrad = ctx.createLinearGradient(pistonX, cylY, pistonX + 16, cylY);
    pistonGrad.addColorStop(0, '#94a3b8');
    pistonGrad.addColorStop(0.5, '#cbd5e1');
    pistonGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = pistonGrad;
    ctx.fillRect(pistonX, cylY + 3, 16, cylH - 6);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(pistonX, cylY + 3, 16, cylH - 6);

    // Handle
    ctx.fillStyle = '#64748b';
    ctx.fillRect(pistonX + 16, cylY + cylH / 2 - 8, 60, 16);
    ctx.beginPath();
    ctx.arc(pistonX + 76, cylY + cylH / 2, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.stroke();

    // Pressure arrow
    if (pressure > 10) {
      const arrowLen = Math.min(pressure / 5, 50);
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pistonX + 90, cylY + cylH / 2);
      ctx.lineTo(pistonX + 90 - arrowLen, cylY + cylH / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pistonX + 90 - arrowLen, cylY + cylH / 2);
      ctx.lineTo(pistonX + 90 - arrowLen + 8, cylY + cylH / 2 - 5);
      ctx.lineTo(pistonX + 90 - arrowLen + 8, cylY + cylH / 2 + 5);
      ctx.fill();
    }

    // Labels
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(`P = ${pressure.toFixed(1)} kPa`, W / 2, cylY + cylH + 45);
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 18px Outfit';
    ctx.fillText(`V = ${volume.toFixed(1)} L`, cylX + 10 + gasWidth / 2, cylY + cylH / 2 + 5);

    // PV = k display
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '13px Inter';
    ctx.fillText(`PV = ${k.toFixed(1)} kPa·L = constant`, W / 2, cylY + cylH + 70);

    // Temperature badge
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 55, 10, 110, 28, 14);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('🌡️ T = constant', W / 2, 29);
  }, [pressure, volume, k]);

  useEffect(() => { drawPiston(); }, [drawPiston]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); alert('Please sign in'); return; }
    await supabase.from('experiment_results').insert({
      user_id: user.id, experiment_name: "Boyle's Law",
      result_data: { pressure: pressure.toFixed(1), volume: volume.toFixed(1), pv: k.toFixed(1) },
    });
    setSaved(true); setSaving(false); setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { key: 'simulation', label: '⚡ Simulation' },
    { key: 'graph', label: '📊 Graphs' },
    { key: 'calculator', label: '🧮 Calculator' },
  ] as const;

  return (
    <div className="animate-fade-in">
      <div className="glass-card" style={{ display: 'flex', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '28px', padding: '4px' }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ flex: 1, padding: '14px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 600, background: activeTab === tab.key ? 'var(--gradient-primary)' : 'transparent', color: activeTab === tab.key ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.3s ease', fontFamily: "'Inter', sans-serif" }}>
            {tab.label}</button>
        ))}
      </div>

      {activeTab === 'simulation' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Gas Cylinder</h3>
            <div className="canvas-container"><canvas ref={canvasRef} width={480} height={330} style={{ width: '100%', height: 'auto' }} /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Controls</h3>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Volume (V)</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>{volume.toFixed(1)} L</span>
                </div>
                <input type="range" min={1} max={15} step={0.1} value={volume} onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  setPressure(parseFloat((k / v).toFixed(1)));
                }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Pressure (P)</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>{pressure.toFixed(1)} kPa</span>
                </div>
                <input type="range" min={30} max={500} step={1} value={pressure} onChange={(e) => {
                  const p = Number(e.target.value);
                  setPressure(p);
                  setVolume(parseFloat((k / p).toFixed(1)));
                }} />
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>P</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', fontFamily: "'Outfit', sans-serif" }}>{pressure.toFixed(1)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>kPa</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>V</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#06b6d4', fontFamily: "'Outfit', sans-serif" }}>{volume.toFixed(1)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>L</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>PV</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{k.toFixed(0)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>kPa·L</div>
                </div>
              </div>
            </div>
            <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ width: '100%', padding: '14px', opacity: saving ? 0.7 : 1 }}>
              {saved ? '✓ Saved!' : saving ? 'Saving...' : '💾 Save Result'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'graph' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>🎛️</span>
              <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)', margin: 0 }}>Adjust Values — Graphs update in real-time</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Volume</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#06b6d4' }}>{volume.toFixed(1)} L</span>
                </div>
                <input type="range" min={1} max={15} step={0.1} value={volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); setPressure(parseFloat((k / v).toFixed(1))); }} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Pressure</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444', fontFamily: "'Outfit', sans-serif" }}>{pressure.toFixed(0)} kPa</div>
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>PV</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{k.toFixed(0)}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Pressure vs Volume (Isothermal)</h3>
              <Graph data={pVsV} xLabel="Volume (L)" yLabel="Pressure (kPa)" title={`PV = ${k.toFixed(0)} kPa·L`} color="#ec4899" highlightX={volume} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📉 Hyperbolic curve: P ∝ 1/V at constant temperature (isothermal process).</p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>PV Product vs Volume</h3>
              <Graph data={pvProduct} xLabel="Volume (L)" yLabel="PV (kPa·L)" title="PV = constant" color="#8b5cf6" highlightX={volume} />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 PV remains constant at all volumes — confirming Boyle's Law.</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>P vs 1/V (Linear verification)</h3>
            <Graph data={pVs1V} xLabel="1/V (1/L)" yLabel="Pressure (kPa)" title="P = k/V → linear with 1/V" color="#f59e0b" highlightX={1 / volume} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 P vs 1/V is a straight line through the origin — confirming PV = constant.</p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator title="Boyle's Law Calculator" formula="P₁V₁ = P₂V₂" formulaDescription="Find unknown pressure or volume at constant temperature"
            variables={[
              { name: 'P1', label: 'Initial P', unit: 'kPa', color: '#ef4444' },
              { name: 'V1', label: 'Initial V', unit: 'L', color: '#06b6d4' },
              { name: 'P2', label: 'Final P', unit: 'kPa', color: '#f59e0b' },
              { name: 'V2', label: 'Final V', unit: 'L', color: '#8b5cf6' },
            ]}
            calculate={(vals) => {
              const P1 = vals.P1, V1 = vals.V1, P2 = vals.P2, V2 = vals.V2;
              const g = [P1, V1, P2, V2];
              const nc = g.filter(v => v === null).length;
              if (nc !== 1) throw new Error('Enter exactly 3 values');
              if (V2 === null && P1 !== null && V1 !== null && P2 !== null) {
                const r = (P1 * V1) / P2;
                return { results: { V2: r } as Record<string, number | string>, steps: [`Given: P₁=${P1}kPa, V₁=${V1}L, P₂=${P2}kPa`, `V₂ = P₁V₁/P₂ = ${P1}×${V1}/${P2}`, `V₂ = ${r.toFixed(4)} L`] };
              }
              if (P2 === null && P1 !== null && V1 !== null && V2 !== null) {
                const r = (P1 * V1) / V2;
                return { results: { P2: r } as Record<string, number | string>, steps: [`Given: P₁=${P1}kPa, V₁=${V1}L, V₂=${V2}L`, `P₂ = P₁V₁/V₂ = ${P1}×${V1}/${V2}`, `P₂ = ${r.toFixed(4)} kPa`] };
              }
              if (V1 === null && P1 !== null && P2 !== null && V2 !== null) {
                const r = (P2 * V2) / P1;
                return { results: { V1: r } as Record<string, number | string>, steps: [`Given: P₁=${P1}kPa, P₂=${P2}kPa, V₂=${V2}L`, `V₁ = P₂V₂/P₁ = ${P2}×${V2}/${P1}`, `V₁ = ${r.toFixed(4)} L`] };
              }
              if (P1 === null && V1 !== null && P2 !== null && V2 !== null) {
                const r = (P2 * V2) / V1;
                return { results: { P1: r } as Record<string, number | string>, steps: [`Given: V₁=${V1}L, P₂=${P2}kPa, V₂=${V2}L`, `P₁ = P₂V₂/V₁ = ${P2}×${V2}/${V1}`, `P₁ = ${r.toFixed(4)} kPa`] };
              }
              throw new Error('Invalid input');
            }}
          />
        </div>
      )}
    </div>
  );
}
