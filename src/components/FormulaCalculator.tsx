'use client';

import { useState } from 'react';

interface Variable {
  name: string;
  label: string;
  unit: string;
  color: string;
}

interface CalculatorProps {
  title: string;
  formula: string;
  formulaDescription: string;
  variables: Variable[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculate: (values: Record<string, number | null>) => { results: Record<string, any>; steps: string[] };
}

export default function FormulaCalculator({ title, formula, formulaDescription, variables, calculate }: CalculatorProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, number | string> | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    setResults(null);
    setSteps([]);

    const numericValues: Record<string, number | null> = {};
    let filledCount = 0;

    for (const v of variables) {
      const raw = values[v.name];
      if (raw && raw.trim() !== '') {
        const num = parseFloat(raw);
        if (isNaN(num)) {
          setError(`Invalid value for ${v.label}`);
          return;
        }
        numericValues[v.name] = num;
        filledCount++;
      } else {
        numericValues[v.name] = null;
      }
    }

    if (filledCount < variables.length - 1) {
      setError(`Enter at least ${variables.length - 1} values to calculate the remaining`);
      return;
    }

    try {
      const { results: r, steps: s } = calculate(numericValues);
      setResults(r);
      setSteps(s);
    } catch {
      setError('Cannot compute with the given values. Check your inputs.');
    }
  };

  const handleClear = () => {
    setValues({});
    setResults(null);
    setSteps([]);
    setError('');
  };

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
        }}>🧮</div>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, fontFamily: "'Outfit', sans-serif", margin: 0 }}>
            {title}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>{formulaDescription}</p>
        </div>
      </div>

      {/* Formula Display */}
      <div style={{
        padding: '14px 20px', borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(6, 182, 212, 0.04))',
        border: '1px solid rgba(139, 92, 246, 0.12)',
        textAlign: 'center', marginBottom: '24px',
      }}>
        <span style={{
          fontSize: '18px', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
          letterSpacing: '1px',
        }} className="gradient-text">
          {formula}
        </span>
      </div>

      {/* Input Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(variables.length, 3)}, 1fr)`, gap: '14px', marginBottom: '20px' }}>
        {variables.map((v) => (
          <div key={v.name}>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: 600,
              color: v.color, marginBottom: '6px', textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {v.label} ({v.unit})
            </label>
            <input
              type="number"
              className="input-field"
              placeholder={`${v.label}`}
              value={values[v.name] || ''}
              onChange={(e) => setValues({ ...values, [v.name]: e.target.value })}
              style={{
                padding: '10px 14px', fontSize: '14px',
                borderColor: values[v.name] ? v.color + '40' : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button onClick={handleCalculate} className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>
          🔢 Calculate
        </button>
        <button onClick={handleClear} className="btn-secondary" style={{ padding: '12px 20px', fontSize: '14px' }}>
          Clear
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#f87171', fontSize: '13px', marginBottom: '16px',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Results + Steps */}
      {results && (
        <div className="animate-fade-in">
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(Object.keys(results).length, 3)}, 1fr)`,
            gap: '12px',
            marginBottom: '16px',
          }}>
            {Object.entries(results).map(([key, val]) => {
              const variable = variables.find((v) => v.name === key);
              return (
                <div key={key} style={{
                  padding: '14px', borderRadius: 'var(--radius-md)',
                  background: `${variable?.color || '#8b5cf6'}08`,
                  border: `1px solid ${variable?.color || '#8b5cf6'}20`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    {variable?.label || key}
                  </div>
                  <div style={{
                    fontSize: '20px', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                    color: variable?.color || '#8b5cf6',
                  }}>
                    {typeof val === 'number' ? val.toFixed(4) : val} {variable?.unit || ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Solution Steps */}
          {steps.length > 0 && (
            <div style={{
              padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.08)',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent-purple)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📝 Solution Steps
              </div>
              {steps.map((step, i) => (
                <div key={i} style={{
                  fontSize: '13px', color: 'var(--color-text-secondary)',
                  padding: '4px 0', lineHeight: 1.6,
                  display: 'flex', gap: '8px',
                }}>
                  <span style={{ color: 'var(--color-accent-cyan)', fontWeight: 700, minWidth: '20px' }}>{i + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
