import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const experiments = [
  {
    slug: 'ohms-law',
    title: "Ohm's Law",
    icon: '⚡',
    category: 'Physics',
    color: '#f59e0b',
    description: 'Explore the relationship between voltage, current, and resistance in an electrical circuit. Adjust voltage and resistance to observe how current changes.',
    difficulty: 'Beginner',
  },
  {
    slug: 'projectile-motion',
    title: 'Projectile Motion',
    icon: '🎯',
    category: 'Physics',
    color: '#8b5cf6',
    description: 'Launch a projectile at different angles and velocities to study parabolic trajectories. Observe how gravity affects the range and maximum height.',
    difficulty: 'Intermediate',
  },
  {
    slug: 'acid-base-titration',
    title: 'Acid-Base Titration',
    icon: '🧪',
    category: 'Chemistry',
    color: '#10b981',
    description: 'Perform a virtual titration by adding base to an acid solution. Watch how pH changes and identify the equivalence point on a real-time graph.',
    difficulty: 'Intermediate',
  },
  {
    slug: 'pendulum',
    title: 'Simple Pendulum',
    icon: '🕐',
    category: 'Physics',
    color: '#06b6d4',
    description: 'Investigate the factors affecting a pendulum\'s time period. Adjust length and observe the oscillation in a realistic animation.',
    difficulty: 'Beginner',
  },
  {
    slug: 'lens-optics',
    title: 'Convex Lens Optics',
    icon: '🔬',
    category: 'Physics',
    color: '#ec4899',
    description: 'Study image formation by a convex lens. Move the object and observe how the image position, size, and nature change according to the lens formula.',
    difficulty: 'Advanced',
  },
  {
    slug: 'hookes-law',
    title: "Hooke's Law",
    icon: '🔩',
    category: 'Physics',
    color: '#ef4444',
    description: 'Study the relationship between force and displacement in a spring. Discover how the spring constant affects restoring force and elastic potential energy.',
    difficulty: 'Beginner',
  },
  {
    slug: 'newton-cooling',
    title: "Newton's Cooling Law",
    icon: '🌡️',
    category: 'Physics',
    color: '#f97316',
    description: 'Observe how a hot object cools over time following an exponential decay curve. Explore the effect of cooling constant and ambient temperature.',
    difficulty: 'Intermediate',
  },
  {
    slug: 'rc-circuit',
    title: 'RC Circuit',
    icon: '🔌',
    category: 'Physics',
    color: '#a855f7',
    description: 'Simulate charging and discharging a capacitor through a resistor. Explore the time constant τ = RC and exponential voltage/current curves.',
    difficulty: 'Advanced',
  },
  {
    slug: 'snells-law',
    title: "Snell's Law",
    icon: '🌈',
    category: 'Physics',
    color: '#14b8a6',
    description: 'Visualize light refraction at the boundary between two media. Explore total internal reflection and calculate the critical angle.',
    difficulty: 'Intermediate',
  },
  {
    slug: 'boyles-law',
    title: "Boyle's Law",
    icon: '💨',
    category: 'Chemistry',
    color: '#6366f1',
    description: 'Investigate the inverse relationship between pressure and volume of a gas at constant temperature using PV = constant.',
    difficulty: 'Beginner',
  },
];

export default function ExperimentsPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          {/* Header */}
          <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px',
              borderRadius: '100px', background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)', fontSize: '14px',
              color: 'var(--color-accent-purple)', fontWeight: 500, marginBottom: '20px',
            }}>
              🧪 10 Interactive Experiments
            </div>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 800,
              marginBottom: '16px',
            }}>
              Explore Our <span className="gradient-text">Experiments</span>
            </h1>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: '17px',
              maxWidth: '540px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Each experiment features interactive simulations, real-time graphs,
              formula calculators, and the ability to save your results.
            </p>
          </div>

          {/* Experiment Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }} className="stagger-children">
            {experiments.map((exp) => (
              <Link key={exp.slug} href={`/experiments/${exp.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="glass-card" style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '16px',
                      background: `${exp.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '28px',
                    }}>{exp.icon}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500,
                        background: `${exp.color}15`, color: exp.color,
                        border: `1px solid ${exp.color}30`,
                      }}>{exp.category}</span>
                      <span style={{
                        padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500,
                        background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)',
                      }}>{exp.difficulty}</span>
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: '20px', fontWeight: 700, marginBottom: '10px',
                    fontFamily: "'Outfit', sans-serif",
                  }}>{exp.title}</h3>

                  <p style={{
                    color: 'var(--color-text-secondary)', fontSize: '14px',
                    lineHeight: 1.7, flex: 1,
                  }}>{exp.description}</p>

                  <div style={{
                    marginTop: '24px',
                    paddingTop: '20px', borderTop: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: exp.color }}>
                      Start Experiment →
                    </span>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: `${exp.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', color: exp.color,
                    }}>→</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
