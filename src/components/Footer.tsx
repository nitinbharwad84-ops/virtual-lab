import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-border)',
      background: 'rgba(10, 10, 26, 0.8)',
      padding: '48px 24px 32px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            }}>🔬</div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 700 }}>
              Virtual<span className="gradient-text">Lab</span>
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
            Interactive science experiments for modern learners. Explore, experiment, and learn.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Quick Links
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { href: '/', label: 'Home' },
              { href: '/experiments', label: 'Experiments' },
              { href: '/dashboard', label: 'Dashboard' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{
                color: 'var(--color-text-muted)', fontSize: '14px', textDecoration: 'none',
                transition: 'color 0.2s',
              }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Experiments */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Experiments
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { href: '/experiments/ohms-law', label: "Ohm's Law" },
              { href: '/experiments/projectile-motion', label: 'Projectile Motion' },
              { href: '/experiments/acid-base-titration', label: 'Acid-Base Titration' },
              { href: '/experiments/pendulum', label: 'Simple Pendulum' },
              { href: '/experiments/lens-optics', label: 'Convex Lens' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{
                color: 'var(--color-text-muted)', fontSize: '14px', textDecoration: 'none',
                transition: 'color 0.2s',
              }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Support
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>help@virtuallab.io</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Documentation</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Privacy Policy</span>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '40px auto 0',
        paddingTop: '24px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          © 2026 VirtualLab. All rights reserved.
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          Built with Next.js & Supabase
        </p>
      </div>
    </footer>
  );
}
