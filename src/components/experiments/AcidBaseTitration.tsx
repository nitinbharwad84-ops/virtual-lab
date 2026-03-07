'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function AcidBaseTitration() {
  const [volumeAdded, setVolumeAdded] = useState(0);
  const [acidConcentration] = useState(0.1);
  const [acidVolume] = useState(50);
  const [baseConcentration] = useState(0.1);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataPoints, setDataPoints] = useState<{ volume: number; ph: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beakerRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  const calculatePH = useCallback((vBase: number) => {
    const molesAcid = acidConcentration * acidVolume / 1000;
    const molesBase = baseConcentration * vBase / 1000;
    const totalVolume = (acidVolume + vBase) / 1000;
    if (molesBase < molesAcid) {
      const excessH = (molesAcid - molesBase) / totalVolume;
      return -Math.log10(excessH);
    } else if (Math.abs(molesBase - molesAcid) < 0.0001) {
      return 7;
    } else {
      const excessOH = (molesBase - molesAcid) / totalVolume;
      return 14 - (-Math.log10(excessOH));
    }
  }, [acidConcentration, acidVolume, baseConcentration]);

  const currentPH = calculatePH(volumeAdded);
  const equivalenceVolume = (acidConcentration * acidVolume) / baseConcentration;

  const getSolutionColor = (ph: number) => {
    if (ph < 7) return `rgba(255, ${Math.max(100, 230 - ph * 15)}, ${Math.max(80, 200 - ph * 20)}, 0.7)`;
    if (ph < 8.2) return `rgba(255, 200, 200, 0.5)`;
    return `rgba(${Math.max(100, 255 - (ph - 8) * 30)}, 50, ${Math.min(255, 150 + (ph - 8) * 20)}, 0.6)`;
  };

  // Full pH curve data for Graph component
  const fullCurve = useMemo(() => {
    const pts = [];
    for (let v = 0; v <= 100; v += 0.5) {
      pts.push({ x: v, y: calculatePH(v) });
    }
    return pts;
  }, [calculatePH]);

  // pH rate of change (dpH/dV) for Graph component
  const rateOfChange = useMemo(() => {
    const pts = [];
    for (let v = 1; v <= 100; v += 1) {
      const dpH = calculatePH(v) - calculatePH(v - 1);
      pts.push({ x: v, y: Math.abs(dpH) });
    }
    return pts;
  }, [calculatePH]);

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width; const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; ctx.fillRect(0, 0, w, h);

    const padding = { top: 30, right: 30, bottom: 50, left: 55 };
    const graphW = w - padding.left - padding.right;
    const graphH = h - padding.top - padding.bottom;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 14; i += 2) {
      const y = padding.top + graphH - (i / 14) * graphH;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(i.toString(), padding.left - 8, y + 4);
    }
    for (let i = 0; i <= 100; i += 20) {
      const x = padding.left + (i / 100) * graphW;
      ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, h - padding.bottom); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${i}`, x, h - padding.bottom + 18);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '12px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Volume of NaOH added (mL)', w / 2, h - 8);
    ctx.save(); ctx.translate(15, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('pH', 0, 0); ctx.restore();

    const y7 = padding.top + graphH - (7 / 14) * graphH;
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(padding.left, y7); ctx.lineTo(w - padding.right, y7); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.5)'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('pH 7 (neutral)', w - padding.right - 80, y7 - 5);

    const eqX = padding.left + (equivalenceVolume / 100) * graphW;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)'; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(eqX, padding.top); ctx.lineTo(eqX, h - padding.bottom); ctx.stroke(); ctx.setLineDash([]);

    // Faded theoretical curve
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let v = 0; v <= 100; v += 0.5) {
      const ph = calculatePH(v);
      const x = padding.left + (v / 100) * graphW;
      const y = padding.top + graphH - (Math.min(ph, 14) / 14) * graphH;
      if (v === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Actual progress curve
    if (dataPoints.length > 0) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'; ctx.lineWidth = 3; ctx.beginPath();
      dataPoints.forEach((p, i) => {
        const x = padding.left + (p.volume / 100) * graphW;
        const y = padding.top + graphH - (Math.min(p.ph, 14) / 14) * graphH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const last = dataPoints[dataPoints.length - 1];
      const cx = padding.left + (last.volume / 100) * graphW;
      const cy = padding.top + graphH - (Math.min(last.ph, 14) / 14) * graphH;
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fillStyle = '#06b6d4'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fillStyle = 'rgba(6, 182, 212, 0.2)'; ctx.fill();
    }
  }, [dataPoints, calculatePH, equivalenceVolume]);

  const drawBeaker = useCallback(() => {
    const canvas = beakerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width; const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const beakerLeft = w * 0.2; const beakerRight = w * 0.8;
    const beakerTop = h * 0.15; const beakerBottom = h * 0.85;

    const fillLevel = 0.5 + (volumeAdded / 100) * 0.35;
    const solutionTop = beakerBottom - (beakerBottom - beakerTop) * fillLevel;
    const color = getSolutionColor(currentPH);

    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(beakerLeft + 4, solutionTop);
    for (let x = beakerLeft + 4; x < beakerRight - 4; x += 2) {
      ctx.lineTo(x, solutionTop + Math.sin((x - beakerLeft) * 0.08 + Date.now() * 0.002) * 2);
    }
    ctx.lineTo(beakerRight - 4, beakerBottom - 4);
    ctx.lineTo(beakerLeft + 4, beakerBottom - 4);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(beakerLeft, beakerTop); ctx.lineTo(beakerLeft, beakerBottom);
    ctx.lineTo(beakerRight, beakerBottom); ctx.lineTo(beakerRight, beakerTop); ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = beakerBottom - ((beakerBottom - beakerTop) * (i / 5));
      ctx.beginPath(); ctx.moveTo(beakerLeft, y); ctx.lineTo(beakerLeft + 15, y); ctx.stroke();
    }

    const buretteX = w / 2;
    ctx.fillStyle = 'rgba(100, 100, 200, 0.3)'; ctx.fillRect(buretteX - 4, 0, 8, beakerTop + 5);

    if (volumeAdded > 0) {
      const dropY = (Date.now() % 1000) / 1000 * (solutionTop - beakerTop);
      ctx.beginPath(); ctx.ellipse(buretteX, beakerTop + 5 + dropY, 3, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 100, 255, 0.6)'; ctx.fill();
    }

    ctx.fillStyle = currentPH < 7 ? '#ef4444' : currentPH < 8 ? '#10b981' : '#8b5cf6';
    ctx.font = 'bold 16px Outfit, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`pH ${currentPH.toFixed(2)}`, w / 2, beakerBottom + 25);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.font = '11px Inter, sans-serif';
    ctx.fillText('HCl + NaOH', w / 2, beakerBottom + 42);
  }, [volumeAdded, currentPH]);

  useEffect(() => { if (activeTab === 'simulation') drawGraph(); }, [drawGraph, activeTab]);
  useEffect(() => {
    if (activeTab !== 'simulation') return;
    let frame: number;
    const animate = () => { drawBeaker(); frame = requestAnimationFrame(animate); };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [drawBeaker, activeTab]);

  const addBase = (amount: number) => {
    const newVol = Math.min(volumeAdded + amount, 100);
    setVolumeAdded(newVol);
    const newPoints = [...dataPoints];
    for (let v = volumeAdded; v <= newVol; v += Math.max(amount / 5, 0.5)) {
      newPoints.push({ volume: v, ph: calculatePH(v) });
    }
    newPoints.push({ volume: newVol, ph: calculatePH(newVol) });
    setDataPoints(newPoints);
  };

  const handleReset = () => { setVolumeAdded(0); setDataPoints([]); };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Please sign in to save results'); setSaving(false); return; }
    const { data: experiments } = await supabase.from('experiments').select('id').eq('slug', 'acid-base-titration').single();
    if (experiments) {
      await supabase.from('experiment_results').insert({
        user_id: user.id, experiment_id: experiments.id,
        input_params: { acid_concentration: acidConcentration, acid_volume: acidVolume, base_concentration: baseConcentration, volume_added: volumeAdded },
        output_data: { final_pH: parseFloat(currentPH.toFixed(2)), equivalence_volume: parseFloat(equivalenceVolume.toFixed(2)), status: volumeAdded >= equivalenceVolume ? 'past_equivalence' : 'before_equivalence' },
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const tabs = [
    { key: 'simulation' as const, label: '🧪 Simulation' },
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Titration Setup</h3>
              <div className="canvas-container"><canvas ref={beakerRef} width={300} height={280} style={{ width: '100%', height: 'auto' }} /></div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>pH Curve</h3>
              <div className="canvas-container"><canvas ref={canvasRef} width={500} height={300} style={{ width: '100%', height: 'auto' }} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Add NaOH</h3>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Volume Added</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>{volumeAdded.toFixed(1)} mL</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ width: `${volumeAdded}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <button onClick={() => addBase(1)} className="btn-secondary" style={{ padding: '10px', fontSize: '13px' }}>+1 mL</button>
                <button onClick={() => addBase(5)} className="btn-secondary" style={{ padding: '10px', fontSize: '13px' }}>+5 mL</button>
                <button onClick={() => addBase(10)} className="btn-secondary" style={{ padding: '10px', fontSize: '13px' }}>+10 mL</button>
              </div>
              <button onClick={handleReset} className="btn-secondary" style={{ width: '100%', padding: '10px' }}>Reset Experiment</button>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: `${currentPH < 7 ? 'rgba(239, 68, 68, 0.08)' : currentPH <= 8 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(139, 92, 246, 0.08)'}`, border: `1px solid ${currentPH < 7 ? 'rgba(239, 68, 68, 0.15)' : currentPH <= 8 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)'}` }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Current pH</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: currentPH < 7 ? '#ef4444' : currentPH <= 8 ? '#10b981' : '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{currentPH.toFixed(2)}</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Equivalence Vol.</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>{equivalenceVolume.toFixed(1)} mL</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.15)', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Solution Status</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#06b6d4', fontFamily: "'Outfit', sans-serif" }}>
                    {currentPH < 6.5 ? '🔴 Acidic' : currentPH <= 7.5 ? '🟢 Neutral (Equivalence Point!)' : '🟣 Basic'}
                  </div>
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
                Adjust Volume — Graphs update in real-time
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>NaOH Volume</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#06b6d4' }}>{volumeAdded.toFixed(1)} mL</span>
                </div>
                <input type="range" min={0} max={100} step={0.5} value={volumeAdded} onChange={(e) => {
                  const newVol = Number(e.target.value);
                  setVolumeAdded(newVol);
                  const newPts = [];
                  for (let v = 0; v <= newVol; v += 0.5) {
                    newPts.push({ volume: v, ph: calculatePH(v) });
                  }
                  setDataPoints(newPts);
                }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: `${currentPH < 7 ? 'rgba(239, 68, 68, 0.08)' : currentPH <= 8 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(139, 92, 246, 0.08)'}`, border: `1px solid ${currentPH < 7 ? 'rgba(239, 68, 68, 0.15)' : currentPH <= 8 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)'}`, textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Current pH</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: currentPH < 7 ? '#ef4444' : currentPH <= 8 ? '#10b981' : '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{currentPH.toFixed(2)}</div>
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Equivalence</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>{equivalenceVolume.toFixed(0)} mL</div>
                </div>
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Status</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#06b6d4', fontFamily: "'Outfit', sans-serif" }}>{currentPH < 6.5 ? '🔴 Acidic' : currentPH <= 7.5 ? '🟢 Neutral' : '🟣 Basic'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
              Complete pH Titration Curve ({acidConcentration}M HCl + {baseConcentration}M NaOH)
            </h3>
            <Graph data={fullCurve} xLabel="Volume NaOH (mL)" yLabel="pH" title="Strong Acid-Strong Base" color="#06b6d4" highlightX={volumeAdded} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
              📈 Sharp pH jump at equivalence point ({equivalenceVolume} mL). Before: acidic. After: basic. Endpoint at pH ≈ 7.
            </p>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
              Rate of pH Change (|dpH/dV|)
            </h3>
            <Graph data={rateOfChange} xLabel="Volume NaOH (mL)" yLabel="|dpH/dV|" title="Derivative of pH curve" color="#ec4899" highlightX={volumeAdded} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
              📈 The maximum rate of change pinpoints the equivalence point — useful for precise endpoint determination.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator
            title="pH Calculator"
            formula="pH = −log₁₀[H⁺]"
            formulaDescription="Calculate pH from H⁺ concentration or vice versa"
            variables={[
              { name: 'pH', label: 'pH', unit: '', color: '#8b5cf6' },
              { name: 'H', label: '[H⁺]', unit: 'M', color: '#ef4444' },
            ]}
            calculate={(vals) => {
              const pH = vals.pH, H = vals.H;
              if (H !== null && pH === null) {
                const p = -Math.log10(H);
                const pOH = 14 - p;
                const OH = Math.pow(10, -pOH);
                return { results: { pH: p } as Record<string, number | string>, steps: [`Given: [H⁺] = ${H} M`, `pH = −log₁₀(${H})`, `pH = ${p.toFixed(4)}`, `pOH = 14 − pH = ${pOH.toFixed(4)}`, `[OH⁻] = 10^(−pOH) = ${OH.toExponential(4)} M`] };
              } else if (pH !== null && H === null) {
                const Hc = Math.pow(10, -pH);
                const pOH = 14 - pH;
                const OH = Math.pow(10, -pOH);
                return { results: { H: Hc } as Record<string, number | string>, steps: [`Given: pH = ${pH}`, `[H⁺] = 10^(−pH) = 10^(−${pH})`, `[H⁺] = ${Hc.toExponential(4)} M`, `pOH = 14 − ${pH} = ${pOH.toFixed(4)}`, `[OH⁻] = ${OH.toExponential(4)} M`] };
              }
              throw new Error('Enter pH or [H⁺]');
            }}
          />
          <FormulaCalculator
            title="Titration Equivalence Calculator"
            formula="C₁V₁ = C₂V₂"
            formulaDescription="Find unknown concentration or volume at equivalence"
            variables={[
              { name: 'C1', label: 'Acid Conc', unit: 'M', color: '#ef4444' },
              { name: 'V1', label: 'Acid Vol', unit: 'mL', color: '#f59e0b' },
              { name: 'C2', label: 'Base Conc', unit: 'M', color: '#8b5cf6' },
              { name: 'V2', label: 'Base Vol', unit: 'mL', color: '#06b6d4' },
            ]}
            calculate={(vals) => {
              const C1 = vals.C1, V1 = vals.V1, C2 = vals.C2, V2 = vals.V2;
              const given = [C1, V1, C2, V2];
              const nullCount = given.filter(v => v === null).length;
              if (nullCount !== 1) throw new Error('Enter exactly 3 values');
              if (C1 === null && V1 !== null && C2 !== null && V2 !== null) {
                const r = (C2 * V2) / V1;
                return { results: { C1: r } as Record<string, number | string>, steps: [`Given: V₁=${V1}mL, C₂=${C2}M, V₂=${V2}mL`, `C₁ = C₂V₂/V₁ = ${C2}×${V2}/${V1}`, `C₁ = ${r.toFixed(4)} M`] };
              }
              if (V1 === null && C1 !== null && C2 !== null && V2 !== null) {
                const r = (C2 * V2) / C1;
                return { results: { V1: r } as Record<string, number | string>, steps: [`Given: C₁=${C1}M, C₂=${C2}M, V₂=${V2}mL`, `V₁ = C₂V₂/C₁ = ${C2}×${V2}/${C1}`, `V₁ = ${r.toFixed(4)} mL`] };
              }
              if (C2 === null && C1 !== null && V1 !== null && V2 !== null) {
                const r = (C1 * V1) / V2;
                return { results: { C2: r } as Record<string, number | string>, steps: [`Given: C₁=${C1}M, V₁=${V1}mL, V₂=${V2}mL`, `C₂ = C₁V₁/V₂ = ${C1}×${V1}/${V2}`, `C₂ = ${r.toFixed(4)} M`] };
              }
              if (V2 === null && C1 !== null && V1 !== null && C2 !== null) {
                const r = (C1 * V1) / C2;
                return { results: { V2: r } as Record<string, number | string>, steps: [`Given: C₁=${C1}M, V₁=${V1}mL, C₂=${C2}M`, `V₂ = C₁V₁/C₂ = ${C1}×${V1}/${C2}`, `V₂ = ${r.toFixed(4)} mL`] };
              }
              throw new Error('Invalid input');
            }}
          />
        </div>
      )}
    </div>
  );
}
