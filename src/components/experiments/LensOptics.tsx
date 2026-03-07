'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Graph from '@/components/Graph';
import FormulaCalculator from '@/components/FormulaCalculator';

export default function LensOptics() {
  const [objectDistance, setObjectDistance] = useState(30);
  const [focalLength, setFocalLength] = useState(15);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'graph' | 'calculator'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  const u = -objectDistance;
  const v = 1 / (1 / focalLength + 1 / u);
  const magnification = -v / u;
  const imageDistance = v;
  const imageHeight = magnification;
  const isReal = v > 0;
  const isInverted = magnification < 0;
  const isMagnified = Math.abs(magnification) > 1;

  // Graph: v vs u (for fixed f)
  const vVsU = useMemo(() => {
    const pts = [];
    for (let uu = 5; uu <= 60; uu += 0.5) {
      const uNeg = -uu;
      const vv = 1 / (1 / focalLength + 1 / uNeg);
      if (isFinite(vv) && Math.abs(vv) < 500) pts.push({ x: uu, y: vv });
    }
    return pts;
  }, [focalLength]);

  // Graph: magnification vs u
  const mVsU = useMemo(() => {
    const pts = [];
    for (let uu = 5; uu <= 60; uu += 0.5) {
      const uNeg = -uu;
      const vv = 1 / (1 / focalLength + 1 / uNeg);
      const m = -vv / uNeg;
      if (isFinite(m) && Math.abs(m) < 20) pts.push({ x: uu, y: Math.abs(m) });
    }
    return pts;
  }, [focalLength]);

  // Graph: v vs f (for fixed u)
  const vVsF = useMemo(() => {
    const pts = [];
    for (let ff = 5; ff <= 30; ff += 0.5) {
      const vv = 1 / (1 / ff + 1 / (-objectDistance));
      if (isFinite(vv) && Math.abs(vv) < 500) pts.push({ x: ff, y: vv });
    }
    return pts;
  }, [objectDistance]);

  const drawLens = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width; const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; ctx.fillRect(0, 0, w, h);

    const centerX = w / 2; const centerY = h / 2; const scale = 4;

    // Principal axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(w, centerY); ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let x = centerX % 40; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }

    // Lens
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)'; ctx.lineWidth = 3; const lensH = 140;
    ctx.beginPath(); ctx.moveTo(centerX, centerY - lensH / 2); ctx.quadraticCurveTo(centerX + 12, centerY, centerX, centerY + lensH / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, centerY - lensH / 2); ctx.quadraticCurveTo(centerX - 12, centerY, centerX, centerY + lensH / 2); ctx.stroke();

    ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.beginPath(); ctx.moveTo(centerX, centerY - lensH / 2); ctx.lineTo(centerX - 8, centerY - lensH / 2 + 10); ctx.lineTo(centerX + 8, centerY - lensH / 2 + 10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(centerX, centerY + lensH / 2); ctx.lineTo(centerX - 8, centerY + lensH / 2 - 10); ctx.lineTo(centerX + 8, centerY + lensH / 2 - 10); ctx.closePath(); ctx.fill();

    const fX1 = centerX - focalLength * scale; const fX2 = centerX + focalLength * scale;
    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px Inter, sans-serif';
    [fX1, fX2].forEach((fx, i) => {
      ctx.beginPath(); ctx.arc(fx, centerY, 4, 0, Math.PI * 2); ctx.fillStyle = '#f59e0b'; ctx.fill();
      ctx.fillText(i === 0 ? 'F' : "F'", fx - 4, centerY + 18);
    });

    const f2X1 = centerX - 2 * focalLength * scale; const f2X2 = centerX + 2 * focalLength * scale;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    [f2X1, f2X2].forEach((fx, i) => {
      ctx.beginPath(); ctx.arc(fx, centerY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.5)'; ctx.font = '11px Inter, sans-serif';
      ctx.fillText(i === 0 ? '2F' : "2F'", fx - 6, centerY + 18); ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    });

    // Object
    const objX = centerX - objectDistance * scale; const objH = 50;
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(objX, centerY); ctx.lineTo(objX, centerY - objH); ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.moveTo(objX, centerY - objH - 8); ctx.lineTo(objX - 6, centerY - objH + 4); ctx.lineTo(objX + 6, centerY - objH + 4); ctx.closePath(); ctx.fill();
    ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Object', objX, centerY + 16);

    // Image
    if (isFinite(v) && Math.abs(v) < 200) {
      const imgX = centerX + imageDistance * scale;
      const imgH = -imageHeight * objH;
      ctx.strokeStyle = isReal ? '#ec4899' : 'rgba(236, 72, 153, 0.4)'; ctx.lineWidth = 3;
      if (!isReal) ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(imgX, centerY); ctx.lineTo(imgX, centerY - imgH); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = isReal ? '#ec4899' : 'rgba(236, 72, 153, 0.4)';
      const dir = imgH > 0 ? -1 : 1;
      ctx.beginPath(); ctx.moveTo(imgX, centerY - imgH + dir * 8); ctx.lineTo(imgX - 6, centerY - imgH - dir * 4); ctx.lineTo(imgX + 6, centerY - imgH - dir * 4); ctx.closePath(); ctx.fill();
      ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(isReal ? 'Image (Real)' : 'Image (Virtual)', imgX, centerY + 16);
    }

    // Ray diagrams
    const objTopY = centerY - objH;

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(objX, objTopY); ctx.lineTo(centerX, objTopY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, objTopY);
    if (isReal) {
      const endX = Math.min(centerX + 200, w);
      const slope = (centerY - objTopY) / (fX2 - centerX);
      ctx.lineTo(endX, objTopY + slope * (endX - centerX));
    } else {
      ctx.lineTo(centerX + 150, objTopY + ((centerY - objTopY) / (fX2 - centerX)) * 150);
      ctx.stroke();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.beginPath(); ctx.moveTo(centerX, objTopY);
      ctx.lineTo(centerX - 100, objTopY + ((centerY - objTopY) / (fX2 - centerX)) * -100);
    }
    ctx.stroke(); ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(objX, objTopY);
    const ray2Slope = (objTopY - centerY) / (objX - centerX);
    const ray2EndX = isReal ? Math.min(centerX + 200, w) : Math.max(centerX - 200, 0);
    ctx.lineTo(ray2EndX, centerY + ray2Slope * (ray2EndX - centerX)); ctx.stroke();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)'; ctx.lineWidth = 1.5;
    const ray3SlopeToLens = (objTopY - centerY) / (objX - fX1);
    const ray3YAtLens = centerY + ray3SlopeToLens * (centerX - fX1);
    ctx.beginPath(); ctx.moveTo(objX, objTopY); ctx.lineTo(centerX, ray3YAtLens); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, ray3YAtLens); ctx.lineTo(w, ray3YAtLens); ctx.stroke();

    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Convex Lens', centerX, centerY - lensH / 2 - 12);
  }, [objectDistance, focalLength, v, imageDistance, imageHeight, magnification, isReal]);

  useEffect(() => { if (activeTab === 'simulation') drawLens(); }, [drawLens, activeTab]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Please sign in to save results'); setSaving(false); return; }
    const { data: experiments } = await supabase.from('experiments').select('id').eq('slug', 'lens-optics').single();
    if (experiments) {
      await supabase.from('experiment_results').insert({
        user_id: user.id, experiment_id: experiments.id,
        input_params: { object_distance: objectDistance, focal_length: focalLength },
        output_data: { image_distance: parseFloat(imageDistance.toFixed(2)), magnification: parseFloat(magnification.toFixed(3)), image_nature: isReal ? 'Real' : 'Virtual', image_orientation: isInverted ? 'Inverted' : 'Erect', image_size: isMagnified ? 'Magnified' : 'Diminished' },
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const tabs = [
    { key: 'simulation' as const, label: '🔬 Simulation' },
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
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Ray Diagram</h3>
            <div className="canvas-container"><canvas ref={canvasRef} width={600} height={380} style={{ width: '100%', height: 'auto' }} /></div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[{ c: 'rgba(139, 92, 246, 0.5)', l: 'Parallel ray' }, { c: 'rgba(16, 185, 129, 0.5)', l: 'Central ray' }, { c: 'rgba(245, 158, 11, 0.5)', l: 'Focal ray' }].map(r => (
                <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '16px', height: '3px', background: r.c }} />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{r.l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Controls</h3>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Object Distance (u)</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{objectDistance} cm</span>
                </div>
                <input type="range" min={5} max={60} step={1} value={objectDistance} onChange={(e) => setObjectDistance(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Focal Length (f)</label>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{focalLength} cm</span>
                </div>
                <input type="range" min={5} max={30} step={1} value={focalLength} onChange={(e) => setFocalLength(Number(e.target.value))} />
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Image Distance (v)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#ec4899', fontFamily: "'Outfit', sans-serif" }}>{isFinite(imageDistance) ? `${imageDistance.toFixed(1)} cm` : '∞'}</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Magnification (m)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{isFinite(magnification) ? magnification.toFixed(2) : '∞'}×</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                <span style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, background: isReal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: isReal ? '#10b981' : '#f59e0b', border: `1px solid ${isReal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}` }}>{isReal ? '✓ Real' : '◇ Virtual'}</span>
                <span style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)' }}>{isInverted ? '↕ Inverted' : '↑ Erect'}</span>
                <span style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.2)' }}>{isMagnified ? '🔍 Magnified' : '🔎 Diminished'}</span>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>1/v − 1/u = 1/f → 1/{isFinite(v) ? v.toFixed(1) : '∞'} − 1/({u}) = 1/{focalLength}</span>
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
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Object Distance</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>{objectDistance} cm</span>
                </div>
                <input type="range" min={5} max={60} step={1} value={objectDistance} onChange={(e) => setObjectDistance(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Focal Length</label>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{focalLength} cm</span>
                </div>
                <input type="range" min={5} max={30} step={1} value={focalLength} onChange={(e) => setFocalLength(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Image Dist</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#ec4899', fontFamily: "'Outfit', sans-serif" }}>{isFinite(imageDistance) ? `${imageDistance.toFixed(1)}` : '∞'} cm</div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Magnification</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>{isFinite(magnification) ? magnification.toFixed(2) : '∞'}×</div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Nature</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{isReal ? 'Real' : 'Virtual'}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Image Distance vs Object Distance (f={focalLength}cm)</h3>
              <Graph data={vVsU} xLabel="Object Distance u (cm)" yLabel="Image Distance v (cm)" title="v vs u" color="#ec4899" highlightX={objectDistance} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 As object moves towards focal point, image distance increases rapidly (diverges at u = f).</p>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Magnification vs Object Distance</h3>
              <Graph data={mVsU} xLabel="Object Distance u (cm)" yLabel="|Magnification|" title="|m| vs u" color="#8b5cf6" highlightX={objectDistance} showArea />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>{'📈 Magnification is > 1 when object is between f and 2f. At 2f, m = 1 (same size).'}</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>Image Distance vs Focal Length (u={objectDistance}cm)</h3>
            <Graph data={vVsF} xLabel="Focal Length f (cm)" yLabel="Image Distance v (cm)" title="v vs f" color="#f59e0b" highlightX={focalLength} showArea />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px', lineHeight: 1.5 }}>📈 Larger focal length → image distance increases. At f = u, the image is at infinity.</p>
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormulaCalculator
            title="Lens Equation Calculator"
            formula="1/f = 1/v − 1/u"
            formulaDescription="Find image distance, object distance, or focal length"
            variables={[
              { name: 'f', label: 'Focal Length', unit: 'cm', color: '#f59e0b' },
              { name: 'u', label: 'Object Dist (u)', unit: 'cm', color: '#10b981' },
              { name: 'v', label: 'Image Dist (v)', unit: 'cm', color: '#ec4899' },
            ]}
            calculate={(vals) => {
              const f = vals.f, uu = vals.u, vv = vals.v;
              if (uu !== null && f !== null) {
                const uSigned = -Math.abs(uu);
                const vCalc = 1 / (1 / f + 1 / uSigned);
                const m = -vCalc / uSigned;
                return { results: { v: vCalc } as Record<string, number | string>, steps: [`Given: f = ${f} cm, u = -${Math.abs(uu)} cm (sign convention)`, `1/v = 1/f − 1/|u| = 1/${f} + 1/${uSigned}`, `1/v = ${(1 / f).toFixed(5)} + ${(1 / uSigned).toFixed(5)} = ${(1 / f + 1 / uSigned).toFixed(5)}`, `v = ${vCalc.toFixed(4)} cm`, `Magnification m = -v/u = ${m.toFixed(4)}`, `Image: ${vCalc > 0 ? 'Real, Inverted' : 'Virtual, Erect'}, ${Math.abs(m) > 1 ? 'Magnified' : 'Diminished'}`] };
              } else if (vv !== null && f !== null) {
                const uCalc = 1 / (1 / vv - 1 / f);
                return { results: { u: Math.abs(uCalc) } as Record<string, number | string>, steps: [`Given: f = ${f} cm, v = ${vv} cm`, `1/u = 1/v − 1/f = 1/${vv} − 1/${f}`, `u = ${uCalc.toFixed(4)} cm`, `Object distance = ${Math.abs(uCalc).toFixed(4)} cm`] };
              } else if (uu !== null && vv !== null) {
                const uSigned = -Math.abs(uu);
                const fCalc = 1 / (1 / vv - 1 / uSigned);
                return { results: { f: fCalc } as Record<string, number | string>, steps: [`Given: u = -${Math.abs(uu)} cm, v = ${vv} cm`, `1/f = 1/v − 1/u = 1/${vv} − 1/${uSigned}`, `f = ${fCalc.toFixed(4)} cm`] };
              }
              throw new Error('Enter at least two values');
            }}
          />
          <FormulaCalculator
            title="Magnification Calculator"
            formula="m = v / u = hi / ho"
            formulaDescription="Calculate magnification, image height, or object height"
            variables={[
              { name: 'v', label: 'Image Distance', unit: 'cm', color: '#ec4899' },
              { name: 'u', label: 'Object Distance', unit: 'cm', color: '#10b981' },
              { name: 'ho', label: 'Object Height', unit: 'cm', color: '#06b6d4' },
            ]}
            calculate={(vals) => {
              const vv = vals.v, uu = vals.u, ho = vals.ho;
              if (vv !== null && uu !== null) {
                const m = -vv / (-Math.abs(uu));
                const hi = ho !== null ? m * ho : null;
                const steps = [`Given: v = ${vv} cm, u = -${Math.abs(uu)} cm`, `m = -v/u = -${vv}/(-${Math.abs(uu)}) = ${m.toFixed(4)}`];
                if (hi !== null && ho !== null) steps.push(`Image height hi = m × ho = ${m.toFixed(4)} × ${ho} = ${hi.toFixed(4)} cm`);
                steps.push(`Image: ${m < 0 ? 'Inverted' : 'Erect'}, ${Math.abs(m) > 1 ? 'Magnified' : 'Diminished'}`);
                const result: Record<string, number | string> = { m };
                if (hi !== null) result.hi = hi;
                return { results: result, steps };
              }
              throw new Error('Enter v and u');
            }}
          />
        </div>
      )}
    </div>
  );
}
