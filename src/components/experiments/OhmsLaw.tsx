'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function OhmsLaw() {
  const [voltage, setVoltage] = useState(12);
  const [resistance, setResistance] = useState(4);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  const current = voltage / resistance;
  const power = voltage * current;

  // Graph data: V vs I for fixed R
  const viGraphData = useMemo(() => {
    const points = [];
    for (let v = 0; v <= 50; v += 1) {
      points.push({ x: v, y: v / resistance });
    }
    return points;
  }, [resistance]);

  // Graph data: R vs I for fixed V
  const riGraphData = useMemo(() => {
    const points = [];
    for (let r = 1; r <= 100; r += 1) {
      points.push({ x: r, y: voltage / r });
    }
    return points;
  }, [voltage]);

  // Power graph: V vs P for fixed R
  const vpGraphData = useMemo(() => {
    const points = [];
    for (let v = 0; v <= 50; v += 1) {
      points.push({ x: v, y: (v * v) / resistance });
    }
    return points;
  }, [resistance]);

  const drawCircuit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);

    const padding = 60;
    const left = padding;
    const right = w - padding;
    const top = padding + 20;
    const bottom = h - padding;
    const midX = w / 2;
    const midY = h / 2;

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath(); ctx.moveTo(left, bottom); ctx.lineTo(left, top); ctx.lineTo(midX - 50, top); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(midX + 50, top); ctx.lineTo(right, top); ctx.lineTo(right, midY - 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(right, midY + 30); ctx.lineTo(right, bottom); ctx.lineTo(left, bottom); ctx.stroke();

    // Battery
    const batteryY = midY;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(left - 15, batteryY - 20); ctx.lineTo(left + 15, batteryY - 20); ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(left - 10, batteryY + 20); ctx.lineTo(left + 10, batteryY + 20); ctx.stroke();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, batteryY - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, batteryY + 20); ctx.lineTo(left, bottom); ctx.stroke();

    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 14px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${voltage}V`, left - 30, midY + 5);

    // Resistor zigzag
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'; ctx.lineWidth = 3;
    const zigzagStart = midX - 50; const zigzagEnd = midX + 50;
    const segWidth = (zigzagEnd - zigzagStart) / 8;
    ctx.beginPath(); ctx.moveTo(zigzagStart, top);
    for (let i = 0; i < 8; i++) {
      ctx.lineTo(zigzagStart + (i + 0.5) * segWidth, top + (i % 2 === 0 ? -12 : 12));
    }
    ctx.lineTo(zigzagEnd, top); ctx.stroke();
    ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 14px Inter, sans-serif'; ctx.fillText(`${resistance}Ω`, midX, top - 22);

    // Ammeter
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(right, midY, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ec4899'; ctx.font = 'bold 13px Inter, sans-serif'; ctx.textBaseline = 'middle';
    ctx.fillText('A', right, midY);
    ctx.font = 'bold 14px Inter, sans-serif'; ctx.fillText(`${current.toFixed(2)}A`, right + 40, midY);

    // Animated current flow dots
    const time = Date.now() / 1000;
    const dotCount = Math.min(Math.max(Math.round(current * 2), 2), 12);
    const circuitPath = [
      { x: left, y: bottom }, { x: left, y: batteryY + 20 }, { x: left, y: batteryY - 20 },
      { x: left, y: top }, { x: midX - 50, y: top }, { x: midX + 50, y: top },
      { x: right, y: top }, { x: right, y: midY - 24 }, { x: right, y: midY + 24 },
      { x: right, y: bottom }, { x: left, y: bottom },
    ];
    for (let d = 0; d < dotCount; d++) {
      const t = ((time * 0.5 + d / dotCount) % 1);
      const totalSegments = circuitPath.length - 1;
      const segIndex = Math.floor(t * totalSegments);
      const segT = (t * totalSegments) - segIndex;
      const p1 = circuitPath[segIndex];
      const p2 = circuitPath[Math.min(segIndex + 1, circuitPath.length - 1)];
      const x = p1.x + (p2.x - p1.x) * segT;
      const y = p1.y + (p2.y - p1.y) * segT;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 92, 246, ${0.5 + current * 0.05})`; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)'; ctx.fill();
    }
  }, [voltage, resistance, current]);

  useEffect(() => {
    if (activeTab !== 'simulation') return;
    let animFrame: number;
    const animate = () => { drawCircuit(); animFrame = requestAnimationFrame(animate); };
    animate();
    return () => cancelAnimationFrame(animFrame);
  }, [drawCircuit, activeTab]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Please sign in to save results'); setSaving(false); return; }
    const { data: experiments } = await supabase.from('experiments').select('id').eq('slug', 'ohms-law').single();
    if (experiments) {
      await supabase.from('experiment_results').insert({
        user_id: user.id, experiment_id: experiments.id,
        input_params: { voltage, resistance },
        output_data: { current: parseFloat(current.toFixed(4)), power: parseFloat(power.toFixed(4)) },
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const tabs = [
    { key: 'simulation' as const, label: '⚡ Simulation', icon: '⚡' },
    { key: 'graph' as const, label: '📊 Graphs', icon: '📊' },
    { key: 'calculator' as const, label: '🧮 Calculator', icon: '🧮' },
  ];

  return (
    <div className="animate-slide-up">
      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '24px', padding: '4px',
        background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none',
            background: activeTab === tab.key ? 'var(--gradient-primary)' : 'transparent',
            color: activeTab === tab.key ? 'white' : 'var(--color-text-secondary)',
            transition: 'all 0.3s ease',
            fontFamily: "'Inter', sans-serif",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== SIMULATION TAB ========== */}
      {activeTab === 'simulation' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
              Circuit Diagram
            </h3>
            <div className="canvas-container">
              <canvas ref={canvasRef} width={500} height={350} style={{ width: '100%', height: 'auto' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Controls</h3>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Voltage (V)</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{voltage} V</span>
                </div>
                <input type="range" min={1} max={50} step={1} value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Resistance (Ω)</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>{resistance} Ω</span>
                </div>
                <input type="range" min={1} max={100} step={1} value={resistance} onChange={(e) => setResistance(Number(e.target.value))} />
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Current (I)</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#ec4899', fontFamily: "'Outfit', sans-serif" }}>{current.toFixed(3)} A</div>
                </div>
                <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Power (P)</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{power.toFixed(2)} W</div>
                </div>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>V = I × R → {voltage} = {current.toFixed(3)} × {resistance}</span>
              </div>
            </div>

            <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ width: '100%', padding: '14px', opacity: saving ? 0.7 : 1 }}>
              {saved ? '✓ Result Saved!' : saving ? 'Saving...' : '💾 Save Result to Dashboard'}
            </button>
          </div>
        </div>
      )}

      {/* ========== GRAPH TAB ========== */}
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
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Voltage</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{voltage} V</span>
                </div>
                <input type="range" min={1} max={50} step={1} value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Resistance</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#06b6d4' }}>{resistance} Ω</span>
                </div>
                <input type="range" min={1} max={100} step={1} value={resistance} onChange={(e) => setResistance(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Current</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#ec4899', fontFamily: "'Outfit', sans-serif" }}>{current.toFixed(2)} A</div>
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Power</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{power.toFixed(1)} W</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
                V–I Characteristic (R = {resistance}Ω)
              </h3>
              <Graph data={viGraphData} xLabel="Voltage (V)" yLabel="Current (A)" title={`I = V / ${resistance}Ω`} color="#ec4899" highlightX={voltage} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
                📈 Linear relationship: As voltage increases, current increases proportionally for a fixed resistance.
              </p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
                R–I Characteristic (V = {voltage}V)
              </h3>
              <Graph data={riGraphData} xLabel="Resistance (Ω)" yLabel="Current (A)" title={`I = ${voltage}V / R`} color="#06b6d4" highlightX={resistance} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
                📉 Inverse relationship: As resistance increases, current decreases (hyperbolic curve).
              </p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
              V–P Characteristic (R = {resistance}Ω)
            </h3>
            <Graph data={vpGraphData} xLabel="Voltage (V)" yLabel="Power (W)" title={`P = V² / ${resistance}Ω`} color="#f59e0b" highlightX={voltage} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
              📈 Quadratic relationship: Power increases as the square of voltage — P = V²/R.
            </p>
          </div>
        </div>
      )}

      {/* ========== CALCULATOR TAB ========== */}
      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator
            title="Ohm's Law Calculator"
            formula="V = I × R"
            formulaDescription="Enter any two values to calculate the third"
            variables={[
              { name: 'V', label: 'Voltage', unit: 'V', color: '#f59e0b' },
              { name: 'I', label: 'Current', unit: 'A', color: '#ec4899' },
              { name: 'R', label: 'Resistance', unit: 'Ω', color: '#06b6d4' },
            ]}
            calculate={(vals) => {
              const V = vals.V, I = vals.I, R = vals.R;
              if (V !== null && I !== null && R === null) {
                return { results: { R: V / I }, steps: [`Given: V = ${V}V, I = ${I}A`, `Using V = I × R → R = V / I`, `R = ${V} / ${I} = ${(V / I).toFixed(4)} Ω`] };
              } else if (V !== null && R !== null && I === null) {
                return { results: { I: V / R }, steps: [`Given: V = ${V}V, R = ${R}Ω`, `Using V = I × R → I = V / R`, `I = ${V} / ${R} = ${(V / R).toFixed(4)} A`] };
              } else if (I !== null && R !== null && V === null) {
                return { results: { V: I * R }, steps: [`Given: I = ${I}A, R = ${R}Ω`, `Using V = I × R`, `V = ${I} × ${R} = ${(I * R).toFixed(4)} V`] };
              } else if (V !== null && I !== null && R !== null) {
                const calcR = V / I;
                return { results: { R: calcR }, steps: [`Given: V = ${V}V, I = ${I}A, R = ${R}Ω`, `Verification: V/I = ${V}/${I} = ${calcR.toFixed(4)} Ω`, calcR.toFixed(2) === R.toFixed(2) ? '✅ Values are consistent!' : `⚠️ Mismatch: calculated R (${calcR.toFixed(4)}Ω) ≠ given R (${R}Ω)`] };
              }
              throw new Error('Enter at least two values');
            }}
          />

          <FormulaCalculator
            title="Power Calculator"
            formula="P = V × I = V²/R = I²×R"
            formulaDescription="Calculate electrical power from voltage, current, or resistance"
            variables={[
              { name: 'V', label: 'Voltage', unit: 'V', color: '#f59e0b' },
              { name: 'I', label: 'Current', unit: 'A', color: '#ec4899' },
              { name: 'R', label: 'Resistance', unit: 'Ω', color: '#06b6d4' },
            ]}
            calculate={(vals) => {
              const V = vals.V, I = vals.I, R = vals.R;
              if (V !== null && I !== null) {
                const P = V * I;
                return { results: { P }, steps: [`Given: V = ${V}V, I = ${I}A`, `P = V × I = ${V} × ${I}`, `P = ${P.toFixed(4)} W`] };
              } else if (V !== null && R !== null) {
                const P = (V * V) / R;
                return { results: { P }, steps: [`Given: V = ${V}V, R = ${R}Ω`, `P = V² / R = ${V}² / ${R}`, `P = ${P.toFixed(4)} W`] };
              } else if (I !== null && R !== null) {
                const P = I * I * R;
                return { results: { P }, steps: [`Given: I = ${I}A, R = ${R}Ω`, `P = I² × R = ${I}² × ${R}`, `P = ${P.toFixed(4)} W`] };
              }
              throw new Error('Enter at least two values');
            }}
          />
        </div>
      )}
    </div>
  );
}
