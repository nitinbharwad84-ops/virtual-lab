import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OhmsLaw from '@/components/experiments/OhmsLaw';
import ProjectileMotion from '@/components/experiments/ProjectileMotion';
import AcidBaseTitration from '@/components/experiments/AcidBaseTitration';
import Pendulum from '@/components/experiments/Pendulum';
import LensOptics from '@/components/experiments/LensOptics';

const experimentComponents: Record<string, React.ComponentType> = {
  'ohms-law': OhmsLaw,
  'projectile-motion': ProjectileMotion,
  'acid-base-titration': AcidBaseTitration,
  'pendulum': Pendulum,
  'lens-optics': LensOptics,
};

const experimentInfo: Record<string, { title: string; icon: string; category: string; description: string }> = {
  'ohms-law': {
    title: "Ohm's Law",
    icon: '⚡',
    category: 'Physics',
    description: 'Explore the relationship between Voltage (V), Current (I), and Resistance (R) using Ohm\'s Law: V = I × R.',
  },
  'projectile-motion': {
    title: 'Projectile Motion',
    icon: '🎯',
    category: 'Physics',
    description: 'Study how launch angle and initial velocity affect the trajectory, range, and maximum height of a projectile.',
  },
  'acid-base-titration': {
    title: 'Acid-Base Titration',
    icon: '🧪',
    category: 'Chemistry',
    description: 'Add NaOH to HCl solution drop by drop and observe the pH change. Identify the equivalence point on the pH curve.',
  },
  'pendulum': {
    title: 'Simple Pendulum',
    icon: '🕐',
    category: 'Physics',
    description: 'Investigate how the length of a pendulum affects its time period using the formula T = 2π√(L/g).',
  },
  'lens-optics': {
    title: 'Convex Lens Optics',
    icon: '🔬',
    category: 'Physics',
    description: 'Explore image formation by a convex lens. Move the object and observe real/virtual image properties using the lens equation 1/f = 1/v − 1/u.',
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ExperimentPage({ params }: PageProps) {
  const { slug } = await params;
  const ExperimentComponent = experimentComponents[slug];
  const info = experimentInfo[slug];

  if (!ExperimentComponent || !info) {
    return (
      <>
        <Navbar />
        <main style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingTop: '72px',
        }}>
          <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '500px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', fontFamily: "'Outfit', sans-serif" }}>
              Experiment Not Found
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              The experiment you&apos;re looking for doesn&apos;t exist.
            </p>
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
          {/* Header */}
          <div className="animate-fade-in" style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500,
                background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-accent-purple)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}>{info.category}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(139, 92, 246, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px',
              }}>{info.icon}</div>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(28px, 4vw, 38px)',
                fontWeight: 800,
              }}>
                {info.title}
              </h1>
            </div>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: '16px',
              lineHeight: 1.6,
              maxWidth: '700px',
            }}>
              {info.description}
            </p>
          </div>

          {/* Experiment Component */}
          <ExperimentComponent />
        </div>
      </main>
      <Footer />
    </>
  );
}
