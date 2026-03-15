import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RCCircuit from '@/components/experiments/RCCircuit';

const experimentComponents: Record<string, React.ComponentType> = {
  'rc-circuit': RCCircuit,
};

const experimentInfo: Record<string, { title: string; icon: string; category: string; description: string }> = {
  'rc-circuit': {
    title: 'RC Circuit',
    icon: '🔌',
    category: 'Physics',
    description: 'Simulate charging and discharging of a capacitor through a resistor. Explore the time constant τ = RC and exponential voltage/current curves.',
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
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: '16px',
              maxWidth: '500px',
              margin: '0 auto',
            }}>
              The experiment you&apos;re looking for doesn&apos;t exist. Please visit the experiments page.
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
