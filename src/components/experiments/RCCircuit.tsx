'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function RCCircuit() {
  const [resistance, setResistance] = useState(1000);
  const [capacitance, setCapacitance] = useState(100);
  const [voltage, setVoltage] = useState(9);
  const [time, setTime] = useState(0.15);
  const [mode, setMode] = useState<'charge' | 'discharge'>('charge');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  const capF = capacitance * 1e-6;
  const tau = resistance * capF;
  const vCap = mode === 'charge' ? voltage * (1 - Math.exp(-time / tau)) : voltage * Math.exp(-time / tau);
  const current = mode === 'charge' ? (voltage / resistance) * Math.exp(-time / tau) : -(voltage / resistance) * Math.exp(-time / tau);
  const energy = 0.5 * capF * vCap * vCap;

  const vVsT = useMemo(() => {
    const pts = [];
    const tMax = tau * 5;
    const step = tMax / 100;
    for (let t = 0; t <= tMax; t += step) {
      const v = mode === 'charge' ? voltage * (1 - Math.exp(-t / tau)) : voltage * Math.exp(-t / tau);
      pts.push({ x: parseFloat((t * 1000).toFixed(1)), y: v });
    }
    return pts;
  }, [voltage, tau, mode]);

  const iVsT = useMemo(() => {
    const pts = [];
    const tMax = tau * 5;
    const step = tMax / 100;
    for (let t = 0; t <= tMax; t += step) {
      const i = mode === 'charge' ? (voltage / resistance) * Math.exp(-t / tau) : (voltage / resistance) * Math.exp(-t / tau);
      pts.push({ x: parseFloat((t * 1000).toFixed(1)), y: i * 1000 });
    }
    return pts;
  }, [voltage, resistance, tau, mode]);

  const eVsT = useMemo(() => {
    const pts = [];
    const tMax = tau * 5;
    const step = tMax / 100;
    for (let t = 0; t <= tMax; t += step) {
      const v = mode === 'charge' ? voltage * (1 - Math.exp(-t / tau)) : voltage * Math.exp(-t / tau);
      pts.push({ x: parseFloat((t * 1000).toFixed(1)), y: 0.5 * capF * v * v * 1000 });
    }
    return pts;
  }, [voltage, capF, tau, mode]);

  const drawCircuit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    const cX = W / 2, cY = H / 2;

    // Battery
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(60, cY - 30); ctx.lineTo(60, cY + 30); ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(75, cY - 18); ctx.lineTo(75, cY + 18); ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${voltage}V`, 68, cY - 38);
    ctx.fillText('+', 83, cY - 22);
    ctx.fillText('−', 50, cY - 22);

    // Wires
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(75, cY - 30); ctx.lineTo(75, 40); ctx.lineTo(cX, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cX + 80, 40); ctx.lineTo(W - 60, 40); ctx.lineTo(W - 60, cY - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 60, cY + 30); ctx.lineTo(W - 60, H - 40); ctx.lineTo(75, H - 40); ctx.lineTo(75, cY + 30);
    ctx.stroke();

    // Resistor (zigzag)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cX, 40);
    const zigN = 6, zigW = 80 / zigN;
    for (let i = 0; i < zigN; i++) {
      ctx.lineTo(cX + i * zigW + zigW * 0.25, 28);
      ctx.lineTo(cX + i * zigW + zigW * 0.75, 52);
    }
    ctx.lineTo(cX + 80, 40);
    ctx.stroke();
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`R = ${resistance}Ω`, cX + 40, 70);

    // Capacitor
    const capX = W - 60, capGap = 10;
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(capX - 15, cY - capGap); ctx.lineTo(capX + 15, cY - capGap); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(capX - 15, cY + capGap); ctx.lineTo(capX + 15, cY + capGap); ctx.stroke();
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 12px Inter';
    ctx.fillText(`${capacitance}µF`, capX + 32, cY + 5);

    // Charge level bar
    const chargeFrac = vCap / voltage;
    const barW = 24, barH = 50;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(capX - barW / 2, cY - barH / 2 + 45, barW, barH);
    ctx.fillStyle = chargeFrac > 0.6 ? '#10b981' : chargeFrac > 0.3 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(capX - barW / 2, cY - barH / 2 + 45 + barH * (1 - chargeFrac), barW, barH * chargeFrac);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(capX - barW / 2, cY - barH / 2 + 45, barW, barH);

    // Current flow arrows
    const arrowColor = Math.abs(current) > 0.0001 ? '#ec4899' : '#334155';
    ctx.fillStyle = arrowColor; ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 1.5;
    const arrowY = 30;
    ctx.beginPath(); ctx.moveTo(cX - 20, arrowY); ctx.lineTo(cX - 12, arrowY - 5); ctx.lineTo(cX - 12, arrowY + 5); ctx.fill();

    // Values
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(`Vc = ${vCap.toFixed(2)} V`, cX, H - 65);
    ctx.fillStyle = '#ec4899';
    ctx.font = '13px Inter';
    ctx.fillText(`I = ${(Math.abs(current) * 1000).toFixed(2)} mA`, cX, H - 45);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '12px Inter';
    ctx.fillText(`τ = ${(tau * 1000).toFixed(1)} ms`, cX, H - 25);

    // Mode badge
    ctx.fillStyle = mode === 'charge' ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.roundRect(cX - 45, cY - 15, 90, 28, 14);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 13px Inter';
    ctx.fillText(mode === 'charge' ? '⚡ Charging' : '🔋 Discharging', cX, cY + 4);
  }, [voltage, resistance, capacitance, vCap, current, tau, mode]);

  useEffect(() => { drawCircuit(); }, [drawCircuit]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); alert('Please sign in'); return; }
    await supabase.from('experiment_results').insert({
      user_id: user.id, experiment_name: 'RC Circuit',
      result_data: { resistance, capacitance, voltage, time, mode, vCap: vCap.toFixed(3), tau: (tau * 1000).toFixed(1) },
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
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>RC Circuit</h3>
            <div className="canvas-container"><canvas ref={canvasRef} width={500} height={350} style={{ width: '100%', height: 'auto' }} /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Controls</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setMode('charge')} className={mode === 'charge' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '10px', fontSize: '13px' }}>⚡ Charge</button>
                <button onClick={() => setMode('discharge')} className={mode === 'discharge' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '10px', fontSize: '13px' }}>🔋 Discharge</button>
              </div>
              {[
                { label: 'Voltage', val: `${voltage} V`, color: '#f59e0b', min: 1, max: 24, step: 1, value: voltage, setter: setVoltage },
                { label: 'Resistance', val: `${resistance} Ω`, color: '#06b6d4', min: 100, max: 10000, step: 100, value: resistance, setter: setResistance },
                { label: 'Capacitance', val: `${capacitance} µF`, color: '#8b5cf6', min: 10, max: 1000, step: 10, value: capacitance, setter: setCapacitance },
                { label: 'Time', val: `${(time * 1000).toFixed(0)} ms`, color: '#ec4899', min: 0, max: tau * 5, step: tau * 5 / 200, value: time, setter: setTime },
              ].map((c, i) => (
                <div key={i} style={{ marginBottom: i < 3 ? '16px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{c.label}</label>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: c.color }}>{c.val}</span>
                  </div>
                  <input type="range" min={c.min} max={c.max} step={c.step} value={c.value} onChange={(e) => c.setter(Number(e.target.value))} />
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Vc</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{vCap.toFixed(2)}V</div>
                </div>
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>I</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ec4899', fontFamily: "'Outfit', sans-serif" }}>{(Math.abs(current) * 1000).toFixed(1)}mA</div>
                </div>
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>τ</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>{(tau * 1000).toFixed(1)}ms</div>
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
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button onClick={() => setMode('charge')} className={mode === 'charge' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '12px' }}>⚡ Charge</button>
              <button onClick={() => setMode('discharge')} className={mode === 'discharge' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '12px' }}>🔋 Discharge</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>R</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#06b6d4' }}>{resistance}Ω</span>
                </div>
                <input type="range" min={100} max={10000} step={100} value={resistance} onChange={(e) => setResistance(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>C</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6' }}>{capacitance}µF</span>
                </div>
                <input type="range" min={10} max={1000} step={10} value={capacitance} onChange={(e) => setCapacitance(Number(e.target.value))} />
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>τ = RC</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>{(tau * 1000).toFixed(1)} ms</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Capacitor Voltage vs Time</h3>
              <Graph data={vVsT} xLabel="Time (ms)" yLabel="Voltage (V)" title={mode === 'charge' ? 'Vc = V(1−e^(−t/τ))' : 'Vc = V·e^(−t/τ)'} color="#8b5cf6" highlightX={time * 1000} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>{mode === 'charge' ? '📈 Capacitor charges exponentially, reaching ~63% at t = τ and ~99% at t = 5τ.' : '📉 Capacitor discharges exponentially, dropping to ~37% at t = τ.'}</p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Current vs Time</h3>
              <Graph data={iVsT} xLabel="Time (ms)" yLabel="Current (mA)" title="I = (V/R)·e^(−t/τ)" color="#ec4899" highlightX={time * 1000} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📉 Current starts at V/R and decays exponentially as the capacitor charges.</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Energy Stored vs Time</h3>
            <Graph data={eVsT} xLabel="Time (ms)" yLabel="Energy (mJ)" title="E = ½CV²" color="#f59e0b" highlightX={time * 1000} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 Energy stored in the capacitor follows the voltage curve squared.</p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator title="Time Constant Calculator" formula="τ = R × C" formulaDescription="Calculate the RC time constant"
            variables={[
              { name: 'R', label: 'Resistance', unit: 'Ω', color: '#06b6d4' },
              { name: 'C', label: 'Capacitance', unit: 'µF', color: '#8b5cf6' },
            ]}
            calculate={(vals) => {
              const R = vals.R, C = vals.C;
              if (R !== null && C !== null) {
                const t = R * C * 1e-6;
                return { results: { tau: t * 1000 }, steps: [`Given: R = ${R} Ω, C = ${C} µF`, `τ = R × C = ${R} × ${C}×10⁻⁶`, `τ = ${(t * 1000).toFixed(4)} ms`, `Time to 63%: 1τ = ${(t * 1000).toFixed(1)} ms`, `Time to 99%: 5τ = ${(t * 5 * 1000).toFixed(1)} ms`] };
              }
              throw new Error('Enter both values');
            }}
          />
          <FormulaCalculator title="Capacitor Energy Calculator" formula="E = ½ × C × V²" formulaDescription="Calculate energy stored in capacitor"
            variables={[
              { name: 'C', label: 'Capacitance', unit: 'µF', color: '#8b5cf6' },
              { name: 'V', label: 'Voltage', unit: 'V', color: '#f59e0b' },
            ]}
            calculate={(vals) => {
              const C = vals.C, V = vals.V;
              if (C !== null && V !== null) {
                const E = 0.5 * C * 1e-6 * V * V;
                return { results: { E: E * 1000 }, steps: [`Given: C = ${C} µF, V = ${V} V`, `E = ½ × C × V²`, `E = 0.5 × ${C}×10⁻⁶ × ${V}²`, `E = ${(E * 1000).toFixed(6)} mJ`] };
              }
              throw new Error('Enter both values');
            }}
          />
        </div>
      )}
    </div>
  );
}
