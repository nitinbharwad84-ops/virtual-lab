'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function HookesLaw() {
  const [springConstant, setSpringConstant] = useState(50);
  const [displacement, setDisplacement] = useState(0.15);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  const force = springConstant * displacement;
  const potentialEnergy = 0.5 * springConstant * displacement * displacement;

  const fVsX = useMemo(() => {
    const pts = [];
    for (let x = 0; x <= 0.5; x += 0.01) pts.push({ x: parseFloat(x.toFixed(2)), y: springConstant * x });
    return pts;
  }, [springConstant]);

  const fVsK = useMemo(() => {
    const pts = [];
    for (let k = 1; k <= 200; k += 2) pts.push({ x: k, y: k * displacement });
    return pts;
  }, [displacement]);

  const peVsX = useMemo(() => {
    const pts = [];
    for (let x = 0; x <= 0.5; x += 0.01) pts.push({ x: parseFloat(x.toFixed(2)), y: 0.5 * springConstant * x * x });
    return pts;
  }, [springConstant]);

  const drawSpring = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    // Wall
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 60, 20, H - 120);
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 80 + i * 25);
      ctx.lineTo(20, 95 + i * 25);
      ctx.stroke();
    }

    const restLength = 180;
    const stretchPixels = displacement * 600;
    const springEnd = 20 + restLength + stretchPixels;
    const midY = H / 2;

    // Spring coils
    const coils = 12;
    const coilWidth = (springEnd - 20) / coils;
    ctx.strokeStyle = displacement > 0.3 ? '#ef4444' : displacement > 0.15 ? '#f59e0b' : '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, midY);
    for (let i = 0; i < coils; i++) {
      const x1 = 20 + i * coilWidth + coilWidth * 0.25;
      const x2 = 20 + i * coilWidth + coilWidth * 0.75;
      ctx.lineTo(x1, midY - 20);
      ctx.lineTo(x2, midY + 20);
    }
    ctx.lineTo(springEnd, midY);
    ctx.stroke();

    // Mass block
    const blockW = 60, blockH = 80;
    const gradient = ctx.createLinearGradient(springEnd, midY - blockH / 2, springEnd + blockW, midY + blockH / 2);
    gradient.addColorStop(0, '#8b5cf6');
    gradient.addColorStop(1, '#6d28d9');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(springEnd, midY - blockH / 2, blockW, blockH, 8);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('M', springEnd + blockW / 2, midY + 5);

    // Force arrow
    if (displacement > 0.01) {
      const arrowLen = Math.min(force * 2, 120);
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(springEnd + blockW + 10, midY);
      ctx.lineTo(springEnd + blockW + 10 - arrowLen, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(springEnd + blockW + 10 - arrowLen - 8, midY);
      ctx.lineTo(springEnd + blockW + 10 - arrowLen + 4, midY - 6);
      ctx.lineTo(springEnd + blockW + 10 - arrowLen + 4, midY + 6);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`F = ${force.toFixed(1)} N`, springEnd + blockW + 10 - arrowLen / 2, midY - 14);
    }

    // Displacement markers
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20 + restLength, 40);
    ctx.lineTo(20 + restLength, H - 40);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Natural length', 20 + restLength, 35);

    if (displacement > 0.01) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px Inter';
      ctx.fillText(`x = ${(displacement * 100).toFixed(0)} cm`, (20 + restLength + springEnd) / 2, H - 30);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(20 + restLength, H - 45);
      ctx.lineTo(springEnd, H - 45);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Ground
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, midY + blockH / 2 + 10);
    ctx.lineTo(W, midY + blockH / 2 + 10);
    ctx.stroke();
  }, [displacement, force, springConstant]);

  useEffect(() => { drawSpring(); }, [drawSpring]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); alert('Please sign in to save results'); return; }
    await supabase.from('experiment_results').insert({
      user_id: user.id,
      experiment_name: "Hooke's Law",
      result_data: { springConstant, displacement, force: force.toFixed(3), potentialEnergy: potentialEnergy.toFixed(4) },
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
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
            style={{
              flex: 1, padding: '14px', border: 'none', cursor: 'pointer',
              borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 600,
              background: activeTab === tab.key ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--color-text-secondary)',
              transition: 'all 0.3s ease', fontFamily: "'Inter', sans-serif",
            }}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'simulation' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Spring Simulation</h3>
            <div className="canvas-container"><canvas ref={canvasRef} width={500} height={320} style={{ width: '100%', height: 'auto' }} /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Controls</h3>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Spring Constant (k)</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>{springConstant} N/m</span>
                </div>
                <input type="range" min={5} max={200} step={5} value={springConstant} onChange={(e) => setSpringConstant(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Displacement (x)</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{(displacement * 100).toFixed(0)} cm</span>
                </div>
                <input type="range" min={0} max={0.5} step={0.01} value={displacement} onChange={(e) => setDisplacement(Number(e.target.value))} />
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Restoring Force</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', fontFamily: "'Outfit', sans-serif" }}>{force.toFixed(2)} N</div>
                </div>
                <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Elastic PE</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{potentialEnergy.toFixed(4)} J</div>
                </div>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>F = kx = {springConstant} × {displacement.toFixed(2)} = {force.toFixed(2)} N</span>
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
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>🎛️</span>
              <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)', margin: 0 }}>Adjust Values — Graphs update in real-time</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Spring Constant</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#06b6d4' }}>{springConstant} N/m</span>
                </div>
                <input type="range" min={5} max={200} step={5} value={springConstant} onChange={(e) => setSpringConstant(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Displacement</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{(displacement * 100).toFixed(0)} cm</span>
                </div>
                <input type="range" min={0} max={0.5} step={0.01} value={displacement} onChange={(e) => setDisplacement(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Force</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444', fontFamily: "'Outfit', sans-serif" }}>{force.toFixed(1)} N</div>
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>PE</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{potentialEnergy.toFixed(3)} J</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Force vs Displacement (k={springConstant} N/m)</h3>
              <Graph data={fVsX} xLabel="Displacement x (m)" yLabel="Force F (N)" title={`F = ${springConstant}x`} color="#ec4899" highlightX={displacement} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 Linear relationship: Force is directly proportional to displacement.</p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Force vs Spring Constant (x={displacement.toFixed(2)} m)</h3>
              <Graph data={fVsK} xLabel="Spring Constant k (N/m)" yLabel="Force F (N)" title={`F = k × ${displacement.toFixed(2)}`} color="#06b6d4" highlightX={springConstant} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 Stiffer spring → greater force for the same displacement.</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Elastic PE vs Displacement (k={springConstant} N/m)</h3>
            <Graph data={peVsX} xLabel="Displacement x (m)" yLabel="PE (J)" title={`PE = ½×${springConstant}×x²`} color="#f59e0b" highlightX={displacement} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 Quadratic: PE grows as x² — area under the F-x graph.</p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator title="Hooke's Law Calculator" formula="F = k × x" formulaDescription="Calculate force, spring constant, or displacement"
            variables={[
              { name: 'F', label: 'Force', unit: 'N', color: '#ef4444' },
              { name: 'k', label: 'Spring Constant', unit: 'N/m', color: '#06b6d4' },
              { name: 'x', label: 'Displacement', unit: 'm', color: '#f59e0b' },
            ]}
            calculate={(vals) => {
              const F = vals.F, k = vals.k, x = vals.x;
              if (k !== null && x !== null) return { results: { F: k * x }, steps: [`Given: k = ${k} N/m, x = ${x} m`, `F = k × x = ${k} × ${x}`, `F = ${(k * x).toFixed(4)} N`] };
              if (F !== null && x !== null) return { results: { k: F / x }, steps: [`Given: F = ${F} N, x = ${x} m`, `k = F / x = ${F} / ${x}`, `k = ${(F / x).toFixed(4)} N/m`] };
              if (F !== null && k !== null) return { results: { x: F / k }, steps: [`Given: F = ${F} N, k = ${k} N/m`, `x = F / k = ${F} / ${k}`, `x = ${(F / k).toFixed(4)} m`] };
              throw new Error('Enter at least two values');
            }}
          />
          <FormulaCalculator title="Elastic PE Calculator" formula="PE = ½ × k × x²" formulaDescription="Calculate elastic potential energy"
            variables={[
              { name: 'k', label: 'Spring Constant', unit: 'N/m', color: '#06b6d4' },
              { name: 'x', label: 'Displacement', unit: 'm', color: '#f59e0b' },
            ]}
            calculate={(vals) => {
              const k = vals.k, x = vals.x;
              if (k !== null && x !== null) {
                const pe = 0.5 * k * x * x;
                return { results: { PE: pe }, steps: [`Given: k = ${k} N/m, x = ${x} m`, `PE = ½ × k × x²`, `PE = 0.5 × ${k} × ${x}² = 0.5 × ${k} × ${(x * x).toFixed(6)}`, `PE = ${pe.toFixed(6)} J`] };
              }
              throw new Error('Enter both values');
            }}
          />
        </div>
      )}
    </div>
  );
}
