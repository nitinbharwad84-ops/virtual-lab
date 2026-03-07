'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';

interface ExperimentResult {
  id: string;
  experiment_id: string;
  input_params: Record<string, unknown>;
  output_data: Record<string, unknown>;
  created_at: string;
  experiments: {
    title: string;
    slug: string;
    icon: string;
    category: string;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser({
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name,
      });

      const { data } = await supabase
        .from('experiment_results')
        .select('*, experiments(title, slug, icon, category)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      setResults(data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('experiment_results').delete().eq('id', id);
    setResults(results.filter((r) => r.id !== id));
  };

  const uniqueExperiments = new Set(results.map((r) => r.experiment_id)).size;
  const thisWeekResults = results.filter(
    (r) => new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOutput = (output: Record<string, unknown>) => {
    return Object.entries(output)
      .map(([key, val]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const value = typeof val === 'number' ? (Number.isInteger(val) ? val : Number(val).toFixed(4)) : val;
        return `${label}: ${value}`;
      })
      .join(' | ');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '72px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-accent-purple)', borderRadius: '50%',
              margin: '0 auto 20px', animation: 'spin-slow 1s linear infinite',
            }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading your dashboard...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          {/* Welcome Header */}
          <div className="animate-fade-in" style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '8px',
            }}>
              Welcome back, <span className="gradient-text">{user?.full_name || 'Scientist'}</span> 👋
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>
              Here&apos;s an overview of your experiment results
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }} className="stagger-children">
            {[
              { label: 'Total Results', value: results.length, icon: '📊', color: '#8b5cf6' },
              { label: 'Experiments Tried', value: uniqueExperiments, icon: '🧪', color: '#06b6d4' },
              { label: 'This Week', value: thisWeekResults, icon: '📅', color: '#10b981' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                  <span style={{
                    padding: '4px 10px', borderRadius: '100px', fontSize: '11px',
                    background: `${stat.color}15`, color: stat.color, fontWeight: 600,
                  }}>
                    {stat.label}
                  </span>
                </div>
                <div style={{
                  fontSize: '36px', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                  color: stat.color,
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '40px',
            flexWrap: 'wrap',
          }}>
            <Link href="/experiments" className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
              🧪 Run New Experiment
            </Link>
          </div>

          {/* Results Table */}
          <div className="animate-slide-up">
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '22px',
              fontWeight: 600,
              marginBottom: '20px',
            }}>
              Saved Results
            </h2>

            {results.length === 0 ? (
              <div className="glass-card" style={{
                padding: '60px 24px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔬</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>
                  No experiments yet
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '24px' }}>
                  Run your first experiment and save the results to see them here!
                </p>
                <Link href="/experiments" className="btn-primary">
                  Browse Experiments →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.map((result) => (
                  <div key={result.id} className="glass-card" style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', flexShrink: 0,
                    }}>
                      {result.experiments?.icon || '🧪'}
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <Link
                          href={`/experiments/${result.experiments?.slug}`}
                          style={{
                            fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)',
                            textDecoration: 'none', fontFamily: "'Outfit', sans-serif",
                          }}
                        >
                          {result.experiments?.title || 'Experiment'}
                        </Link>
                        <span style={{
                          padding: '2px 8px', borderRadius: '100px', fontSize: '11px',
                          background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-accent-cyan)',
                        }}>
                          {result.experiments?.category}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        {formatOutput(result.output_data)}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {formatDate(result.created_at)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(result.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
