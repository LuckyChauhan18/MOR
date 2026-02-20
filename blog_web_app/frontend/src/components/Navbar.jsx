import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, User, Menu, X } from 'lucide-react';
import logo from '../assets/websiteLogo.png';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateUser = () => {
      const username = Cookies.get('username');
      const role = Cookies.get('userRole');
      if (username) {
        setUser({ username, role });
      } else {
        setUser(null);
      }
    };

    updateUser();
    const interval = setInterval(updateUser, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-close mobile menu when viewport widens past mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    Cookies.remove('userToken');
    Cookies.remove('username');
    Cookies.remove('userRole');
    setUser(null);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavClick = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '5px 20px',
        background: 'rgba(10, 10, 18, 0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Brand / Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <img src={logo} alt="Mor Logo" style={{ height: '60px', width: '60px', borderRadius: '50%', objectFit: 'cover' }} />
          <span className="text-gradient" style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>Mor</span>
        </Link>

        {/* Desktop: Animated Welcome Message */}
        <div className="nav-welcome" style={{ flex: 1, overflow: 'hidden', margin: '0 30px' }}>
          {user ? (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '-100%' }}
              transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              style={{ whiteSpace: 'nowrap' }}
            >
              <h2 className="text-gradient" style={{ display: 'inline-block', fontSize: '1rem', fontWeight: 'bold' }}>
                Hi, {user.username}! Welcome to your space. ✨ You are logged in as {user.role}.
              </h2>
            </motion.div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Welcome to AI Insights • Shared Creativity</div>
          )}
        </div>

        {/* Desktop Action Buttons */}
        <div className="nav-desktop-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '0.85rem', padding: '8px 14px', borderRadius: '10px', background: 'var(--glass)', textDecoration: 'none' }}>
                  <LayoutDashboard size={16} /> Admin
                </Link>
              )}
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '0.85rem', padding: '8px 14px', borderRadius: '10px', background: 'var(--glass)', textDecoration: 'none' }}>
                <User size={16} /> Profile
              </Link>
              <button
                onClick={() => navigate('/upload')}
                className="vibrant-gradient"
                style={{ padding: '8px 16px', borderRadius: '10px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Upload
              </button>
              <button
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.85rem', padding: '8px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'white', fontSize: '0.85rem', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', textDecoration: 'none' }}>Login</Link>
              <Link to="/signup" className="vibrant-gradient" style={{ color: 'white', fontSize: '0.85rem', padding: '8px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '8px',
          }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 1001,
              }}
            />
            <motion.div
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              style={{
                position: 'fixed',
                top: '70px',
                left: 0,
                right: 0,
                background: 'rgba(12, 10, 30, 0.98)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--glass-border)',
                zIndex: 1002,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {user && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(139, 92, 246, 0.08)',
                  borderRadius: '12px',
                  marginBottom: '6px',
                  borderLeft: '3px solid var(--primary)',
                }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>👋 Hi, {user.username}!</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'capitalize' }}>{user.role} account</p>
                </div>
              )}

              {user ? (
                <>
                  {user.role === 'admin' && (
                    <button onClick={() => handleNavClick('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left' }}>
                      <LayoutDashboard size={18} style={{ color: 'var(--primary)' }} /> Admin Dashboard
                    </button>
                  )}
                  <button onClick={() => handleNavClick('/profile')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left' }}>
                    <User size={18} style={{ color: 'var(--primary)' }} /> My Profile
                  </button>
                  <button onClick={() => handleNavClick('/upload')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.08))', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'white', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left', fontWeight: '600' }}>
                    ✍️ Upload Blog
                  </button>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.06)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left', marginTop: '4px' }}>
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleNavClick('/login')} style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}>
                    Login
                  </button>
                  <button onClick={() => handleNavClick('/signup')} className="vibrant-gradient" style={{ padding: '14px 16px', borderRadius: '12px', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700' }}>
                    Sign Up
                  </button>
                  <button onClick={() => handleNavClick('/login')} style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem' }}>
                    ✍️ Upload Blog
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .nav-welcome { display: none !important; }
          .nav-desktop-actions { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
