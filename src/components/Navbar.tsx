'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({ email: authUser.email, full_name: authUser.user_metadata?.full_name });
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email, full_name: session.user.user_metadata?.full_name });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/experiments', label: 'Experiments' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '0 24px',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(10, 10, 26, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
        }}>
          🔬
        </div>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
        }}>
          Virtual<span className="gradient-text">Lab</span>
        </span>
      </Link>

      {/* Desktop Nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
        className="desktop-nav"
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 500,
              color: pathname === link.href ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              background: pathname === link.href ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Auth Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-nav">
        {user ? (
          <>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {user.full_name || user.email}
            </span>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 20px', fontSize: '13px' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn-secondary" style={{ padding: '8px 20px', fontSize: '13px' }}>
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
              Get Started
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: 'var(--color-text-primary)',
          fontSize: '24px',
          cursor: 'pointer',
        }}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: '72px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 10, 26, 0.98)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 24px',
            gap: '12px',
            zIndex: 999,
          }}
          className="animate-fade-in"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: '14px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: '16px',
                fontWeight: 500,
                color: pathname === link.href ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                background: pathname === link.href ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                textDecoration: 'none',
                border: '1px solid var(--color-border)',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {user ? (
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="btn-secondary" style={{ width: '100%' }}>
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
