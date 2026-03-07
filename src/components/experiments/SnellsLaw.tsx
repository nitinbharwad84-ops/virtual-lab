'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function SnellsLaw() {
  const [angle1, setAngle1] = useState(45);
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.5);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  const rad1 = angle1 * Math.PI / 180;
  const sinAngle2 = (n1 * Math.sin(rad1)) / n2;
  const isTotalReflection = Math.abs(sinAngle2) > 1;
  const angle2 = isTotalReflection ? 90 : Math.asin(sinAngle2) * 180 / Math.PI;
  const criticalAngle = n1 < n2 ? null : Math.asin(n2 / n1) * 180 / Math.PI;

  const angle2VsAngle1 = useMemo(() => {
    const pts = [];
    for (let a = 0; a <= 89; a += 1) {
      const s = (n1 * Math.sin(a * Math.PI / 180)) / n2;
      if (Math.abs(s) <= 1) pts.push({ x: a, y: Math.asin(s) * 180 / Math.PI });
    }
    return pts;
  }, [n1, n2]);

  const angle2VsN2 = useMemo(() => {
    const pts = [];
    for (let n = 1.0; n <= 3.0; n += 0.05) {
      const s = (n1 * Math.sin(rad1)) / n;
      if (Math.abs(s) <= 1) pts.push({ x: parseFloat(n.toFixed(2)), y: Math.asin(s) * 180 / Math.PI });
    }
    return pts;
  }, [n1, rad1]);

  const deviationVsAngle = useMemo(() => {
    const pts = [];
    for (let a = 1; a <= 89; a += 1) {
      const s = (n1 * Math.sin(a * Math.PI / 180)) / n2;
      if (Math.abs(s) <= 1) {
        const a2 = Math.asin(s) * 180 / Math.PI;
        pts.push({ x: a, y: Math.abs(a - a2) });
      }
    }
    return pts;
  }, [n1, n2]);

  const drawRefraction = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const midX = W / 2, midY = H / 2;

    // Medium 1 (top)
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fillRect(0, 0, W, midY);
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 13px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Medium 1: n₁ = ${n1.toFixed(2)}`, 15, 25);

    // Medium 2 (bottom)
    ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
    ctx.fillRect(0, midY, W, midY);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText(`Medium 2: n₂ = ${n2.toFixed(2)}`, 15, midY + 25);

    // Interface line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();

    // Normal (dashed)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(midX, 10); ctx.lineTo(midX, H - 10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Normal', midX + 30, 20);

    // Incident ray
    const rayLen = 180;
    const incidentEndX = midX - rayLen * Math.sin(rad1);
    const incidentEndY = midY - rayLen * Math.cos(rad1);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(incidentEndX, incidentEndY); ctx.lineTo(midX, midY); ctx.stroke();

    // Arrow on incident ray
    const arrowAngle = Math.atan2(midY - incidentEndY, midX - incidentEndX);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(midX - 40 * Math.cos(arrowAngle), midY - 40 * Math.sin(arrowAngle));
    ctx.lineTo(midX - 40 * Math.cos(arrowAngle) - 10 * Math.cos(arrowAngle - 0.4), midY - 40 * Math.sin(arrowAngle) - 10 * Math.sin(arrowAngle - 0.4));
    ctx.lineTo(midX - 40 * Math.cos(arrowAngle) - 10 * Math.cos(arrowAngle + 0.4), midY - 40 * Math.sin(arrowAngle) - 10 * Math.sin(arrowAngle + 0.4));
    ctx.fill();

    // Refracted or reflected ray
    if (isTotalReflection) {
      // Reflected ray
      const reflectedEndX = midX + rayLen * Math.sin(rad1);
      const reflectedEndY = midY - rayLen * Math.cos(rad1);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(reflectedEndX, reflectedEndY); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('TOTAL INTERNAL REFLECTION', midX, H - 30);
    } else {
      const rad2 = angle2 * Math.PI / 180;
      const refractedEndX = midX + rayLen * Math.sin(rad2);
      const refractedEndY = midY + rayLen * Math.cos(rad2);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(refractedEndX, refractedEndY); ctx.stroke();
    }

    // Angle arcs
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(midX, midY, 40, -Math.PI / 2, -Math.PI / 2 + rad1, false);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`θ₁ = ${angle1}°`, midX - 70, midY - 45);

    if (!isTotalReflection) {
      const rad2 = angle2 * Math.PI / 180;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(midX, midY, 40, Math.PI / 2 - rad2, Math.PI / 2, false);
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.fillText(`θ₂ = ${angle2.toFixed(1)}°`, midX + 50, midY + 55);
    }
  }, [angle1, n1, n2, rad1, angle2, isTotalReflection]);

  useEffect(() => { drawRefraction(); }, [drawRefraction]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); alert('Please sign in'); return; }
    await supabase.from('experiment_results').insert({
      user_id: user.id, experiment_name: "Snell's Law",
      result_data: { angle1, n1, n2, angle2: angle2.toFixed(2), isTotalReflection, criticalAngle: criticalAngle?.toFixed(2) },
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
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Refraction Simulation</h3>
            <div className="canvas-container"><canvas ref={canvasRef} width={460} height={380} style={{ width: '100%', height: 'auto' }} /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Controls</h3>
              {[
                { label: 'Angle of Incidence (θ₁)', val: `${angle1}°`, color: '#f59e0b', min: 0, max: 89, step: 1, value: angle1, setter: setAngle1 },
                { label: 'Refractive Index n₁', val: n1.toFixed(2), color: '#06b6d4', min: 1.0, max: 2.5, step: 0.05, value: n1, setter: setN1 },
                { label: 'Refractive Index n₂', val: n2.toFixed(2), color: '#8b5cf6', min: 1.0, max: 2.5, step: 0.05, value: n2, setter: setN2 },
              ].map((c, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? '20px' : 0 }}>
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
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: isTotalReflection ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${isTotalReflection ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}` }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Angle of Refraction</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: isTotalReflection ? '#ef4444' : '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                    {isTotalReflection ? 'TIR!' : `${angle2.toFixed(1)}°`}
                  </div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Critical Angle</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>
                    {criticalAngle ? `${criticalAngle.toFixed(1)}°` : 'N/A'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {n1.toFixed(2)}·sin({angle1}°) = {n2.toFixed(2)}·sin({isTotalReflection ? '?' : angle2.toFixed(1)}°)
                </span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>θ₁</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{angle1}°</span>
                </div>
                <input type="range" min={0} max={89} step={1} value={angle1} onChange={(e) => setAngle1(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>n₁</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#06b6d4' }}>{n1.toFixed(2)}</span>
                </div>
                <input type="range" min={1.0} max={2.5} step={0.05} value={n1} onChange={(e) => setN1(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>n₂</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6' }}>{n2.toFixed(2)}</span>
                </div>
                <input type="range" min={1.0} max={2.5} step={0.05} value={n2} onChange={(e) => setN2(Number(e.target.value))} />
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: isTotalReflection ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>θ₂</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: isTotalReflection ? '#ef4444' : '#10b981', fontFamily: "'Outfit', sans-serif" }}>{isTotalReflection ? 'TIR!' : `${angle2.toFixed(1)}°`}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Refracted Angle vs Incident Angle</h3>
              <Graph data={angle2VsAngle1} xLabel="θ₁ (°)" yLabel="θ₂ (°)" title={`n₁=${n1.toFixed(1)}, n₂=${n2.toFixed(1)}`} color="#10b981" highlightX={angle1} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>{n1 < n2 ? '📈 Light bends towards normal when entering denser medium.' : '📈 Light bends away from normal when entering rarer medium.'}</p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Refracted Angle vs n₂ (θ₁={angle1}°)</h3>
              <Graph data={angle2VsN2} xLabel="n₂" yLabel="θ₂ (°)" title={`n₁sinθ₁ = n₂sinθ₂`} color="#8b5cf6" highlightX={n2} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📉 Higher n₂ → more bending towards normal → smaller θ₂.</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Deviation (|θ₁ − θ₂|) vs Incident Angle</h3>
            <Graph data={deviationVsAngle} xLabel="θ₁ (°)" yLabel="Deviation (°)" title="Angular deviation" color="#f59e0b" highlightX={angle1} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 Deviation increases with incident angle. At normal incidence (θ₁=0), there is no deviation.</p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator title="Snell's Law Calculator" formula="n₁ sin(θ₁) = n₂ sin(θ₂)" formulaDescription="Calculate refraction angle or refractive index"
            variables={[
              { name: 'n1', label: 'n₁', unit: '', color: '#06b6d4' },
              { name: 'theta1', label: 'θ₁', unit: '°', color: '#f59e0b' },
              { name: 'n2', label: 'n₂', unit: '', color: '#8b5cf6' },
              { name: 'theta2', label: 'θ₂', unit: '°', color: '#10b981' },
            ]}
            calculate={(vals) => {
              const nn1 = vals.n1, t1 = vals.theta1, nn2 = vals.n2, t2 = vals.theta2;
              const given = [nn1, t1, nn2, t2];
              const nullCount = given.filter(v => v === null).length;
              if (nullCount !== 1) throw new Error('Enter exactly 3 values');
              if (t2 === null && nn1 !== null && t1 !== null && nn2 !== null) {
                const s = (nn1 * Math.sin(t1 * Math.PI / 180)) / nn2;
                if (Math.abs(s) > 1) throw new Error('Total internal reflection — no refracted ray');
                const a = Math.asin(s) * 180 / Math.PI;
                return { results: { theta2: a } as Record<string, number | string>, steps: [`Given: n₁=${nn1}, θ₁=${t1}°, n₂=${nn2}`, `sin(θ₂) = n₁sin(θ₁)/n₂ = ${nn1}×sin(${t1}°)/${nn2}`, `sin(θ₂) = ${s.toFixed(6)}`, `θ₂ = ${a.toFixed(4)}°`] };
              }
              if (t1 === null && nn1 !== null && nn2 !== null && t2 !== null) {
                const s = (nn2 * Math.sin(t2 * Math.PI / 180)) / nn1;
                if (Math.abs(s) > 1) throw new Error('Invalid: sin > 1');
                const a = Math.asin(s) * 180 / Math.PI;
                return { results: { theta1: a } as Record<string, number | string>, steps: [`Given: n₁=${nn1}, n₂=${nn2}, θ₂=${t2}°`, `sin(θ₁) = n₂sin(θ₂)/n₁`, `θ₁ = ${a.toFixed(4)}°`] };
              }
              if (nn2 === null && nn1 !== null && t1 !== null && t2 !== null) {
                const r = (nn1 * Math.sin(t1 * Math.PI / 180)) / Math.sin(t2 * Math.PI / 180);
                return { results: { n2: r } as Record<string, number | string>, steps: [`Given: n₁=${nn1}, θ₁=${t1}°, θ₂=${t2}°`, `n₂ = n₁sin(θ₁)/sin(θ₂)`, `n₂ = ${r.toFixed(4)}`] };
              }
              if (nn1 === null && nn2 !== null && t1 !== null && t2 !== null) {
                const r = (nn2 * Math.sin(t2 * Math.PI / 180)) / Math.sin(t1 * Math.PI / 180);
                return { results: { n1: r } as Record<string, number | string>, steps: [`Given: n₂=${nn2}, θ₁=${t1}°, θ₂=${t2}°`, `n₁ = n₂sin(θ₂)/sin(θ₁)`, `n₁ = ${r.toFixed(4)}`] };
              }
              throw new Error('Invalid input');
            }}
          />
          <FormulaCalculator title="Critical Angle Calculator" formula="θc = sin⁻¹(n₂/n₁)" formulaDescription="Find the critical angle for total internal reflection (n₁ > n₂)"
            variables={[
              { name: 'n1', label: 'n₁ (denser)', unit: '', color: '#06b6d4' },
              { name: 'n2', label: 'n₂ (rarer)', unit: '', color: '#8b5cf6' },
            ]}
            calculate={(vals) => {
              const nn1 = vals.n1, nn2 = vals.n2;
              if (nn1 !== null && nn2 !== null) {
                if (nn1 <= nn2) throw new Error('n₁ must be > n₂ for TIR');
                const tc = Math.asin(nn2 / nn1) * 180 / Math.PI;
                return { results: { criticalAngle: tc }, steps: [`Given: n₁ = ${nn1}, n₂ = ${nn2}`, `θc = sin⁻¹(n₂/n₁) = sin⁻¹(${nn2}/${nn1})`, `θc = sin⁻¹(${(nn2 / nn1).toFixed(6)})`, `θc = ${tc.toFixed(4)}°`, `For θ₁ > ${tc.toFixed(1)}°, total internal reflection occurs.`] };
              }
              throw new Error('Enter both values');
            }}
          />
        </div>
      )}
    </div>
  );
}
