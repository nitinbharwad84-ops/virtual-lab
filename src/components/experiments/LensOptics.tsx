'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LensOptics() {
  const [objectDistance, setObjectDistance] = useState(30); // cm (u)
  const [focalLength, setFocalLength] = useState(15); // cm (f)
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  // Lens equation: 1/v - 1/u = 1/f, where u is negative (object on left)
  const u = -objectDistance; // sign convention
  const v = 1 / (1 / focalLength + 1 / u); // image distance
  const magnification = -v / u;
  const imageDistance = v;
  const imageHeight = magnification; // relative to object of height 1

  const isReal = v > 0;
  const isInverted = magnification < 0;
  const isMagnified = Math.abs(magnification) > 1;

  const drawLens = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const scale = 4; // pixels per cm

    // Principal axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let x = centerX % 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Lens
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 3;
    const lensH = 140;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - lensH / 2);
    ctx.quadraticCurveTo(centerX + 12, centerY, centerX, centerY + lensH / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - lensH / 2);
    ctx.quadraticCurveTo(centerX - 12, centerY, centerX, centerY + lensH / 2);
    ctx.stroke();

    // Lens arrows
    ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
    // Top arrow
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - lensH / 2);
    ctx.lineTo(centerX - 8, centerY - lensH / 2 + 10);
    ctx.lineTo(centerX + 8, centerY - lensH / 2 + 10);
    ctx.closePath();
    ctx.fill();
    // Bottom arrow
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + lensH / 2);
    ctx.lineTo(centerX - 8, centerY + lensH / 2 - 10);
    ctx.lineTo(centerX + 8, centerY + lensH / 2 - 10);
    ctx.closePath();
    ctx.fill();

    // Focal points
    const fX1 = centerX - focalLength * scale;
    const fX2 = centerX + focalLength * scale;
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter, sans-serif';

    [fX1, fX2].forEach((fx, i) => {
      ctx.beginPath();
      ctx.arc(fx, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.fillText(i === 0 ? 'F' : "F'", fx - 4, centerY + 18);
    });

    // 2F points
    const f2X1 = centerX - 2 * focalLength * scale;
    const f2X2 = centerX + 2 * focalLength * scale;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    [f2X1, f2X2].forEach((fx, i) => {
      ctx.beginPath();
      ctx.arc(fx, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(i === 0 ? '2F' : "2F'", fx - 6, centerY + 18);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    });

    // Object (arrow on left side)
    const objX = centerX - objectDistance * scale;
    const objH = 50;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(objX, centerY);
    ctx.lineTo(objX, centerY - objH);
    ctx.stroke();
    // Arrowhead
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(objX, centerY - objH - 8);
    ctx.lineTo(objX - 6, centerY - objH + 4);
    ctx.lineTo(objX + 6, centerY - objH + 4);
    ctx.closePath();
    ctx.fill();
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Object', objX, centerY + 16);

    // Image (if formed)
    if (isFinite(v) && Math.abs(v) < 200) {
      const imgX = centerX + imageDistance * scale;
      const imgH = -imageHeight * objH; // negative because inverted

      ctx.strokeStyle = isReal ? '#ec4899' : 'rgba(236, 72, 153, 0.4)';
      ctx.lineWidth = 3;
      if (!isReal) ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(imgX, centerY);
      ctx.lineTo(imgX, centerY - imgH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Image arrowhead
      ctx.fillStyle = isReal ? '#ec4899' : 'rgba(236, 72, 153, 0.4)';
      const dir = imgH > 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(imgX, centerY - imgH + dir * 8);
      ctx.lineTo(imgX - 6, centerY - imgH - dir * 4);
      ctx.lineTo(imgX + 6, centerY - imgH - dir * 4);
      ctx.closePath();
      ctx.fill();
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isReal ? 'Image (Real)' : 'Image (Virtual)', imgX, centerY + 16);
    }

    // Ray diagrams (3 principal rays)
    const objTopY = centerY - objH;

    // Ray 1: Parallel to axis → through F' (after lens)
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(objX, objTopY);
    ctx.lineTo(centerX, objTopY);
    ctx.stroke();

    // After lens: converge through F'
    ctx.beginPath();
    ctx.moveTo(centerX, objTopY);
    if (isReal) {
      // extend to image or beyond
      const endX = Math.min(centerX + 200, w);
      const slope = (centerY - objTopY) / (fX2 - centerX);
      const endY = objTopY + slope * (endX - centerX);
      ctx.lineTo(endX, endY);
    } else {
      // Virtual: extends forward but appears to diverge from F on same side
      ctx.lineTo(centerX + 150, objTopY + ((centerY - objTopY) / (fX2 - centerX)) * 150);
      ctx.stroke();
      // Virtual extension (dashed)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.beginPath();
      ctx.moveTo(centerX, objTopY);
      ctx.lineTo(centerX - 100, objTopY + ((centerY - objTopY) / (fX2 - centerX)) * -100);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Ray 2: Through center of lens → straight
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(objX, objTopY);
    const ray2Slope = (objTopY - centerY) / (objX - centerX);
    const ray2EndX = isReal ? Math.min(centerX + 200, w) : Math.max(centerX - 200, 0);
    const ray2EndY = centerY + ray2Slope * (ray2EndX - centerX);
    ctx.lineTo(ray2EndX, ray2EndY);
    ctx.stroke();

    // Ray 3: Through F → parallel after lens
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1.5;
    // From object to lens (through F)
    const ray3SlopeToLens = (objTopY - centerY) / (objX - fX1);
    const ray3YAtLens = centerY + ray3SlopeToLens * (centerX - fX1);
    ctx.beginPath();
    ctx.moveTo(objX, objTopY);
    ctx.lineTo(centerX, ray3YAtLens);
    ctx.stroke();
    // After lens: parallel to axis
    ctx.beginPath();
    ctx.moveTo(centerX, ray3YAtLens);
    ctx.lineTo(w, ray3YAtLens);
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Convex Lens', centerX, centerY - lensH / 2 - 12);
  }, [objectDistance, focalLength, v, imageDistance, imageHeight, magnification, isReal]);

  useEffect(() => {
    drawLens();
  }, [drawLens]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to save results');
      setSaving(false);
      return;
    }

    const { data: experiments } = await supabase
      .from('experiments')
      .select('id')
      .eq('slug', 'lens-optics')
      .single();

    if (experiments) {
      await supabase.from('experiment_results').insert({
        user_id: user.id,
        experiment_id: experiments.id,
        input_params: { object_distance: objectDistance, focal_length: focalLength },
        output_data: {
          image_distance: parseFloat(imageDistance.toFixed(2)),
          magnification: parseFloat(magnification.toFixed(3)),
          image_nature: isReal ? 'Real' : 'Virtual',
          image_orientation: isInverted ? 'Inverted' : 'Erect',
          image_size: isMagnified ? 'Magnified' : 'Diminished',
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="animate-slide-up">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
      }}>
        {/* Ray Diagram */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
            Ray Diagram
          </h3>
          <div className="canvas-container">
            <canvas ref={canvasRef} width={600} height={380} style={{ width: '100%', height: 'auto' }} />
          </div>
          <div style={{
            marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '3px', background: 'rgba(139, 92, 246, 0.5)' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Parallel ray</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '3px', background: 'rgba(16, 185, 129, 0.5)' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Central ray</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '3px', background: 'rgba(245, 158, 11, 0.5)' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Focal ray</span>
            </div>
          </div>
        </div>

        {/* Controls & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
              Controls
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Object Distance (u)</label>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{objectDistance} cm</span>
              </div>
              <input type="range" min={5} max={60} step={1} value={objectDistance}
                onChange={(e) => setObjectDistance(Number(e.target.value))} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Focal Length (f)</label>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{focalLength} cm</span>
              </div>
              <input type="range" min={5} max={30} step={1} value={focalLength}
                onChange={(e) => setFocalLength(Number(e.target.value))} />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-secondary)' }}>
              Results
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Image Distance (v)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ec4899', fontFamily: "'Outfit', sans-serif" }}>
                  {isFinite(imageDistance) ? `${imageDistance.toFixed(1)} cm` : '∞'}
                </div>
              </div>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Magnification (m)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>
                  {isFinite(magnification) ? magnification.toFixed(2) : '∞'}×
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
              <span style={{
                padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
                background: isReal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: isReal ? '#10b981' : '#f59e0b',
                border: `1px solid ${isReal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
              }}>
                {isReal ? '✓ Real' : '◇ Virtual'}
              </span>
              <span style={{
                padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
                background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}>
                {isInverted ? '↕ Inverted' : '↑ Erect'}
              </span>
              <span style={{
                padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
                background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4',
                border: '1px solid rgba(6, 182, 212, 0.2)',
              }}>
                {isMagnified ? '🔍 Magnified' : '🔎 Diminished'}
              </span>
            </div>

            <div style={{
              marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.1)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                1/v − 1/u = 1/f → 1/{isFinite(v) ? v.toFixed(1) : '∞'} − 1/({u}) = 1/{focalLength}
              </span>
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary" disabled={saving}
            style={{ width: '100%', padding: '14px', opacity: saving ? 0.7 : 1 }}>
            {saved ? '✓ Result Saved!' : saving ? 'Saving...' : '💾 Save Result to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
