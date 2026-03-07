import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const experiments = [
  { slug: 'ohms-law', title: "Ohm's Law", icon: '⚡', category: 'Physics', color: '#f59e0b', description: 'Explore voltage, current, and resistance relationships' },
  { slug: 'projectile-motion', title: 'Projectile Motion', icon: '🎯', category: 'Physics', color: '#8b5cf6', description: 'Study parabolic trajectories and gravity effects' },
  { slug: 'acid-base-titration', title: 'Acid-Base Titration', icon: '🧪', category: 'Chemistry', color: '#10b981', description: 'Perform virtual titration and observe pH changes' },
  { slug: 'pendulum', title: 'Simple Pendulum', icon: '🕐', category: 'Physics', color: '#06b6d4', description: 'Investigate factors affecting oscillation period' },
  { slug: 'lens-optics', title: 'Convex Lens Optics', icon: '🔬', category: 'Physics', color: '#ec4899', description: 'Study image formation by convex lenses' },
  { slug: 'hookes-law', title: "Hooke's Law", icon: '🔩', category: 'Physics', color: '#ef4444', description: 'Study spring force and elastic potential energy' },
  { slug: 'newton-cooling', title: "Newton's Cooling", icon: '🌡️', category: 'Physics', color: '#f97316', description: 'Observe exponential cooling over time' },
  { slug: 'rc-circuit', title: 'RC Circuit', icon: '🔌', category: 'Physics', color: '#a855f7', description: 'Simulate capacitor charging and discharging' },
  { slug: 'snells-law', title: "Snell's Law", icon: '🌈', category: 'Physics', color: '#14b8a6', description: 'Visualize light refraction between media' },
  { slug: 'boyles-law', title: "Boyle's Law", icon: '💨', category: 'Chemistry', color: '#6366f1', description: 'Explore gas pressure-volume relationship' },
];

const features = [
  { icon: '🧪', title: 'Interactive Experiments', desc: 'Run real-time simulations with adjustable parameters and instant visual feedback.' },
  { icon: '📊', title: 'Save & Track Results', desc: 'Save experiment results to your personal dashboard and track your learning progress.' },
  { icon: '🎨', title: 'Beautiful Visualizations', desc: 'See physics and chemistry come alive with smooth animations and detailed graphs.' },
  { icon: '🔒', title: 'Secure & Personal', desc: 'Your own account with saved experiments, accessible anywhere, anytime.' },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background Effects */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-20%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: '900px', textAlign: 'center', position: 'relative', zIndex: 1 }} className="animate-fade-in">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '100px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              fontSize: '14px',
              color: 'var(--color-accent-purple)',
              fontWeight: 500,
              marginBottom: '32px',
            }}>
              🚀 Interactive Science Learning Platform
            </div>

            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(40px, 7vw, 72px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '24px',
              letterSpacing: '-1px',
            }}>
              Your Science Lab,{' '}
              <span className="gradient-text">Reimagined</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              maxWidth: '640px',
              margin: '0 auto 40px',
            }}>
              Experience hands-on science without boundaries. Run interactive experiments in physics and chemistry,
              visualize results in real-time, and save your discoveries.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/experiments" className="btn-primary" style={{ padding: '16px 36px', fontSize: '16px' }}>
                Explore Experiments →
              </Link>
              <Link href="/signup" className="btn-secondary" style={{ padding: '16px 36px', fontSize: '16px' }}>
                Create Free Account
              </Link>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '48px',
              marginTop: '72px',
              flexWrap: 'wrap',
            }}>
              {[
                { value: '10+', label: 'Experiments' },
                { value: '100%', label: 'Interactive' },
                { value: 'Free', label: 'To Use' },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }} className="gradient-text">
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{
          padding: '80px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>
              Why Virtual<span className="gradient-text">Lab</span>?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '17px', maxWidth: '500px', margin: '0 auto' }}>
              Everything you need for a premium virtual science experience
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }} className="stagger-children">
            {features.map((f) => (
              <div key={f.title} className="glass-card" style={{ padding: '32px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', marginBottom: '20px',
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px', fontFamily: "'Outfit', sans-serif" }}>{f.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Experiments Section */}
        <section style={{
          padding: '80px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>
              Featured <span className="gradient-text">Experiments</span>
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '17px', maxWidth: '500px', margin: '0 auto' }}>
              Dive into interactive simulations across physics and chemistry
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }} className="stagger-children">
            {experiments.map((exp) => (
              <Link key={exp.slug} href={`/experiments/${exp.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="glass-card" style={{ padding: '28px', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '14px',
                      background: `${exp.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px',
                    }}>{exp.icon}</div>
                    <span style={{
                      padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500,
                      background: `${exp.color}15`, color: exp.color,
                      border: `1px solid ${exp.color}30`,
                    }}>{exp.category}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>{exp.title}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{exp.description}</p>
                  <div style={{
                    marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '14px', fontWeight: 500, color: 'var(--color-accent-purple)',
                  }}>
                    Start Experiment →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: '80px 24px',
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <div className="glass-card" style={{
            padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent)',
              borderRadius: '50%',
              filter: 'blur(40px)',
            }} />
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '32px', fontWeight: 700, marginBottom: '16px', position: 'relative' }}>
              Ready to Start <span className="gradient-text">Experimenting</span>?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px', marginBottom: '32px', position: 'relative' }}>
              Create your free account and begin your scientific journey today.
            </p>
            <Link href="/signup" className="btn-primary" style={{ padding: '16px 40px', fontSize: '16px', position: 'relative' }}>
              Get Started for Free →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
