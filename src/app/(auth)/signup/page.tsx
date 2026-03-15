'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    // Trigger welcome email (fire and forget)
    fetch('/api/auth/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName }),
    }).catch(console.error);

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="glass-card animate-fade-in" style={{
      width: '100%',
      maxWidth: '440px',
      padding: '48px 40px',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--gradient-primary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', marginBottom: '16px',
          }}>🔬</div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            {step === 'details' ? 'Create Account' : 'Verify Email'}
          </h1>
        </Link>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginTop: '8px' }}>
          {step === 'details' 
            ? 'Start your scientific journey today' 
            : `We've sent a 6-digit code to ${email}`}
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          fontSize: '14px',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {step === 'details' ? (
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Enter Code
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 700 }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>

          <button
            type="button"
            onClick={() => setStep('details')}
            className="btn-secondary"
            style={{ width: '100%', padding: '12px' }}
          >
            ← Back to Signup
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '28px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--color-accent-purple)', textDecoration: 'none', fontWeight: 600 }}>
          Sign In
        </Link>
      </p>
    </div>
  );
}

