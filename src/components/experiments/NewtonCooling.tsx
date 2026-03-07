'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function NewtonCooling() {
  const [initialTemp, setInitialTemp] = useState(95);
  const [ambientTemp, setAmbientTemp] = useState(25);
  const [coolingConstant, setCoolingConstant] = useState(0.05);
  const [time, setTime] = useState(30);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  const currentTemp = ambientTemp + (initialTemp - ambientTemp) * Math.exp(-coolingConstant * time);
  const coolingRate = -coolingConstant * (currentTemp - ambientTemp);

  const tempVsTime = useMemo(() => {
    const pts = [];
    for (let t = 0; t <= 120; t += 1) {
      pts.push({ x: t, y: ambientTemp + (initialTemp - ambientTemp) * Math.exp(-coolingConstant * t) });
    }
    return pts;
  }, [initialTemp, ambientTemp, coolingConstant]);

  const rateVsTime = useMemo(() => {
    const pts = [];
    for (let t = 0; t <= 120; t += 1) {
      const T = ambientTemp + (initialTemp - ambientTemp) * Math.exp(-coolingConstant * t);
      pts.push({ x: t, y: Math.abs(coolingConstant * (T - ambientTemp)) });
    }
    return pts;
  }, [initialTemp, ambientTemp, coolingConstant]);

  const tempVsK = useMemo(() => {
    const pts = [];
    for (let k = 0.01; k <= 0.2; k += 0.005) {
      pts.push({ x: parseFloat(k.toFixed(3)), y: ambientTemp + (initialTemp - ambientTemp) * Math.exp(-k * time) });
    }
    return pts;
  }, [initialTemp, ambientTemp, time]);

  const drawSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    // Thermometer
    const thX = 100, thY = 50, thW = 30, thH = 200;
    const bulbR = 22;
    const tempFraction = (currentTemp - ambientTemp) / (initialTemp - ambientTemp);
    const fillHeight = Math.max(10, tempFraction * (thH - 20));

    // Tube
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(thX, thY, thW, thH, 15);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mercury
    const mercuryGrad = ctx.createLinearGradient(thX, thY + thH - fillHeight, thX, thY + thH);
    mercuryGrad.addColorStop(0, currentTemp > 60 ? '#ef4444' : currentTemp > 40 ? '#f59e0b' : '#06b6d4');
    mercuryGrad.addColorStop(1, currentTemp > 60 ? '#dc2626' : currentTemp > 40 ? '#d97706' : '#0891b2');
    ctx.fillStyle = mercuryGrad;
    ctx.beginPath();
    ctx.roundRect(thX + 6, thY + thH - fillHeight, thW - 12, fillHeight, 8);
    ctx.fill();

    // Bulb
    ctx.beginPath();
    ctx.arc(thX + thW / 2, thY + thH + bulbR - 5, bulbR, 0, Math.PI * 2);
    ctx.fillStyle = mercuryGrad;
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Temperature marks
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 4; i++) {
      const markY = thY + thH - (i / 4) * (thH - 20);
      const markTemp = ambientTemp + (i / 4) * (initialTemp - ambientTemp);
      ctx.fillText(`${markTemp.toFixed(0)}°`, thX + thW + 8, markY + 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(thX + thW, markY);
      ctx.lineTo(thX + thW + 5, markY);
      ctx.stroke();
    }

    // Cup with liquid
    const cupX = 220, cupY = 120, cupW = 120, cupH = 160;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(cupX, cupY);
    ctx.lineTo(cupX + 10, cupY + cupH);
    ctx.lineTo(cupX + cupW - 10, cupY + cupH);
    ctx.lineTo(cupX + cupW, cupY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Liquid inside
    const liquidHeight = cupH * 0.75;
    const liqGrad = ctx.createLinearGradient(cupX, cupY + cupH - liquidHeight, cupX, cupY + cupH);
    liqGrad.addColorStop(0, currentTemp > 70 ? 'rgba(239,68,68,0.4)' : currentTemp > 50 ? 'rgba(245,158,11,0.4)' : 'rgba(6,182,212,0.4)');
    liqGrad.addColorStop(1, currentTemp > 70 ? 'rgba(239,68,68,0.6)' : currentTemp > 50 ? 'rgba(245,158,11,0.6)' : 'rgba(6,182,212,0.6)');
    ctx.fillStyle = liqGrad;
    const inset = 8;
    ctx.beginPath();
    ctx.moveTo(cupX + inset, cupY + cupH - liquidHeight);
    ctx.lineTo(cupX + 10 + (inset / cupH) * 10, cupY + cupH);
    ctx.lineTo(cupX + cupW - 10 - (inset / cupH) * 10, cupY + cupH);
    ctx.lineTo(cupX + cupW - inset, cupY + cupH - liquidHeight);
    ctx.closePath();
    ctx.fill();

    // Steam particles (if hot)
    if (currentTemp > 50) {
      const steamCount = Math.floor((currentTemp - 50) / 10);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (let i = 0; i < steamCount; i++) {
        const sx = cupX + 30 + Math.sin(Date.now() / (500 + i * 200) + i) * 20;
        const sy = cupY - 10 - i * 12 + Math.sin(Date.now() / (800 + i * 100)) * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, 4 + i, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Temperature readout
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentTemp.toFixed(1)}°C`, cupX + cupW / 2, cupY - 20);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter';
    ctx.fillText(`Ambient: ${ambientTemp}°C`, cupX + cupW / 2, cupY + cupH + 25);

    // Time display
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(`t = ${time} min`, W - 30, 35);
    ctx.fillStyle = '#06b6d4';
    ctx.font = '12px Inter';
    ctx.fillText(`k = ${coolingConstant} /min`, W - 30, 55);

    // Cooling rate
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(`dT/dt = ${coolingRate.toFixed(2)} °C/min`, W - 30, 80);
  }, [currentTemp, initialTemp, ambientTemp, time, coolingConstant, coolingRate]);

  useEffect(() => { drawSimulation(); }, [drawSimulation]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); alert('Please sign in to save results'); return; }
    await supabase.from('experiment_results').insert({
      user_id: user.id, experiment_name: "Newton's Cooling",
      result_data: { initialTemp, ambientTemp, coolingConstant, time, currentTemp: currentTemp.toFixed(2) },
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
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Cooling Visualization</h3>
            <div className="canvas-container"><canvas ref={canvasRef} width={420} height={320} style={{ width: '100%', height: 'auto' }} /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Controls</h3>
              {[
                { label: 'Initial Temp', val: `${initialTemp}°C`, color: '#ef4444', min: 40, max: 100, step: 1, value: initialTemp, setter: setInitialTemp },
                { label: 'Ambient Temp', val: `${ambientTemp}°C`, color: '#06b6d4', min: 10, max: 35, step: 1, value: ambientTemp, setter: setAmbientTemp },
                { label: 'Cooling Constant (k)', val: `${coolingConstant} /min`, color: '#8b5cf6', min: 0.01, max: 0.2, step: 0.005, value: coolingConstant, setter: setCoolingConstant },
                { label: 'Time', val: `${time} min`, color: '#f59e0b', min: 0, max: 120, step: 1, value: time, setter: setTime },
              ].map((c, i) => (
                <div key={i} style={{ marginBottom: i < 3 ? '18px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{c.label}</label>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: c.color }}>{c.val}</span>
                  </div>
                  <input type="range" min={c.min} max={c.max} step={c.step} value={c.value} onChange={(e) => c.setter(Number(e.target.value))} />
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: `${currentTemp > 60 ? 'rgba(239,68,68,0.08)' : currentTemp > 40 ? 'rgba(245,158,11,0.08)' : 'rgba(6,182,212,0.08)'}`, border: `1px solid ${currentTemp > 60 ? 'rgba(239,68,68,0.15)' : currentTemp > 40 ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.15)'}` }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Current Temp</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: currentTemp > 60 ? '#ef4444' : currentTemp > 40 ? '#f59e0b' : '#06b6d4', fontFamily: "'Outfit', sans-serif" }}>{currentTemp.toFixed(1)}°C</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Cooling Rate</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{coolingRate.toFixed(2)} °C/min</div>
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
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>🎛️</span>
              <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)', margin: 0 }}>Adjust Values — Graphs update in real-time</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Initial Temp</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>{initialTemp}°C</span>
                </div>
                <input type="range" min={40} max={100} step={1} value={initialTemp} onChange={(e) => setInitialTemp(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>k</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6' }}>{coolingConstant}</span>
                </div>
                <input type="range" min={0.01} max={0.2} step={0.005} value={coolingConstant} onChange={(e) => setCoolingConstant(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Time</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{time} min</span>
                </div>
                <input type="range" min={0} max={120} step={1} value={time} onChange={(e) => setTime(Number(e.target.value))} />
              </div>
              <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: `${currentTemp > 60 ? 'rgba(239,68,68,0.08)' : 'rgba(6,182,212,0.08)'}`, textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Temp at t</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: currentTemp > 60 ? '#ef4444' : '#06b6d4', fontFamily: "'Outfit', sans-serif" }}>{currentTemp.toFixed(1)}°C</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Temperature vs Time</h3>
              <Graph data={tempVsTime} xLabel="Time (min)" yLabel="Temperature (°C)" title={`T = ${ambientTemp} + ${initialTemp - ambientTemp}·e^(−${coolingConstant}t)`} color="#ef4444" highlightX={time} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 Exponential decay: Temperature drops rapidly at first, then approaches ambient temperature asymptotically.</p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Cooling Rate vs Time</h3>
              <Graph data={rateVsTime} xLabel="Time (min)" yLabel="|dT/dt| (°C/min)" title="Rate of cooling" color="#8b5cf6" highlightX={time} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📉 Cooling rate is highest initially and decreases exponentially as the object approaches ambient temperature.</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Temperature vs Cooling Constant (t={time} min)</h3>
            <Graph data={tempVsK} xLabel="Cooling Constant k (/min)" yLabel="Temperature (°C)" title="Effect of k on cooling" color="#06b6d4" highlightX={coolingConstant} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📉 Higher k → faster cooling. Materials with high thermal conductivity cool quicker.</p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator title="Newton's Cooling Calculator" formula="T(t) = Tₐ + (T₀ − Tₐ)·e^(−kt)" formulaDescription="Calculate temperature at a given time"
            variables={[
              { name: 'T0', label: 'Initial Temp', unit: '°C', color: '#ef4444' },
              { name: 'Ta', label: 'Ambient Temp', unit: '°C', color: '#06b6d4' },
              { name: 'k', label: 'Cooling Const', unit: '/min', color: '#8b5cf6' },
              { name: 't', label: 'Time', unit: 'min', color: '#f59e0b' },
            ]}
            calculate={(vals) => {
              const T0 = vals.T0, Ta = vals.Ta, k = vals.k, t = vals.t;
              if (T0 !== null && Ta !== null && k !== null && t !== null) {
                const T = Ta + (T0 - Ta) * Math.exp(-k * t);
                return { results: { T }, steps: [`Given: T₀ = ${T0}°C, Tₐ = ${Ta}°C, k = ${k}/min, t = ${t} min`, `T(t) = Tₐ + (T₀ − Tₐ)·e^(−kt)`, `T = ${Ta} + (${T0} − ${Ta})·e^(−${k}×${t})`, `T = ${Ta} + ${T0 - Ta}·e^(−${(k * t).toFixed(4)})`, `T = ${Ta} + ${T0 - Ta} × ${Math.exp(-k * t).toFixed(6)}`, `T = ${T.toFixed(4)} °C`] };
              }
              throw new Error('Enter all four values');
            }}
          />
        </div>
      )}
    </div>
  );
}
